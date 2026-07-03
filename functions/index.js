const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const templates = require("./emailTemplates");

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
