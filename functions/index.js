const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const templates = require("./emailTemplates");
const admin = require("firebase-admin");

admin.initializeApp();
const firestore = admin.firestore();

// Verifies the caller is a logged-in admin (same rule as firestore.rules'
// isAdmin()) from an Authorization: Bearer <idToken> header. Used by HTTP
// functions that need admin-only access but aren't reachable via
// firestore.rules (e.g. calling a third-party API like Razorpay).
async function requireAdmin(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const userDoc = await firestore.collection("users").doc(decoded.uid).get();
    return userDoc.exists && userDoc.data().role === "admin";
  } catch {
    return false;
  }
}

const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const BREVO_API_KEY = defineSecret("BREVO_API_KEY");

const REGION = "asia-south1"; // matches the project's existing extension function
const BREVO_API = "https://api.brevo.com/v3";
const SENDER = { name: "Jai Shree Dryfruits", email: "info@jaishreedryfruits.com" };

// Dedicated sender identities per email category, for a more professional
// "From" address (orders@ for order emails, support@ for returns, etc.)
// instead of always info@. Each of these mailboxes needs to actually exist
// (create in Hostinger email) AND be verified as a Brevo sender before it'll
// work — until then this safely falls back to info@, which is already
// verified, so nothing breaks while the others are being set up.
const SENDERS = {
  info: SENDER,
  orders: { name: "Jai Shree Dryfruits — Orders", email: "orders@jaishreedryfruits.com" },
  support: { name: "Jai Shree Dryfruits — Support", email: "support@jaishreedryfruits.com" },
};
function resolveSender(key) {
  return SENDERS[key] || SENDER;
}

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// ── POST /createOrder — { amount (rupees), receipt } → { order_id, amount, currency, key_id } ──
exports.createOrder = onRequest(
  { region: REGION, secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const { amount, receipt } = req.body || {};
      const amountPaise = Math.round(Number(amount) * 100);

      if (!amountPaise || !Number.isFinite(amountPaise) || amountPaise < 100) {
        return res.status(400).json({ error: "amount must be at least ₹1 (100 paise)" });
      }

      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID.value(),
        key_secret: RAZORPAY_KEY_SECRET.value(),
      });

      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: receipt || `receipt_${Date.now()}`,
      });

      return res.status(200).json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID.value(),
      });
    } catch (err) {
      logger.error("createOrder failed", err);
      const status = err?.statusCode === 401 ? 401 : 500;
      return res.status(status).json({ error: err?.error?.description || err.message || "Order creation failed" });
    }
  }
);

// ── POST /verifyPayment — { razorpay_order_id, razorpay_payment_id, razorpay_signature } → { success } ──
exports.verifyPayment = onRequest(
  { region: REGION, secrets: [RAZORPAY_KEY_SECRET], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET.value())
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const valid =
        expectedSignature.length === razorpay_signature.length &&
        crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

      if (!valid) {
        logger.warn("Razorpay signature mismatch", { razorpay_order_id, razorpay_payment_id });
        return res.status(400).json({ success: false, error: "Signature verification failed" });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      logger.error("verifyPayment failed", err);
      return res.status(500).json({ error: "Verification failed" });
    }
  }
);

// ── Firestore trigger: orders/{orderId} created → decrement variant stock ──
// Stock can't be decremented from the client (products are admin-write-only
// per firestore.rules), so it happens here with the Admin SDK, which bypasses
// rules safely — nothing else touches this order document to trigger it twice.
exports.onOrderCreated = onDocumentCreated(
  { region: REGION, document: "orders/{orderId}" },
  async (event) => {
    const order = event.data?.data();
    if (!order?.items?.length) return;

    for (const item of order.items) {
      if (!item.id || !item.variantId) continue;
      const productRef = firestore.collection("products").doc(item.id);
      try {
        await firestore.runTransaction(async (tx) => {
          const snap = await tx.get(productRef);
          if (!snap.exists) return;
          const variants = snap.data().variants || [];
          const idx = variants.findIndex((v) => v.id === item.variantId);
          if (idx === -1) return;
          const newVariants = variants.map((v, i) =>
            i === idx ? { ...v, stock: Math.max(0, (Number(v.stock) || 0) - (Number(item.qty) || 0)) } : v
          );
          tx.update(productRef, { variants: newVariants });
        });
      } catch (err) {
        logger.error("Stock decrement failed", { productId: item.id, variantId: item.variantId, err });
      }
    }
  }
);

// ── GET /getRazorpayPayments — admin-only, lists recent payments from Razorpay ──
exports.getRazorpayPayments = onRequest(
  { region: REGION, secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (!(await requireAdmin(req))) return res.status(403).json({ error: "Admin access required" });

    try {
      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID.value(),
        key_secret: RAZORPAY_KEY_SECRET.value(),
      });
      const count = Math.min(Number(req.query.count) || 50, 100);
      const skip = Number(req.query.skip) || 0;
      const result = await razorpay.payments.all({ count, skip });
      return res.status(200).json(result);
    } catch (err) {
      logger.error("getRazorpayPayments failed", err);
      return res.status(500).json({ error: err?.error?.description || err.message || "Failed to fetch payments" });
    }
  }
);

