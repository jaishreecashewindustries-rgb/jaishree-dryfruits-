// ============================================================
// PURE NUTS — Products Functions
// ============================================================

// ---- Fetch All Products ----
async function fetchProducts(filters = {}) {
  let q = _db.collection('products').where('active', '==', true);
  if (filters.category) q = q.where('category', '==', filters.category);
  if (filters.sort === 'price_asc')  q = q.orderBy('minPrice', 'asc');
  if (filters.sort === 'price_desc') q = q.orderBy('minPrice', 'desc');
  if (filters.sort === 'newest')     q = q.orderBy('createdAt', 'desc');
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---- Fetch Single Product ----
async function fetchProduct(id) {
  const doc = await _db.collection('products').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// ---- Fetch Categories ----
async function fetchCategories() {
  const snap = await _db.collection('categories').orderBy('order').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---- Search Products ----
async function searchProducts(query) {
  const snap = await _db.collection('products').where('active', '==', true).get();
  const q = query.toLowerCase();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    );
}

// ---- Render Product Card ----
function renderProductCard(product) {
  const img = product.images?.[0] || 'assets/placeholder.png';
  const minPrice = product.variants?.reduce((m, v) => Math.min(m, v.price), Infinity) || 0;
  const wishlisted = isWishlisted(product.id);
  const badge = product.badge ? `<span class="prod-badge ${product.badge === 'Best Seller' ? 'badge-hot' : ''}">${product.badge}</span>` : '';
  const discount = product.originalPrice ? Math.round((1 - minPrice / product.originalPrice) * 100) : 0;

  return `
  <div class="product-card" data-id="${product.id}">
    <div class="prod-img-wrap">
      <img src="${img}" alt="${product.name}" class="prod-img" loading="lazy"
        onerror="this.src='assets/placeholder.png'">
      ${badge}
      ${discount > 0 ? `<span class="prod-discount">-${discount}%</span>` : ''}
      <button class="wish-btn ${wishlisted ? 'wishlisted' : ''}"
        onclick="handleWishlist(event,'${product.id}')" title="Wishlist">
        ${wishlisted ? '❤️' : '🤍'}
      </button>
      <div class="prod-overlay">
        <button class="btn-quick" onclick="openProductPage('${product.id}')">Quick View</button>
      </div>
    </div>
    <div class="prod-info">
      <div class="prod-category">${product.category || ''}</div>
      <div class="prod-name">${product.name}</div>
      <div class="prod-rating">
        ${renderStars(Math.round(product.avgRating || 0))}
        <span class="rating-count">(${product.reviewCount || 0})</span>
      </div>
      <div class="prod-price-row">
        <span class="prod-price">${formatPrice(minPrice)}</span>
        ${product.originalPrice ? `<span class="prod-original">${formatPrice(product.originalPrice)}</span>` : ''}
      </div>
      <div class="prod-variants-mini">
        ${(product.variants || []).map((v, i) =>
          `<button class="variant-mini ${i===0?'active':''}"
            onclick="selectVariantMini(this,'${product.id}',${i})">${v.label}</button>`
        ).join('')}
      </div>
      <button class="btn-add-cart" onclick="handleAddToCart('${product.id}')">
        Add to Cart 🛒
      </button>
    </div>
  </div>`;
}

// ---- Handle Add to Cart from listing ----
let _selectedVariants = {};
function selectVariantMini(btn, productId, idx) {
  btn.closest('.prod-variants-mini').querySelectorAll('.variant-mini').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _selectedVariants[productId] = idx;
}

async function handleAddToCart(productId) {
  const product = await fetchProduct(productId);
  if (!product) return;
  addToCart(product, _selectedVariants[productId] || 0);
}

// ---- Wishlist handler ----
function handleWishlist(e, productId) {
  e.stopPropagation();
  const added = toggleWishlist(productId);
  const btn = e.currentTarget;
  btn.textContent = added ? '❤️' : '🤍';
  btn.classList.toggle('wishlisted', added);
}

// ---- Open Product Page ----
function openProductPage(id) {
  window.location.href = `product.html?id=${id}`;
}

// ---- Submit Review ----
async function submitReview(productId, rating, comment) {
  if (!requireLogin()) return;
  const existing = await _db.collection('reviews')
    .where('productId', '==', productId)
    .where('userId', '==', currentUser.uid).get();
  if (!existing.empty) {
    showToast('You have already reviewed this product', 'error'); return;
  }
  await _db.collection('reviews').add({
    productId, userId: currentUser.uid,
    userName: currentUser.displayName || 'Customer',
    rating: parseInt(rating), comment,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    approved: false
  });
  showToast('Review submitted! It will appear after approval.');
}

// ---- Fetch Reviews ----
async function fetchReviews(productId) {
  const snap = await _db.collection('reviews')
    .where('productId', '==', productId)
    .where('approved', '==', true)
    .orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---- Update Product Rating ----
async function updateProductRating(productId) {
  const snap = await _db.collection('reviews')
    .where('productId', '==', productId)
    .where('approved', '==', true).get();
  if (snap.empty) return;
  const ratings = snap.docs.map(d => d.data().rating);
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  await _db.collection('products').doc(productId).update({
    avgRating: Math.round(avg * 10) / 10,
    reviewCount: ratings.length
  });
}

// ---- Pincode Check ----
async function checkPincode(pincode) {
  const doc = await _db.collection('pincodes').doc(pincode).get();
  return doc.exists ? doc.data() : null;
}
