/**
 * Branded transactional/marketing email templates — Jai Shree Dryfruits.
 *
 * Every template returns { subject, html, senderKey }. `senderKey` maps to a
 * sender identity in SENDERS (index.js) — e.g. orders@ for order emails,
 * support@ for returns. Falls back to info@ for any sender not yet created
 * in Hostinger/Brevo, so nothing breaks if only info@ exists right now.
 *
 * Design language: premium D2C — generous whitespace, a restrained gold/brown
 * palette, serif display type paired with clean sans-serif body copy, subtle
 * dividers instead of heavy boxes, and a consistent 8px spacing rhythm.
 *
 * Email HTML has to be table-based, inline-styled, web-safe fonts only —
 * this is not a limitation of this codebase, it's how HTML email clients
 * (Outlook especially) work. Keeping all of that inside this one file means
 * the rest of the app never has to deal with it.
 */

const BRAND = {
  brown: "#3E2723",
  brownDark: "#241512",
  gold: "#C9A84C",
  goldLight: "#E8D9A8",
  cream: "#FBF8F2",
  border: "#EEE7D8",
  text: "#2A2118",
  muted: "#8A7F6F",
  logo: "https://jaishreedryfruits.com/logo.png",
  site: "https://jaishreedryfruits.com",
  name: "Jai Shree Dryfruits",
  address: "41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001, Rajasthan",
  phone: "+91 75685 77968",
};

