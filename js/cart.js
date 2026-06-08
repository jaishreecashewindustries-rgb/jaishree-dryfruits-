// ============================================================
// PURE NUTS — Cart & Checkout Functions
// ============================================================

// ---- Render Cart Page ----
function renderCartPage() {
  const cart = getCart();
  const container = document.getElementById('cart-items');
  const summary   = document.getElementById('cart-summary');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some delicious nuts to your cart!</p>
        <a href="index.html" class="btn-primary">Shop Now</a>
      </div>`;
    if (summary) summary.style.display = 'none';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-key="${item.key}">
      <img src="${item.image || 'assets/placeholder.png'}" alt="${item.name}"
        onerror="this.src='assets/placeholder.png'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-variant">${item.variantLabel}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>
      <div class="cart-item-qty">
        <button onclick="updateQty('${item.key}', -1)">−</button>
        <span>${item.qty}</span>
        <button onclick="updateQty('${item.key}', 1)">+</button>
      </div>
      <div class="cart-item-total">${formatPrice(item.price * item.qty)}</div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.key}')">🗑️</button>
    </div>
  `).join('');

  renderCartSummary();
}

// ---- Update Quantity ----
function updateQty(key, delta) {
  const cart = getCart();
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  renderCartPage();
}

// ---- Remove from Cart ----
function removeFromCart(key) {
  const cart = getCart().filter(i => i.key !== key);
  saveCart(cart);
  renderCartPage();
  showToast('Item removed from cart', 'info');
}

// ---- Cart Summary ----
let appliedCoupon = null;

function renderCartSummary() {
  const cart = getCart();
  const subtotal  = getCartTotal();
  const delivery  = subtotal >= APP_CONFIG.freeDeliveryAbove ? 0 : APP_CONFIG.deliveryCharge;
  const discount  = appliedCoupon ? calcDiscount(subtotal, appliedCoupon) : 0;
  const total     = subtotal - discount + delivery;

  const el = document.getElementById('cart-summary');
  if (!el) return;

  const freeLeft = APP_CONFIG.freeDeliveryAbove - subtotal;

  el.innerHTML = `
    <h3>Order Summary</h3>
    ${freeLeft > 0 ? `
      <div class="free-delivery-bar">
        <div class="free-delivery-progress">
          <div class="free-delivery-fill" style="width:${Math.min(100,(subtotal/APP_CONFIG.freeDeliveryAbove)*100)}%"></div>
        </div>
        <small>Add ${formatPrice(freeLeft)} more for FREE delivery! 🚚</small>
      </div>` : `<div class="free-delivery-achieved">🎉 You've unlocked FREE delivery!</div>`}

    <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    ${discount > 0 ? `<div class="summary-row green"><span>Discount (${appliedCoupon.code})</span><span>-${formatPrice(discount)}</span></div>` : ''}
    <div class="summary-row"><span>Delivery</span><span>${delivery === 0 ? 'FREE' : formatPrice(delivery)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>

    <div class="coupon-section">
      <input id="coupon-input" type="text" placeholder="Enter coupon code" value="${appliedCoupon?.code||''}">
      <button onclick="applyCoupon()">${appliedCoupon ? 'Remove' : 'Apply'}</button>
    </div>

    <button class="btn-checkout" onclick="goToCheckout()">Proceed to Checkout →</button>
    <a href="index.html" class="btn-continue">← Continue Shopping</a>
  `;
}

// ---- Apply Coupon ----
async function applyCoupon() {
  if (appliedCoupon) {
    appliedCoupon = null;
    renderCartSummary();
    showToast('Coupon removed', 'info');
    return;
  }
  const code = document.getElementById('coupon-input')?.value.trim().toUpperCase();
  if (!code) { showToast('Enter a coupon code', 'error'); return; }

  const snap = await _db.collection('coupons')
    .where('code', '==', code)
    .where('active', '==', true).get();

  if (snap.empty) { showToast('Invalid or expired coupon', 'error'); return; }

  const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() };
  const subtotal = getCartTotal();

  if (coupon.minOrder && subtotal < coupon.minOrder) {
    showToast(`Minimum order ${formatPrice(coupon.minOrder)} required`, 'error'); return;
  }
  if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
    showToast('Coupon has expired', 'error'); return;
  }

  appliedCoupon = coupon;
  renderCartSummary();
  showToast(`Coupon applied! You save ${formatPrice(calcDiscount(subtotal, coupon))} 🎉`);
}

function calcDiscount(subtotal, coupon) {
  if (!coupon) return 0;
  if (coupon.type === 'percent') return Math.round(subtotal * coupon.value / 100);
  if (coupon.type === 'flat')    return Math.min(coupon.value, subtotal);
  return 0;
}

// ---- Go to Checkout ----
function goToCheckout() {
  if (getCart().length === 0) { showToast('Cart is empty', 'error'); return; }
  if (appliedCoupon) sessionStorage.setItem('pn_coupon', JSON.stringify(appliedCoupon));
  window.location.href = 'checkout.html';
}
