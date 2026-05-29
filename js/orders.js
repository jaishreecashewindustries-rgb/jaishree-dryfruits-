// ============================================================
// PURE NUTS — Orders Functions
// ============================================================

// ---- Place Order ----
async function placeOrder(formData, paymentMode) {
  const cart = getCart();
  if (cart.length === 0) { showToast('Cart is empty', 'error'); return null; }

  const subtotal = getCartTotal();
  const coupon   = JSON.parse(sessionStorage.getItem('pn_coupon') || 'null');
  const discount = coupon ? calcDiscount(subtotal, coupon) : 0;
  const delivery = subtotal - discount >= APP_CONFIG.freeDeliveryAbove ? 0 : APP_CONFIG.deliveryCharge;
  const total    = subtotal - discount + delivery;

  const orderId = generateOrderId();

  const order = {
    orderId,
    userId:       currentUser?.uid || 'guest',
    customerName: formData.name,
    email:        formData.email,
    phone:        formData.phone,
    address: {
      line1:    formData.address,
      city:     formData.city,
      state:    formData.state,
      pincode:  formData.pincode
    },
    items: cart.map(i => ({
      productId:    i.productId,
      name:         i.name,
      variantLabel: i.variantLabel,
      price:        i.price,
      qty:          i.qty,
      subtotal:     i.price * i.qty,
      image:        i.image
    })),
    subtotal, discount, delivery, total,
    couponCode:   coupon?.code || null,
    paymentMode,
    paymentStatus: paymentMode === 'cod' ? 'pending' : 'paid',
    status:       'pending',
    statusHistory: [{
      status: 'pending',
      time: new Date().toISOString(),
      note: 'Order placed'
    }],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await _db.collection('orders').doc(orderId).set(order);

    // Update customer stats
    if (currentUser) {
      await _db.collection('customers').doc(currentUser.uid).update({
        totalOrders: firebase.firestore.FieldValue.increment(1),
        totalSpent:  firebase.firestore.FieldValue.increment(total)
      });
    }

    // Clear cart & coupon
    saveCart([]);
    sessionStorage.removeItem('pn_coupon');

    // Send WhatsApp confirmation
    sendWhatsAppConfirmation(order);

    return orderId;
  } catch (e) {
    console.error('Order error:', e);
    showToast('Failed to place order. Try again.', 'error');
    return null;
  }
}

// ---- Razorpay Payment ----
async function initiateRazorpay(amount, orderId, customerData) {
  return new Promise((resolve, reject) => {
    const options = {
      key: APP_CONFIG.razorpayKey,
      amount: amount * 100,
      currency: 'INR',
      name: APP_CONFIG.appName,
      description: 'Order #' + orderId,
      handler: (response) => resolve(response),
      prefill: {
        name:    customerData.name,
        email:   customerData.email,
        contact: customerData.phone
      },
      theme: { color: '#3B1F0A' },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  });
}

// ---- Fetch Orders (customer) ----
async function fetchMyOrders() {
  if (!currentUser) return [];
  const snap = await _db.collection('orders')
    .where('userId', '==', currentUser.uid)
    .orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---- Fetch Single Order ----
async function fetchOrder(orderId) {
  const doc = await _db.collection('orders').doc(orderId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// ---- Cancel Order ----
async function cancelOrder(orderId) {
  const order = await fetchOrder(orderId);
  if (!order) return;
  if (!['pending','confirmed'].includes(order.status)) {
    showToast('This order cannot be cancelled', 'error'); return;
  }
  await _db.collection('orders').doc(orderId).update({
    status: 'cancelled',
    statusHistory: firebase.firestore.FieldValue.arrayUnion({
      status: 'cancelled',
      time: new Date().toISOString(),
      note: 'Cancelled by customer'
    })
  });
  showToast('Order cancelled successfully', 'info');
}

// ---- Render Order Status Timeline ----
function renderOrderTimeline(order) {
  const steps = ['pending','confirmed','packed','shipped','delivered'];
  const current = steps.indexOf(order.status);
  return `
    <div class="order-timeline">
      ${steps.map((s, i) => {
        const cfg = ORDER_STATUS[s];
        const done = i <= current && order.status !== 'cancelled';
        const hist = order.statusHistory?.find(h => h.status === s);
        return `
          <div class="timeline-step ${done ? 'done' : ''} ${order.status===s?'current':''}">
            <div class="timeline-icon">${cfg.icon}</div>
            <div class="timeline-label">${cfg.label}</div>
            ${hist ? `<div class="timeline-time">${new Date(hist.time).toLocaleString('en-IN')}</div>` : ''}
          </div>
          ${i < steps.length-1 ? `<div class="timeline-line ${i < current && order.status !== 'cancelled' ? 'done' : ''}"></div>` : ''}
        `;
      }).join('')}
    </div>`;
}

// ---- WhatsApp Confirmation ----
function sendWhatsAppConfirmation(order) {
  const msg = encodeURIComponent(
    `🎉 *Order Confirmed!*\n\n` +
    `Order ID: *${order.orderId}*\n` +
    `Amount: *${formatPrice(order.total)}*\n` +
    `Items: ${order.items.map(i => `${i.name} (${i.variantLabel}) x${i.qty}`).join(', ')}\n\n` +
    `Track your order at: ${window.location.origin}/orders.html?id=${order.orderId}\n\n` +
    `Thank you for shopping with Pure Nuts! 🥜`
  );
  // Open in new tab silently (optional)
  // window.open(`https://wa.me/${APP_CONFIG.whatsappNumber}?text=${msg}`, '_blank');
}

// ---- Render Order Card ----
function renderOrderCard(order) {
  const cfg = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  return `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <div class="order-id">Order #${order.orderId}</div>
          <div class="order-date">${formatDate(order.createdAt)}</div>
        </div>
        <span class="order-status-badge" style="background:${cfg.color}20;color:${cfg.color}">
          ${cfg.icon} ${cfg.label}
        </span>
      </div>
      <div class="order-items-preview">
        ${order.items.slice(0,3).map(i =>
          `<img src="${i.image||'assets/placeholder.png'}" title="${i.name}"
            onerror="this.src='assets/placeholder.png'">`
        ).join('')}
        ${order.items.length > 3 ? `<span>+${order.items.length-3} more</span>` : ''}
      </div>
      <div class="order-card-footer">
        <span class="order-total">${formatPrice(order.total)}</span>
        <div class="order-actions">
          <a href="orders.html?id=${order.orderId}" class="btn-sm">Track Order</a>
          ${['pending','confirmed'].includes(order.status) ?
            `<button class="btn-sm btn-danger" onclick="cancelOrder('${order.orderId}')">Cancel</button>` : ''}
        </div>
      </div>
    </div>`;
}