// ── POST /subscribeNewsletter — { email, name? } → adds/updates a Brevo contact ──
exports.subscribeNewsletter = onRequest(
  { region: REGION, secrets: [BREVO_API_KEY], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const { email, name } = req.body || {};
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "A valid email is required" });
      }

      const brevoRes = await fetch(`${BREVO_API}/contacts`, {
        method: "POST",
        headers: { "api-key": BREVO_API_KEY.value(), "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          attributes: name ? { FIRSTNAME: name } : undefined,
          updateEnabled: true, // don't fail if the contact already exists — just update it
        }),
      });

      // Brevo returns 204 for update-existing, 201 for newly created — both are success.
      if (!brevoRes.ok && brevoRes.status !== 204) {
        const errBody = await brevoRes.json().catch(() => ({}));
        logger.error("Brevo subscribe failed", errBody);
        return res.status(502).json({ error: errBody?.message || "Could not subscribe" });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      logger.error("subscribeNewsletter failed", err);
      return res.status(500).json({ error: "Subscription failed" });
    }
  }
);

// ── POST /sendTransactionalEmail — { to, toName?, subject, htmlContent } → sends via Brevo ──
// Generic transactional sender — used for order confirmations and any other
// one-off customer email. Keep templating (subject/HTML) on the caller side
// so this function stays reusable rather than order-specific.
exports.sendTransactionalEmail = onRequest(
  { region: REGION, secrets: [BREVO_API_KEY], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const { to, toName, subject, htmlContent } = req.body || {};
      if (!to || !subject || !htmlContent) {
        return res.status(400).json({ error: "to, subject, and htmlContent are required" });
      }

      const brevoRes = await fetch(`${BREVO_API}/smtp/email`, {
        method: "POST",
        headers: { "api-key": BREVO_API_KEY.value(), "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: SENDER,
          to: [{ email: to, name: toName || undefined }],
          subject,
          htmlContent,
        }),
      });

      if (!brevoRes.ok) {
        const errBody = await brevoRes.json().catch(() => ({}));
        logger.error("Brevo send failed", errBody);
        return res.status(502).json({ error: errBody?.message || "Could not send email" });
      }

      const data = await brevoRes.json();
      return res.status(200).json({ success: true, messageId: data.messageId });
    } catch (err) {
      logger.error("sendTransactionalEmail failed", err);
      return res.status(500).json({ error: "Send failed" });
    }
  }
);

// ── POST /sendTemplatedEmail — { to, toName?, template, data } → branded email via Brevo ──
// `template` is one of the exports in emailTemplates.js (otp, orderConfirmation,
// dispatch, return, welcome, coupon, contactReply, newsletterWelcome). Keeping
// the actual HTML generation server-side means every caller (frontend order
// flow, admin panel status changes, signup) gets the same professional,
// on-brand design without duplicating markup anywhere.
const TEMPLATE_BUILDERS = {
  otp: templates.otpEmail,
  orderConfirmation: templates.orderConfirmationEmail,
  dispatch: templates.dispatchEmail,
  return: templates.returnEmail,
  welcome: templates.welcomeEmail,
  coupon: templates.couponEmail,
  contactReply: templates.contactReplyEmail,
  newsletterWelcome: templates.newsletterWelcomeEmail,
  b2bInquiry: templates.b2bInquiryEmail,
};

exports.sendTemplatedEmail = onRequest(
  { region: REGION, secrets: [BREVO_API_KEY], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const { to, toName, template, data } = req.body || {};
      if (!to || !template) return res.status(400).json({ error: "to and template are required" });

      const builder = TEMPLATE_BUILDERS[template];
      if (!builder) return res.status(400).json({ error: `Unknown template "${template}". Valid: ${Object.keys(TEMPLATE_BUILDERS).join(", ")}` });

      const { subject, html, senderKey } = builder(data || {});

      const brevoRes = await fetch(`${BREVO_API}/smtp/email`, {
        method: "POST",
        headers: { "api-key": BREVO_API_KEY.value(), "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: resolveSender(senderKey),
          to: [{ email: to, name: toName || undefined }],
          subject,
          htmlContent: html,
        }),
      });

      if (!brevoRes.ok) {
        const errBody = await brevoRes.json().catch(() => ({}));
        logger.error("Brevo templated send failed", { template, errBody });
        return res.status(502).json({ error: errBody?.message || "Could not send email" });
      }

      const resData = await brevoRes.json();
      return res.status(200).json({ success: true, messageId: resData.messageId });
    } catch (err) {
      logger.error("sendTemplatedEmail failed", err);
      return res.status(500).json({ error: "Send failed" });
    }
  }
);

