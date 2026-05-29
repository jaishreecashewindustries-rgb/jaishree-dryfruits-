// ============================================================
// PURE NUTS — Utility Functions
// ============================================================

// Format price
function formatPrice(amount) {
  return APP_CONFIG.currency + Math.round(amount).toLocaleString('en-IN');
}

// Format date
function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Generate order ID
function generateOrderId() {
  return 'PN' + Date.now().toString().slice(-8).toUpperCase();
}

// Generate coupon code
function generateId(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Show toast notification
function showToast(msg, type = 'success') {
  const existing = document.getElementById('pn-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'pn-toast';
  t.className = `pn-toast pn-toast--${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}

// Show loading spinner
function showLoader(el, text = 'Loading...') {
  if (!el) return;
  el._original = el.innerHTML;
  el.disabled = true;
  el.innerHTML = `<span class="spinner"></span> ${text}`;
}

// Hide loading spinner
function hideLoader(el) {
  if (!el || !el._original) return;
  el.innerHTML = el._original;
  el.disabled = false;
}

// Validate email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate phone
function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

// Get cart from localStorage
function getCart() {
  try { return JSON.parse(localStorage.getItem('pn_cart') || '[]'); }
  catch { return []; }
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem('pn_cart', JSON.stringify(cart));
  updateCartBadge();
}

// Update cart badge in nav
function updateCartBadge() {
  const cart = getCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// Cart total
function getCartTotal() {
  return getCart().reduce((s, i) => s + (i.price * i.qty), 0);
}

// Add to cart
function addToCart(product, variantIdx = 0) {
  const cart = getCart();
  const variant = product.variants[variantIdx];
  const key = product.id + '_' + variantIdx;
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      key, productId: product.id,
      name: product.name,
      variantLabel: variant.label,
      price: variant.price,
      image: product.images?.[0] || '',
      qty: 1,
      variantIdx
    });
  }
  saveCart(cart);
  showToast(`${product.name} (${variant.label}) added to cart!`);
}

// Wishlist helpers
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('pn_wishlist') || '[]'); }
  catch { return []; }
}

function toggleWishlist(productId) {
  const wl = getWishlist();
  const idx = wl.indexOf(productId);
  if (idx > -1) { wl.splice(idx, 1); showToast('Removed from wishlist', 'info'); }
  else { wl.push(productId); showToast('Added to wishlist ❤️'); }
  localStorage.setItem('pn_wishlist', JSON.stringify(wl));
  return idx === -1;
}

function isWishlisted(productId) {
  return getWishlist().includes(productId);
}

// Debounce
function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// Slugify
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Get URL param
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// Truncate text
function truncate(str, n = 80) {
  return str.length > n ? str.slice(0, n) + '...' : str;
}

// Order status config
const ORDER_STATUS = {
  pending:    { label: 'Pending',    color: '#F59E0B', icon: '🕐' },
  confirmed:  { label: 'Confirmed',  color: '#3B82F6', icon: '✅' },
  packed:     { label: 'Packed',     color: '#8B5CF6', icon: '📦' },
  shipped:    { label: 'Shipped',    color: '#06B6D4', icon: '🚚' },
  delivered:  { label: 'Delivered',  color: '#10B981', icon: '🎉' },
  cancelled:  { label: 'Cancelled',  color: '#EF4444', icon: '❌' }
};

// Render stars
function renderStars(rating) {
  return Array.from({length: 5}, (_, i) =>
    `<span style="color:${i < rating ? '#F59E0B' : '#D1D5DB'}">★</span>`
  ).join('');
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Copied!'));
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});