const SERIF = "'Playfair Display','Georgia','Times New Roman',serif";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function wrap({ preheader = "", eyebrow = "", bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#EDE7DB;font-family:${SANS};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EDE7DB;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;">

          <!-- Wordmark band -->
          <tr>
            <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid ${BRAND.border};">
              <img src="${BRAND.logo}" alt="${BRAND.name}" height="38" style="height:38px;width:auto;display:inline-block;">
            </td>
          </tr>

          <!-- Eyebrow + body -->
          <tr>
            <td style="padding:44px 44px 8px;">
              ${eyebrow ? `<p style="margin:0 0 14px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${BRAND.gold};">${eyebrow}</p>` : ""}
              ${bodyHtml}
            </td>
          </tr>

          <tr><td style="padding:8px 44px 44px;"><div style="height:1px;background:${BRAND.border};"></div></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 44px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-family:${SERIF};font-size:15px;color:${BRAND.brown};font-style:italic;">${BRAND.name}</p>
              <p style="margin:0 0 3px;font-family:${SANS};font-size:12px;color:${BRAND.muted};line-height:1.6;">${BRAND.address}</p>
              <p style="margin:0 0 18px;font-family:${SANS};font-size:12px;color:${BRAND.muted};">${BRAND.phone} &nbsp;·&nbsp; <a href="mailto:info@jaishreedryfruits.com" style="color:${BRAND.muted};text-decoration:underline;">info@jaishreedryfruits.com</a></p>
              <p style="margin:0;font-family:${SANS};font-size:10.5px;color:#C4BAA8;letter-spacing:0.3px;">FSSAI CERTIFIED &nbsp;·&nbsp; EST. 1999 &nbsp;·&nbsp; JAIPUR, INDIA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text) {
  return `<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:28px;font-weight:600;line-height:1.25;color:${BRAND.brown};">${text}</h1>`;
}

function paragraph(text, opts = {}) {
  const { muted = false, size = 15 } = opts;
  return `<p style="margin:0 0 18px;font-family:${SANS};font-size:${size}px;line-height:1.65;color:${muted ? BRAND.muted : BRAND.text};">${text}</p>`;
}

function button(label, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr><td style="background:${BRAND.brown};border-radius:2px;">
    <a href="${href}" style="display:inline-block;padding:15px 36px;color:#ffffff;font-family:${SANS};font-size:13px;font-weight:600;text-decoration:none;letter-spacing:1.2px;text-transform:uppercase;">${label}</a>
  </td></tr></table>`;
}

function divider() {
  return `<div style="height:1px;background:${BRAND.border};margin:24px 0;"></div>`;
}

function infoCard(rows) {
  const cells = rows.map(([label, value]) => `
    <tr>
      <td style="padding:9px 0;font-family:${SANS};font-size:12px;letter-spacing:0.4px;text-transform:uppercase;color:${BRAND.muted};width:42%;">${label}</td>
      <td style="padding:9px 0;font-family:${SANS};font-size:14px;font-weight:600;color:${BRAND.brown};text-align:right;">${value}</td>
    </tr>`).join(`<tr><td colspan="2" style="border-bottom:1px solid ${BRAND.border};"></td></tr>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 28px;background:${BRAND.cream};border-radius:4px;">
    <tr><td style="padding:6px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cells}</table></td></tr>
  </table>`;
}

function itemsTable(items, formatPrice) {
  const rows = items.map((i) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${BRAND.border};font-family:${SANS};font-size:14px;color:${BRAND.text};">
        <span style="font-weight:600;">${i.name}</span>${i.variant ? `<br><span style="font-size:12px;color:${BRAND.muted};">${i.variant} × ${i.qty}</span>` : `<br><span style="font-size:12px;color:${BRAND.muted};">× ${i.qty}</span>`}
      </td>
      <td style="padding:14px 0;border-bottom:1px solid ${BRAND.border};font-family:${SANS};font-size:14px;color:${BRAND.text};text-align:right;white-space:nowrap;vertical-align:top;">${formatPrice(i.price * i.qty)}</td>
    </tr>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">${rows}</table>`;
}

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// ── OTP ──
function otpEmail({ name, code }) {
  return {
    subject: `${code} is your ${BRAND.name} verification code`,
    senderKey: "info",
    html: wrap({
      preheader: `Your verification code is ${code}`,
      eyebrow: "Verify it's you",
      bodyHtml: `
        ${heading(`Hi ${name || "there"},`)}
        ${paragraph("Enter the code below to continue. It expires in 10 minutes.")}
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr><td style="background:${BRAND.brown};padding:22px 40px;text-align:center;">
          <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#ffffff;">${code}</span>
        </td></tr></table>
        ${paragraph("Didn't request this? You can safely ignore this email.", { muted: true, size: 13 })}
      `,
    }),
  };
}

// ── Order confirmation ──
function orderConfirmationEmail({ name, orderId, items, subtotal, shipping, discount, coupon, coinsDiscount, total, address, paid }) {
  const summaryRows = [];
  if (subtotal != null) summaryRows.push(`<tr><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:${BRAND.muted};">Subtotal</td><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:${BRAND.text};text-align:right;">${fmt(subtotal)}</td></tr>`);
  if (shipping != null) summaryRows.push(`<tr><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:${BRAND.muted};">Shipping</td><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:${BRAND.text};text-align:right;">${shipping > 0 ? fmt(shipping) : "Free"}</td></tr>`);
  if (discount > 0) summaryRows.push(`<tr><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:#16a34a;">Discount${coupon ? ` (${coupon})` : ""}</td><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:#16a34a;text-align:right;">-${fmt(discount)}</td></tr>`);
  if (coinsDiscount > 0) summaryRows.push(`<tr><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:#16a34a;">JS Coins Redeemed</td><td style="padding:5px 0;font-family:${SANS};font-size:13px;color:#16a34a;text-align:right;">-${fmt(coinsDiscount)}</td></tr>`);
  const summaryTable = summaryRows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">${summaryRows.join("")}</table>`
    : "";

  return {
    subject: `Order Confirmed — #${orderId} | ${BRAND.name}`,
    senderKey: "orders",
    html: wrap({
      preheader: `Your order #${orderId} has been ${paid ? "paid" : "placed"} — thank you!`,
      eyebrow: "Order Confirmed",
      bodyHtml: `
        ${heading(`Thank you, ${name}.`)}
        ${paragraph(`Your order has been ${paid ? "received and payment confirmed" : "placed and will be prepared for Cash on Delivery"}.`)}
        ${infoCard([["Order Number", `#${orderId}`], ["Status", paid ? "Paid" : "Cash on Delivery"]])}
        ${itemsTable(items, fmt)}
        ${summaryTable}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;border-top:2px solid ${BRAND.brown};padding-top:14px;">
          <tr><td style="font-family:${SANS};font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:${BRAND.muted};">Total</td><td style="font-family:${SERIF};font-size:20px;font-weight:600;color:${BRAND.brown};text-align:right;">${fmt(total)}</td></tr>
        </table>
        ${divider()}
        ${paragraph(`<strong style="color:${BRAND.brown};">Delivering to</strong><br>${address}`, { muted: true, size: 13 })}
        ${button("Track Your Order", `${BRAND.site}/track-order`)}
      `,
    }),
  };
}

// ── Dispatch / shipped ──
function dispatchEmail({ name, orderId, courier, trackingId, trackingUrl }) {
  return {
    subject: `Your order #${orderId} is on its way | ${BRAND.name}`,
    senderKey: "orders",
    html: wrap({
      preheader: `Order #${orderId} has been dispatched via ${courier || "our logistics partner"}`,
      eyebrow: "Shipped",
      bodyHtml: `
        ${heading("It's on its way.")}
        ${paragraph(`Hi ${name}, your order <strong style="color:${BRAND.brown};">#${orderId}</strong> has left our facility and is headed to you.`)}
        ${(courier || trackingId) ? infoCard([...(courier ? [["Courier Partner", courier]] : []), ...(trackingId ? [["Tracking ID", trackingId]] : [])]) : ""}
        ${button("Track Shipment", trackingUrl || `${BRAND.site}/track-order`)}
        ${paragraph("We'll let you know the moment it's delivered.", { muted: true, size: 13 })}
      `,
    }),
  };
}

// ── Return / refund ──
function returnEmail({ name, orderId, refundAmount, refundMethod }) {
  return {
    subject: `Return processed for order #${orderId} | ${BRAND.name}`,
    senderKey: "support",
    html: wrap({
      preheader: `Your return for order #${orderId} has been processed`,
      eyebrow: "Return Processed",
      bodyHtml: `
        ${heading("Your return is complete.")}
        ${paragraph(`Hi ${name}, we've finished processing the return for order <strong style="color:${BRAND.brown};">#${orderId}</strong>.`)}
        ${infoCard([...(refundAmount ? [["Refund Amount", fmt(refundAmount)]] : []), ...(refundMethod ? [["Refund Method", refundMethod]] : [])])}
        ${paragraph("Refunds to your original payment method typically reflect within 5–7 business days. JS Coins credits are instant.", { muted: true, size: 13 })}
        ${paragraph(`Questions? Reply to this email or WhatsApp us at <strong style="color:${BRAND.brown};">${BRAND.phone}</strong>.`, { size: 13 })}
      `,
    }),
  };
}

// ── Welcome — new account ──
function welcomeEmail({ name }) {
  return {
    subject: `Welcome to ${BRAND.name}, ${name}`,
    senderKey: "info",
    html: wrap({
      preheader: "50 JS Coins credited — start shopping premium dry fruits",
      eyebrow: "Welcome",
      bodyHtml: `
        ${heading(`You're in, ${name}.`)}
        ${paragraph("You're now part of a family that's been sourcing India's finest dry fruits since 1999 — direct from Kashmir, California & Iran, FSSAI certified at every step.")}
        ${infoCard([["Welcome Gift", "50 JS Coins"], ["Free Shipping", "On orders above ₹499"]])}
        ${button("Start Shopping", `${BRAND.site}/products`)}
      `,
    }),
  };
}

// ── Coupon / offer ──
function couponEmail({ name, code, discountText, minOrder, expiry }) {
  return {
    subject: `${discountText} — your exclusive code inside | ${BRAND.name}`,
    senderKey: "info",
    html: wrap({
      preheader: `Use code ${code} for ${discountText}`,
      eyebrow: "Exclusive Offer",
      bodyHtml: `
        ${heading(`A gift for you, ${name || "friend"}.`)}
        ${paragraph(discountText)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr><td align="center" style="background:${BRAND.brown};padding:28px;">
          <p style="margin:0 0 8px;font-family:${SANS};color:${BRAND.gold};font-size:11px;letter-spacing:2px;text-transform:uppercase;">Your Code</p>
          <p style="margin:0;font-family:'Courier New',monospace;font-size:26px;font-weight:700;letter-spacing:5px;color:#ffffff;">${code}</p>
        </td></tr></table>
        ${paragraph(`${minOrder ? `Valid on orders above ${fmt(minOrder)}. ` : ""}${expiry ? `Expires ${expiry}.` : ""}`, { muted: true, size: 13 })}
        ${button("Shop Now", `${BRAND.site}/products`)}
      `,
    }),
  };
}

// ── Contact form auto-reply ──
function contactReplyEmail({ name, message }) {
  return {
    subject: `We've received your message | ${BRAND.name}`,
    senderKey: "support",
    html: wrap({
      preheader: "Thanks for reaching out — we'll respond within 4 business hours",
      eyebrow: "Message Received",
      bodyHtml: `
        ${heading(`Thanks for reaching out, ${name}.`)}
        ${paragraph("Our team has received your message and will get back to you within <strong>4 business hours</strong>.")}
        ${message ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 28px;background:${BRAND.cream};border-left:2px solid ${BRAND.gold};"><tr><td style="padding:18px 22px;font-family:${SANS};font-size:13px;color:${BRAND.muted};font-style:italic;line-height:1.6;">"${message}"</td></tr></table>` : ""}
        ${paragraph(`Need it faster? WhatsApp us at <strong style="color:${BRAND.brown};">${BRAND.phone}</strong>.`, { size: 13 })}
      `,
    }),
  };
}

// ── Newsletter subscription confirmation ──
function newsletterWelcomeEmail({ email }) {
  return {
    subject: `You're subscribed | ${BRAND.name}`,
    senderKey: "info",
    html: wrap({
      preheader: "Welcome to the Premium Club — offers, new arrivals & health tips",
      eyebrow: "Premium Club",
      bodyHtml: `
        ${heading("You're on the list.")}
        ${paragraph("You'll now be the first to hear about new arrivals, exclusive offers, and dry-fruit health tips drawn from our 25+ years of sourcing expertise.")}
        ${button("Explore Products", `${BRAND.site}/products`)}
        ${paragraph(`You're receiving this because you subscribed at ${BRAND.site}. You can unsubscribe anytime.`, { muted: true, size: 12 })}
      `,
    }),
  };
}

// ── Corporate/bulk gifting inquiry — internal notification to the owner ──
function b2bInquiryEmail({ orgName, eventType, budget, quantity, city, contact, notes }) {
  return {
    subject: `New Corporate Gifting Inquiry — ${orgName} | ${BRAND.name}`,
    senderKey: "orders",
    html: wrap({
      preheader: `${orgName} · ${quantity} units · ${city}`,
      eyebrow: "Corporate Gifting Lead",
      bodyHtml: `
        ${heading("New bulk/corporate inquiry received.")}
        ${infoCard([
          ["Organisation / Event", orgName],
          ["Occasion Type", eventType || "—"],
          ["Budget per Box", budget],
          ["Quantity", quantity],
          ["Delivery City", city],
          ["Contact Number", contact],
        ])}
        ${notes ? paragraph(`<strong>Special requirements:</strong> ${notes}`, { size: 13 }) : ""}
        ${paragraph("Respond within 2 business hours per the site's promise.", { muted: true, size: 12 })}
      `,
    }),
  };
}

module.exports = {
  otpEmail,
  orderConfirmationEmail,
  dispatchEmail,
  returnEmail,
  welcomeEmail,
  couponEmail,
  contactReplyEmail,
  newsletterWelcomeEmail,
  b2bInquiryEmail,
};
