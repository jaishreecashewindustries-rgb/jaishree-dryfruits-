import { formatPrice, formatDate } from "./helpers";

const COMPANY = {
  name: "Jai Shree Cashew Industries",
  address: "41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001, Rajasthan",
  phone: "+91 98290 XXXXX",
  email: "info@jaishreedryfruits.com",
  website: "jaishreedryfruits.com",
};

// Opens a printable invoice in a new tab — no PDF library needed, the
// browser's own print-to-PDF handles that, and it works identically for
// admin (OrderManagement) and customers (TrackOrder/UserDashboard) since
// they all just need to see/print/save the same document.
export function openInvoice(order, orderId) {
  const win = window.open("", "_blank");
  if (!win) return;

  const items = order.items || [];
  const rows = items
    .map(
      (i, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${i.name}${i.variant ? ` (${i.variant})` : ""}</td>
        <td style="text-align:center">${i.qty}</td>
        <td style="text-align:right">${formatPrice(i.price)}</td>
        <td style="text-align:right">${formatPrice(i.price * i.qty)}</td>
      </tr>`
    )
    .join("");

  const discountRow = order.discount
    ? `<tr><td colspan="4" style="text-align:right">Discount ${order.coupon?.code ? `(${order.coupon.code})` : ""}</td><td style="text-align:right">- ${formatPrice(order.discount)}</td></tr>`
    : "";
  const coinsRow = order.coinsDiscount
    ? `<tr><td colspan="4" style="text-align:right">JS Coins Redeemed</td><td style="text-align:right">- ${formatPrice(order.coinsDiscount)}</td></tr>`
    : "";

  win.document.write(`
    <html>
      <head>
        <title>Invoice ${orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #222; padding: 32px; max-width: 720px; margin: 0 auto; }
          h1 { font-size: 22px; margin: 0; color: #3E2723; }
          .muted { color: #888; font-size: 13px; }
          .row { display: flex; justify-content: space-between; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
          th, td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; }
          th { background: #f7f3ee; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #666; }
          .total-row td { font-weight: bold; font-size: 15px; border-top: 2px solid #3E2723; }
          .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="row">
          <div>
            <h1>${COMPANY.name}</h1>
            <p class="muted">${COMPANY.address}<br/>${COMPANY.phone} · ${COMPANY.email}</p>
          </div>
          <div style="text-align:right">
            <h2 style="margin:0">INVOICE</h2>
            <p class="muted">Order #${orderId.slice(0, 8).toUpperCase()}<br/>${formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div class="row">
          <div>
            <strong>Billed To</strong><br/>
            ${order.customerName || "Guest"}<br/>
            ${order.address?.address || ""}<br/>
            ${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.pincode || ""}<br/>
            ${order.customerPhone || ""}
          </div>
          <div style="text-align:right">
            <strong>Payment</strong><br/>
            ${(order.paymentMethod || "").toUpperCase()}<br/>
            ${order.paymentId ? `Txn: ${order.paymentId}` : "Cash on Delivery"}
            ${order.gstin ? `<br/>GSTIN: ${order.gstin}` : ""}
          </div>
        </div>

        <table>
          <thead>
            <tr><th>#</th><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Amount</th></tr>
          </thead>
          <tbody>
            ${rows}
            <tr><td colspan="4" style="text-align:right">Subtotal</td><td style="text-align:right">${formatPrice(order.subtotal)}</td></tr>
            ${discountRow}
            ${coinsRow}
            <tr><td colspan="4" style="text-align:right">Shipping</td><td style="text-align:right">${order.shipping ? formatPrice(order.shipping) : "Free"}</td></tr>
            <tr class="total-row"><td colspan="4" style="text-align:right">Total</td><td style="text-align:right">${formatPrice(order.total)}</td></tr>
          </tbody>
        </table>

        <div class="footer">
          This is a computer-generated invoice from ${COMPANY.website}. Thank you for shopping with us!
        </div>

        <div style="text-align:center; margin-top: 24px;">
          <button onclick="window.print()" style="background:#3E2723;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;">Print / Save as PDF</button>
        </div>
      </body>
    </html>
  `);
  win.document.close();
}
