// ============================================================
// PURE NUTS — Admin Panel Functions
// ============================================================

// ---- Dashboard Stats ----
async function loadDashboard() {
  const [ordersSnap, customersSnap, productsSnap] = await Promise.all([
    _db.collection('orders').get(),
    _db.collection('customers').get(),
    _db.collection('products').get()
  ]);

  const orders = ordersSnap.docs.map(d => d.data());
  const today  = new Date(); today.setHours(0,0,0,0);

  const totalRevenue   = orders.filter(o => o.status !== 'cancelled').reduce((s,o) => s + (o.total||0), 0);
  const todayOrders    = orders.filter(o => o.createdAt?.toDate() >= today);
  const pendingOrders  = orders.filter(o => o.status === 'pending').length;
  const totalCustomers = customersSnap.size;
  const totalProducts  = productsSnap.size;

  setEl('stat-revenue',   formatPrice(totalRevenue));
  setEl('stat-orders',    orders.length);
  setEl('stat-today',     todayOrders.length);
  setEl('stat-pending',   pendingOrders);
  setEl('stat-customers', totalCustomers);
  setEl('stat-products',  totalProducts);

  // Recent orders
  const recent = orders.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0)).slice(0,10);
  renderRecentOrders(recent);

  // Revenue chart (last 7 days)
  renderRevenueChart(orders);
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ---- Recent Orders Table ----
function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-body');
  if (!tbody) return;
  tbody.innerHTML = orders.map(o => {
    const cfg = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
    return `<tr>
      <td><strong>${o.orderId}</strong></td>
      <td>${o.customerName}</td>
      <td>${formatPrice(o.total)}</td>
      <td><span class="status-pill" style="background:${cfg.color}20;color:${cfg.color}">${cfg.icon} ${cfg.label}</span></td>
      <td>${formatDate(o.createdAt)}</td>
      <td><button class="btn-sm" onclick="openOrderDetail('${o.orderId}')">View</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="empty">No orders yet</td></tr>';
}

// ---- Revenue Chart (simple bar) ----
function renderRevenueChart(orders) {
  const canvas = document.getElementById('revenue-chart');
  if (!canvas) return;
  const days = 7;
  const data = Array.from({length: days}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days-1-i)); d.setHours(0,0,0,0);
    const next = new Date(d); next.setDate(next.getDate()+1);
    const rev = orders
      .filter(o => o.status !== 'cancelled' && o.createdAt?.toDate() >= d && o.createdAt?.toDate() < next)
      .reduce((s,o) => s + (o.total||0), 0);
    return { label: d.toLocaleDateString('en-IN',{weekday:'short'}), value: rev };
  });
  const max = Math.max(...data.map(d => d.value), 1);
  canvas.innerHTML = `
    <div class="chart-bars">
      ${data.map(d => `
        <div class="chart-bar-wrap">
          <div class="chart-bar" style="height:${(d.value/max)*100}%" title="${formatPrice(d.value)}">
            <span class="chart-val">${d.value > 0 ? formatPrice(d.value) : ''}</span>
          </div>
          <div class="chart-label">${d.label}</div>
        </div>`).join('')}
    </div>`;
}

// ============================================================
// PRODUCT MANAGEMENT
// ============================================================

async function loadAdminProducts() {
  const snap = await _db.collection('products').orderBy('createdAt','desc').get();
  const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAdminProducts(products);
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('admin-products-body');
  if (!tbody) return;
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.images?.[0]||'assets/placeholder.png'}" class="admin-prod-thumb"
        onerror="this.src='assets/placeholder.png'"></td>
      <td><strong>${p.name}</strong><br><small>${p.category||''}</small></td>
      <td>${(p.variants||[]).map(v=>`${v.label}: ${formatPrice(v.price)}`).join('<br>')}</td>
      <td>${p.stock ?? '—'}</td>
      <td>
        <label class="toggle">
          <input type="checkbox" ${p.active?'checked':''} onchange="toggleProduct('${p.id}',this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <button class="btn-sm" onclick="editProduct('${p.id}')">✏️ Edit</button>
        <button class="btn-sm btn-danger" onclick="deleteProduct('${p.id}')">🗑️</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="6" class="empty">No products</td></tr>';
}

// Open Add/Edit Product Modal
async function openProductModal(id = null) {
  const modal = document.getElementById('product-modal');
  if (!modal) return;
  document.getElementById('product-form').reset();
  document.getElementById('variant-list').innerHTML = '';
  document.getElementById('img-preview').innerHTML = '';
  document.getElementById('product-id').value = '';

  if (id) {
    const p = await fetchProduct(id);
    if (!p) return;
    document.getElementById('product-id').value   = p.id;
    document.getElementById('prod-name').value     = p.name || '';
    document.getElementById('prod-category').value = p.category || '';
    document.getElementById('prod-desc').value     = p.description || '';
    document.getElementById('prod-badge').value    = p.badge || '';
    document.getElementById('prod-stock').value    = p.stock || '';
    document.getElementById('prod-tags').value     = (p.tags||[]).join(', ');
    document.getElementById('prod-active').checked = p.active !== false;
    document.getElementById('prod-original-price').value = p.originalPrice || '';
    // Variants
    (p.variants||[]).forEach(v => addVariantRow(v.label, v.price));
    // Images preview
    (p.images||[]).forEach(url => addImagePreview(url));
    document.getElementById('product-modal-title').textContent = 'Edit Product';
  } else {
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    addVariantRow('250g', '');
  }
  modal.style.display = 'flex';
}

function addVariantRow(label = '', price = '') {
  const list = document.getElementById('variant-list');
  const div = document.createElement('div');
  div.className = 'variant-row';
  div.innerHTML = `
    <input type="text" placeholder="Label (e.g. 250g)" value="${label}" class="variant-label">
    <input type="number" placeholder="Price (₹)" value="${price}" class="variant-price">
    <button type="button" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(div);
}

function addImagePreview(url) {
  const preview = document.getElementById('img-preview');
  const div = document.createElement('div');
  div.className = 'img-prev-item';
  div.innerHTML = `
    <img src="${url}" onerror="this.src='assets/placeholder.png'">
    <button type="button" onclick="this.parentElement.remove()">✕</button>
    <input type="hidden" class="existing-img" value="${url}">`;
  preview.appendChild(div);
}

// Upload images to Firebase Storage
async function uploadProductImages(files, productId) {
  const urls = [];
  for (const file of files) {
    const ref = _storage.ref(`products/${productId}/${Date.now()}_${file.name}`);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    urls.push(url);
  }
  return urls;
}

// Save Product
async function saveProduct() {
  const id     = document.getElementById('product-id').value;
  const name   = document.getElementById('prod-name').value.trim();
  const cat    = document.getElementById('prod-category').value.trim();
  const desc   = document.getElementById('prod-desc').value.trim();
  const badge  = document.getElementById('prod-badge').value.trim();
  const stock  = parseInt(document.getElementById('prod-stock').value) || 0;
  const tags   = document.getElementById('prod-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const active = document.getElementById('prod-active').checked;
  const origPrice = parseFloat(document.getElementById('prod-original-price').value) || null;

  if (!name) { showToast('Product name required', 'error'); return; }

  // Variants
  const variants = [];
  document.querySelectorAll('.variant-row').forEach(row => {
    const label = row.querySelector('.variant-label').value.trim();
    const price = parseFloat(row.querySelector('.variant-price').value);
    if (label && !isNaN(price)) variants.push({ label, price });
  });
  if (variants.length === 0) { showToast('Add at least one variant', 'error'); return; }

  const minPrice = Math.min(...variants.map(v=>v.price));

  // Existing images
  const existingImgs = [...document.querySelectorAll('.existing-img')].map(i=>i.value);

  // New image uploads
  const fileInput = document.getElementById('prod-images');
  const newFiles  = fileInput?.files ? [...fileInput.files] : [];

  const btn = document.getElementById('save-product-btn');
  showLoader(btn, 'Saving...');

  try {
    const docId = id || _db.collection('products').doc().id;
    const newUrls = newFiles.length > 0 ? await uploadProductImages(newFiles, docId) : [];
    const images = [...existingImgs, ...newUrls];

    const data = {
      name, category: cat, description: desc,
      badge: badge || null, stock, tags,
      active, variants, minPrice,
      images,
      originalPrice: origPrice,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!id) data.createdAt = firebase.firestore.FieldValue.serverTimestamp();

    await _db.collection('products').doc(docId).set(data, { merge: true });
    showToast(id ? 'Product updated!' : 'Product added!');
    closeModal('product-modal');
    loadAdminProducts();
  } catch(e) {
    showToast('Error saving product: ' + e.message, 'error');
  } finally {
    hideLoader(btn);
  }
}

async function toggleProduct(id, active) {
  await _db.collection('products').doc(id).update({ active });
  showToast(`Product ${active ? 'activated' : 'deactivated'}`, 'info');
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  await _db.collection('products').doc(id).delete();
  showToast('Product deleted', 'info');
  loadAdminProducts();
}

async function editProduct(id) {
  await openProductModal(id);
}

// ============================================================
// ORDER MANAGEMENT
// ============================================================

async function loadAdminOrders(status = 'all') {
  let q = _db.collection('orders').orderBy('createdAt','desc');
  const snap = await q.get();
  let orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (status !== 'all') orders = orders.filter(o => o.status === status);
  renderAdminOrders(orders);
}

function renderAdminOrders(orders) {
  const tbody = document.getElementById('admin-orders-body');
  if (!tbody) return;
  tbody.innerHTML = orders.map(o => {
    const cfg = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
    return `<tr>
      <td><strong>${o.orderId}</strong></td>
      <td>${o.customerName}<br><small>${o.phone}</small></td>
      <td>${o.items?.length || 0} items</td>
      <td><strong>${formatPrice(o.total)}</strong></td>
      <td>${o.paymentMode?.toUpperCase()}</td>
      <td><span class="status-pill" style="background:${cfg.color}20;color:${cfg.color}">${cfg.icon} ${cfg.label}</span></td>
      <td>${formatDate(o.createdAt)}</td>
      <td>
        <button class="btn-sm" onclick="openOrderDetail('${o.orderId}')">View</button>
        <button class="btn-sm" onclick="printInvoice('${o.orderId}')">🖨️</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="empty">No orders found</td></tr>';
}

async function openOrderDetail(orderId) {
  const order = await fetchOrder(orderId);
  if (!order) return;
  const modal = document.getElementById('order-detail-modal');
  const content = document.getElementById('order-detail-content');
  const cfg = ORDER_STATUS[order.status];
  content.innerHTML = `
    <div class="order-detail-header">
      <h3>Order #${order.orderId}</h3>
      <span class="status-pill" style="background:${cfg.color}20;color:${cfg.color}">${cfg.icon} ${cfg.label}</span>
    </div>
    <div class="order-detail-grid">
      <div>
        <h4>Customer</h4>
        <p>${order.customerName}<br>${order.phone}<br>${order.email}</p>
        <h4>Delivery Address</h4>
        <p>${order.address?.line1}<br>${order.address?.city}, ${order.address?.state}<br>${order.address?.pincode}</p>
      </div>
      <div>
        <h4>Items</h4>
        ${order.items?.map(i => `
          <div class="order-item-row">
            <img src="${i.image||'assets/placeholder.png'}" onerror="this.src='assets/placeholder.png'">
            <span>${i.name} (${i.variantLabel}) × ${i.qty}</span>
            <span>${formatPrice(i.subtotal)}</span>
          </div>`).join('')}
        <div class="order-totals">
          <div>Subtotal: ${formatPrice(order.subtotal)}</div>
          ${order.discount > 0 ? `<div>Discount: -${formatPrice(order.discount)}</div>` : ''}
          <div>Delivery: ${order.delivery === 0 ? 'FREE' : formatPrice(order.delivery)}</div>
          <div><strong>Total: ${formatPrice(order.total)}</strong></div>
        </div>
      </div>
    </div>
    <div class="update-status-section">
      <h4>Update Status</h4>
      <div class="status-buttons">
        ${Object.entries(ORDER_STATUS).map(([k,v]) =>
          `<button class="btn-status ${order.status===k?'active':''}"
            onclick="updateOrderStatus('${order.orderId}','${k}')"
            style="border-color:${v.color};color:${v.color}">
            ${v.icon} ${v.label}</button>`
        ).join('')}
      </div>
    </div>
    ${renderOrderTimeline(order)}`;
  modal.style.display = 'flex';
}

async function updateOrderStatus(orderId, status) {
  await _db.collection('orders').doc(orderId).update({
    status,
    statusHistory: firebase.firestore.FieldValue.arrayUnion({
      status, time: new Date().toISOString(),
      note: `Status updated to ${ORDER_STATUS[status]?.label}`
    })
  });
  showToast(`Order status updated to ${ORDER_STATUS[status]?.label}`);
  openOrderDetail(orderId);
  loadAdminOrders();
}

// ============================================================
// CUSTOMER MANAGEMENT
// ============================================================

async function loadAdminCustomers() {
  const snap = await _db.collection('customers').orderBy('createdAt','desc').get();
  const customers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAdminCustomers(customers);
}

function renderAdminCustomers(customers) {
  const tbody = document.getElementById('admin-customers-body');
  if (!tbody) return;
  tbody.innerHTML = customers.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.email}</td>
      <td>${c.phone||'—'}</td>
      <td>${c.totalOrders||0}</td>
      <td>${formatPrice(c.totalSpent||0)}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td><button class="btn-sm" onclick="viewCustomerOrders('${c.email}')">Orders</button></td>
    </tr>`).join('') || '<tr><td colspan="7" class="empty">No customers yet</td></tr>';
}

// ============================================================
// COUPON MANAGEMENT
// ============================================================

async function loadAdminCoupons() {
  const snap = await _db.collection('coupons').orderBy('createdAt','desc').get();
  const coupons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAdminCoupons(coupons);
}

function renderAdminCoupons(coupons) {
  const tbody = document.getElementById('admin-coupons-body');
  if (!tbody) return;
  tbody.innerHTML = coupons.map(c => `
    <tr>
      <td><strong>${c.code}</strong></td>
      <td>${c.type === 'percent' ? c.value + '%' : formatPrice(c.value)} off</td>
      <td>${c.minOrder ? formatPrice(c.minOrder) : '—'}</td>
      <td>${c.expiresAt ? formatDate(c.expiresAt) : 'No expiry'}</td>
      <td>
        <label class="toggle">
          <input type="checkbox" ${c.active?'checked':''} onchange="toggleCoupon('${c.id}',this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td><button class="btn-sm btn-danger" onclick="deleteCoupon('${c.id}')">🗑️</button></td>
    </tr>`).join('') || '<tr><td colspan="6" class="empty">No coupons</td></tr>';
}

async function saveCoupon() {
  const code     = document.getElementById('coupon-code').value.trim().toUpperCase();
  const type     = document.getElementById('coupon-type').value;
  const value    = parseFloat(document.getElementById('coupon-value').value);
  const minOrder = parseFloat(document.getElementById('coupon-min').value) || 0;
  const expires  = document.getElementById('coupon-expires').value;

  if (!code || !value) { showToast('Fill all required fields', 'error'); return; }

  await _db.collection('coupons').add({
    code, type, value, minOrder,
    expiresAt: expires ? firebase.firestore.Timestamp.fromDate(new Date(expires)) : null,
    active: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast('Coupon created!');
  closeModal('coupon-modal');
  loadAdminCoupons();
}

async function toggleCoupon(id, active) {
  await _db.collection('coupons').doc(id).update({ active });
}

async function deleteCoupon(id) {
  if (!confirm('Delete this coupon?')) return;
  await _db.collection('coupons').doc(id).delete();
  loadAdminCoupons();
}

// ============================================================
// CATEGORY MANAGEMENT
// ============================================================

async function loadAdminCategories() {
  const snap = await _db.collection('categories').orderBy('order').get();
  const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAdminCategories(cats);
}

function renderAdminCategories(cats) {
  const list = document.getElementById('admin-categories-list');
  if (!list) return;
  list.innerHTML = cats.map(c => `
    <div class="cat-admin-item">
      <span>${c.emoji || '📦'} ${c.name}</span>
      <div>
        <button class="btn-sm" onclick="editCategory('${c.id}')">✏️</button>
        <button class="btn-sm btn-danger" onclick="deleteCategory('${c.id}')">🗑️</button>
      </div>
    </div>`).join('');
}

async function saveCategory() {
  const id    = document.getElementById('cat-id').value;
  const name  = document.getElementById('cat-name').value.trim();
  const emoji = document.getElementById('cat-emoji').value.trim();
  const order = parseInt(document.getElementById('cat-order').value) || 99;
  if (!name) { showToast('Category name required', 'error'); return; }

  const fileInput = document.getElementById('cat-image');
  let imageUrl = document.getElementById('cat-existing-img').value || '';
  if (fileInput?.files?.[0]) {
    const ref = _storage.ref(`categories/${Date.now()}_${fileInput.files[0].name}`);
    await ref.put(fileInput.files[0]);
    imageUrl = await ref.getDownloadURL();
  }

  const data = { name, emoji, order, imageUrl, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
  if (id) {
    await _db.collection('categories').doc(id).update(data);
  } else {
    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    await _db.collection('categories').add(data);
  }
  showToast('Category saved!');
  closeModal('category-modal');
  loadAdminCategories();
}

async function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  await _db.collection('categories').doc(id).delete();
  loadAdminCategories();
}

// ============================================================
// BANNER MANAGEMENT
// ============================================================

async function loadAdminBanners() {
  const snap = await _db.collection('banners').orderBy('order').get();
  const banners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAdminBanners(banners);
}

function renderAdminBanners(banners) {
  const list = document.getElementById('admin-banners-list');
  if (!list) return;
  list.innerHTML = banners.map(b => `
    <div class="banner-admin-item">
      <img src="${b.imageUrl||'assets/placeholder.png'}" onerror="this.src='assets/placeholder.png'">
      <div>
        <strong>${b.title||'Banner'}</strong>
        <p>${b.subtitle||''}</p>
      </div>
      <label class="toggle">
        <input type="checkbox" ${b.active?'checked':''} onchange="toggleBanner('${b.id}',this.checked)">
        <span class="toggle-slider"></span>
      </label>
      <button class="btn-sm btn-danger" onclick="deleteBanner('${b.id}')">🗑️</button>
    </div>`).join('') || '<p class="empty">No banners</p>';
}

async function saveBanner() {
  const id       = document.getElementById('banner-id').value;
  const title    = document.getElementById('banner-title').value.trim();
  const subtitle = document.getElementById('banner-subtitle').value.trim();
  const link     = document.getElementById('banner-link').value.trim();
  const order    = parseInt(document.getElementById('banner-order').value) || 99;
  const fileInput = document.getElementById('banner-image');

  let imageUrl = document.getElementById('banner-existing-img').value || '';
  if (fileInput?.files?.[0]) {
    const ref = _storage.ref(`banners/${Date.now()}_${fileInput.files[0].name}`);
    await ref.put(fileInput.files[0]);
    imageUrl = await ref.getDownloadURL();
  }

  const data = { title, subtitle, link, order, imageUrl, active: true,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
  if (id) {
    await _db.collection('banners').doc(id).update(data);
  } else {
    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    await _db.collection('banners').add(data);
  }
  showToast('Banner saved!');
  closeModal('banner-modal');
  loadAdminBanners();
}

async function toggleBanner(id, active) {
  await _db.collection('banners').doc(id).update({ active });
}

async function deleteBanner(id) {
  if (!confirm('Delete this banner?')) return;
  await _db.collection('banners').doc(id).delete();
  loadAdminBanners();
}

// ============================================================
// HELPERS
// ============================================================

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
}

function printInvoice(orderId) {
  window.open(`invoice.html?id=${orderId}`, '_blank');
}

async function viewCustomerOrders(email) {
  const snap = await _db.collection('orders').where('email','==',email).orderBy('createdAt','desc').get();
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Switch to orders tab and show filtered
  switchAdminTab('orders');
  renderAdminOrders(orders);
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  document.querySelector(`.admin-nav-item[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`section-${tab}`)?.style.setProperty('display', 'block');
}

// Admin search
function adminSearch(table, query) {
  const q = query.toLowerCase();
  document.querySelectorAll(`#${table} tr`).forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
