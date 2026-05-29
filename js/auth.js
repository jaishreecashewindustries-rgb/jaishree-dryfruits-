// ============================================================
// PURE NUTS — Authentication
// ============================================================

let _auth = null;
let _db   = null;
let _storage = null;
let currentUser = null;
let isAdmin = false;

// Initialize Firebase
function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  _auth    = firebase.auth();
  _db      = firebase.firestore();
  _storage = firebase.storage();

  // Auth state listener
  _auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
      isAdmin = (user.email === APP_CONFIG.adminEmail);
      // Update nav UI
      updateAuthNav(user);
      // If on admin page and not admin, redirect
      if (window.location.pathname.includes('admin') && !isAdmin) {
        window.location.href = 'index.html';
      }
    } else {
      isAdmin = false;
      updateAuthNav(null);
      // If on admin page and not logged in, redirect to admin login
      if (window.location.pathname.includes('admin')) {
        showAdminLoginModal();
      }
    }
    // Page-specific init
    if (typeof onAuthReady === 'function') onAuthReady(user);
  });
}

// Update nav based on auth state
function updateAuthNav(user) {
  const loginBtn  = document.getElementById('nav-login');
  const logoutBtn = document.getElementById('nav-logout');
  const accBtn    = document.getElementById('nav-account');
  const userName  = document.getElementById('nav-username');

  if (user) {
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (accBtn)    accBtn.style.display    = 'inline-flex';
    if (userName)  userName.textContent    = user.displayName || user.email.split('@')[0];
  } else {
    if (loginBtn)  loginBtn.style.display  = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (accBtn)    accBtn.style.display    = 'none';
  }
}

// Register new customer
async function registerUser(name, email, password, phone) {
  try {
    const cred = await _auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    await _db.collection('customers').doc(cred.user.uid).set({
      name, email, phone,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      totalOrders: 0, totalSpent: 0
    });
    showToast('Account created! Welcome to Pure Nuts 🎉');
    return { success: true };
  } catch (e) {
    return { success: false, error: firebaseError(e) };
  }
}

// Login
async function loginUser(email, password) {
  try {
    await _auth.signInWithEmailAndPassword(email, password);
    showToast('Welcome back! 👋');
    return { success: true };
  } catch (e) {
    return { success: false, error: firebaseError(e) };
  }
}

// Logout
async function logoutUser() {
  await _auth.signOut();
  showToast('Logged out successfully', 'info');
  window.location.href = 'index.html';
}

// Forgot password
async function resetPassword(email) {
  try {
    await _auth.sendPasswordResetEmail(email);
    showToast('Password reset email sent! Check your inbox.');
    return { success: true };
  } catch (e) {
    return { success: false, error: firebaseError(e) };
  }
}

// Require login — redirect if not logged in
function requireLogin() {
  if (!currentUser) {
    showLoginModal();
    return false;
  }
  return true;
}

// Firebase error messages in plain English
function firebaseError(e) {
  const map = {
    'auth/email-already-in-use':   'Email already registered. Please login.',
    'auth/wrong-password':          'Wrong password. Try again.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/too-many-requests':       'Too many attempts. Please try after some time.',
    'auth/network-request-failed':  'Network error. Check your connection.',
  };
  return map[e.code] || e.message;
}

// Show Login Modal
function showLoginModal(redirect = '') {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.dataset.redirect = redirect;
    switchAuthTab('login');
  }
}

// Hide Login Modal
function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
}

// Switch between login/register tabs
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
  document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`auth-${tab}`)?.style.setProperty('display', 'block');
}

// Admin login modal (for admin.html)
function showAdminLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) modal.style.display = 'flex';
}

// Init on load
document.addEventListener('DOMContentLoaded', initFirebase);