// ── POST /sendBulkEmail — admin-only, { subject, html, recipients: [{email,name}] } ──
// Sends one Brevo call per recipient (no bulk-recipient API call, so one
// bounced/invalid address can't take the whole batch down) with a small
// delay between sends to stay well under Brevo's rate limits.
exports.sendBulkEmail = onRequest(
  { region: REGION, secrets: [BREVO_API_KEY], cors: true, timeoutSeconds: 540 },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!(await requireAdmin(req))) return res.status(403).json({ error: "Admin access required" });

    const { subject, html, recipients } = req.body || {};
    if (!subject || !html || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "subject, html and a non-empty recipients array are required" });
    }
    if (recipients.length > 500) {
      return res.status(400).json({ error: "Max 500 recipients per send — split into smaller batches" });
    }

    let sent = 0;
    const failed = [];
    for (const r of recipients) {
      if (!r.email) continue;
      try {
        const brevoRes = await fetch(`${BREVO_API}/smtp/email`, {
          method: "POST",
          headers: { "api-key": BREVO_API_KEY.value(), "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: SENDER,
            to: [{ email: r.email, name: r.name || undefined }],
            subject,
            htmlContent: html,
          }),
        });
        if (brevoRes.ok) sent++;
        else failed.push(r.email);
      } catch {
        failed.push(r.email);
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    return res.status(200).json({ sent, failed });
  }
);

// ── Email OTP — passwordless login + OTP-based password reset ──
// Codes live in Firestore (email_otps/{email}), 6 digits, 10-minute expiry,
// max 5 verify attempts before the code is invalidated outright (rather than
// just rate-limited) — this is a low-friction consumer flow, not a banking
// app, so a short deliberately-simple scheme is the right tradeoff here.
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

exports.sendEmailOTP = onRequest(
  { region: REGION, secrets: [BREVO_API_KEY], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const { email, purpose } = req.body || {};
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "A valid email is required" });
      }
      if (!["login", "reset"].includes(purpose)) {
        return res.status(400).json({ error: "purpose must be 'login' or 'reset'" });
      }

      // Both flows require an existing account — email OTP login isn't a
      // signup mechanism, and you can't reset a password that doesn't exist.
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
      } catch {
        // Don't reveal whether an email is registered — same response either way.
        return res.status(200).json({ success: true });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      await firestore.collection("email_otps").doc(email).set({
        code,
        purpose,
        uid: userRecord.uid,
        expiresAt: Date.now() + OTP_TTL_MS,
        attempts: 0,
      });

      const { subject, html, senderKey } = templates.otpEmail({ name: userRecord.displayName || "there", code });
      const brevoRes = await fetch(`${BREVO_API}/smtp/email`, {
        method: "POST",
        headers: { "api-key": BREVO_API_KEY.value(), "Content-Type": "application/json" },
        body: JSON.stringify({ sender: resolveSender(senderKey), to: [{ email }], subject, htmlContent: html }),
      });
      if (!brevoRes.ok) {
        const errBody = await brevoRes.json().catch(() => ({}));
        logger.error("OTP email send failed", errBody);
        return res.status(502).json({ error: "Could not send verification email" });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      logger.error("sendEmailOTP failed", err);
      return res.status(500).json({ error: "Could not send verification code" });
    }
  }
);

exports.verifyEmailOTP = onRequest(
  { region: REGION },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const { email, code, purpose, newPassword } = req.body || {};
      if (!email || !code || !purpose) {
        return res.status(400).json({ error: "email, code, and purpose are required" });
      }
      if (purpose === "reset" && (!newPassword || newPassword.length < 6)) {
        return res.status(400).json({ error: "newPassword must be at least 6 characters" });
      }

      const ref = firestore.collection("email_otps").doc(email);
      const snap = await ref.get();
      if (!snap.exists) return res.status(400).json({ error: "No verification code found — request a new one" });

      const record = snap.data();
      if (record.purpose !== purpose) return res.status(400).json({ error: "Verification code was requested for a different purpose" });
      if (Date.now() > record.expiresAt) { await ref.delete(); return res.status(400).json({ error: "Code expired — request a new one" }); }
      if (record.attempts >= OTP_MAX_ATTEMPTS) { await ref.delete(); return res.status(400).json({ error: "Too many attempts — request a new code" }); }

      if (record.code !== String(code)) {
        await ref.update({ attempts: admin.firestore.FieldValue.increment(1) });
        return res.status(400).json({ error: "Incorrect code" });
      }

      // Correct — consume the code immediately so it can't be replayed.
      await ref.delete();

      if (purpose === "login") {
        const token = await admin.auth().createCustomToken(record.uid);
        return res.status(200).json({ success: true, token });
      }

      // purpose === "reset"
      await admin.auth().updateUser(record.uid, { password: newPassword });
      return res.status(200).json({ success: true });
    } catch (err) {
      logger.error("verifyEmailOTP failed", err);
      return res.status(500).json({ error: "Verification failed" });
    }
  }
);
