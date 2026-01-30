// iLoveSPSR Nellore - Frontend Application
const API = '/api';

// State
const state = {
    user: null,
    token: localStorage.getItem('token'),
    cart: []
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (state.token) {
        await loadProfile();
    }
    loadServices();
    loadProducts();
    updateUI();
});

// API Helper
async function api(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    
    const res = await fetch(`${API}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// Auth Functions
async function loadProfile() {
    try {
        const data = await api('/auth/me');
        state.user = data.user;
        await loadCart();
    } catch (e) {
        logout();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const data = await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('token', data.token);
        closeAuthModal();
        await loadCart();
        updateUI();
        showToast('Welcome back, ' + data.user.name + '!', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        const data = await api('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, phone, password, role: 'customer' })
        });
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('token', data.token);
        closeAuthModal();
        updateUI();
        showToast('Account created! Welcome, ' + data.user.name, 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function handleLogout() {
    logout();
    showToast('Logged out successfully', 'info');
}

function logout() {
    state.token = null;
    state.user = null;
    state.cart = [];
    localStorage.removeItem('token');
    updateUI();
}

// Cart Functions
async function loadCart() {
    if (!state.token) return;
    try {
        const data = await api('/orders/cart');
        state.cart = data.cart || [];
        updateCartBadge();
    } catch (e) {
        console.error('Failed to load cart:', e);
    }
}

async function addToCart(type, itemId, name, price) {
    if (!state.token) {
        showAuthModal('login');
        showToast('Please login to add items to cart', 'info');
        return;
    }
    
    try {
        await api('/orders/cart', {
            method: 'POST',
            body: JSON.stringify({ item_type: type, item_id: itemId, quantity: 1 })
        });
        await loadCart();
        showToast(`${name} added to cart!`, 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function removeFromCart(cartItemId) {
    try {
        await api(`/orders/cart/${cartItemId}`, { method: 'DELETE' });
        await loadCart();
        renderCart();
        showToast('Item removed from cart', 'info');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = count;
    }
}

// Load Data
async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    try {
        const data = await api('/services');
        const services = data.services || [];
        
        if (services.length === 0) {
            grid.innerHTML = '<p class="text-muted">No services available</p>';
            return;
        }
        
        const icons = {
            'home-repair': 'fa-wrench',
            'personal-care': 'fa-spa',
            'education': 'fa-graduation-cap',
            'healthcare': 'fa-heart-pulse',
            'events': 'fa-calendar-star',
            'transport': 'fa-car'
        };
        
        grid.innerHTML = services.slice(0, 8).map(s => `
            <div class="service-card">
                <div class="card-icon">
                    <i class="fa-solid ${icons[s.category_slug] || 'fa-concierge-bell'}"></i>
                </div>
                <h3 class="card-title">${s.name}</h3>
                <p class="card-desc">${s.description || ''}</p>
                <div class="card-meta">
                    <span class="card-price">₹${s.price}</span>
                    <span class="card-rating"><i class="fa-solid fa-star"></i> ${s.rating || '4.5'}</span>
                </div>
                <button class="btn-add-cart" onclick="addToCart('service', ${s.id}, '${s.name.replace(/'/g, "\\'")}', ${s.price})" style="margin-top: 16px; width: 100%;">
                    <i class="fa-solid fa-plus"></i> Book Service
                </button>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);">Failed to load services</p>';
    }
}

async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    try {
        const data = await api('/products');
        const products = data.products || [];
        
        if (products.length === 0) {
            grid.innerHTML = '<p class="text-muted">No products available</p>';
            return;
        }
        
        const icons = {
            'groceries': 'fa-basket-shopping',
            'handloom': 'fa-shirt',
            'electronics': 'fa-mobile-screen',
            'home-decor': 'fa-couch',
            'gifts': 'fa-gift',
            'health': 'fa-pills'
        };
        
        grid.innerHTML = products.slice(0, 8).map(p => `
            <div class="product-card">
                <div class="card-icon">
                    <i class="fa-solid ${icons[p.category_slug] || 'fa-box'}"></i>
                </div>
                <h3 class="card-title">${p.name}</h3>
                <p class="card-desc">${p.description || ''}</p>
                <div class="card-meta">
                    <span class="card-price">₹${p.price}</span>
                    <span class="card-rating"><i class="fa-solid fa-star"></i> ${p.rating || '4.5'}</span>
                </div>
                <button class="btn-add-cart" onclick="addToCart('product', ${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price})" style="margin-top: 16px; width: 100%;">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);">Failed to load products</p>';
    }
}

// UI Functions
function updateUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (state.user) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        document.getElementById('userInitials').textContent = state.user.name.charAt(0).toUpperCase();
        document.getElementById('userName').textContent = state.user.name;
        document.getElementById('userEmail').textContent = state.user.email;
        updateCartBadge();
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

// Auth Modal
function showAuthModal(tab = 'login') {
    document.getElementById('authModal').classList.add('active');
    switchAuthTab(tab);
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(tab === 'login' ? 'loginForm' : 'registerForm').classList.add('active');
    document.getElementById('authModalTitle').textContent = tab === 'login' ? 'Login' : 'Create Account';
}

// Cart Sidebar
function showCart() {
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    renderCart();
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
}

function renderCart() {
    const body = document.getElementById('cartBody');
    const totalEl = document.getElementById('cartTotal');
    
    if (state.cart.length === 0) {
        body.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-cart-shopping"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        totalEl.textContent = '₹0';
        return;
    }
    
    let total = 0;
    body.innerHTML = state.cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <div class="cart-item-icon">
                    <i class="fa-solid ${item.item_type === 'service' ? 'fa-concierge-bell' : 'fa-box'}"></i>
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price}</div>
                    <div class="cart-item-qty">Qty: ${item.quantity}</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    
    totalEl.textContent = '₹' + total;
}

// Checkout
function proceedToCheckout() {
    if (state.cart.length === 0) {
        showToast('Your cart is empty', 'info');
        return;
    }
    closeCart();
    showCheckoutModal();
}

function showCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    const content = document.getElementById('checkoutContent');
    
    let total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    content.innerHTML = `
        <div class="order-summary">
            <h4>Order Summary</h4>
            ${state.cart.map(item => `
                <div class="order-item">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>₹${item.price * item.quantity}</span>
                </div>
            `).join('')}
            <div class="order-total">
                <span>Total</span>
                <span>₹${total}</span>
            </div>
        </div>
        <form class="checkout-form" onsubmit="placeOrder(event)">
            <div class="form-group">
                <label>Delivery Address</label>
                <textarea id="deliveryAddress" rows="3" placeholder="Enter your full address" required style="width:100%;padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:inherit;resize:vertical;"></textarea>
            </div>
            <div class="form-group">
                <label>Payment Method</label>
                <select id="paymentMethod" required style="width:100%;padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--text);">
                    <option value="cod">Cash on Delivery</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                </select>
            </div>
            <button type="submit" class="btn-submit">Place Order - ₹${total}</button>
        </form>
    `;
    
    modal.classList.add('active');
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
}

async function placeOrder(e) {
    e.preventDefault();
    const address = document.getElementById('deliveryAddress').value;
    const payment = document.getElementById('paymentMethod').value;
    
    try {
        const data = await api('/orders', {
            method: 'POST',
            body: JSON.stringify({ 
                shipping_address: address, 
                payment_method: payment 
            })
        });
        
        const content = document.getElementById('checkoutContent');
        content.innerHTML = `
            <div class="order-success">
                <i class="fa-solid fa-circle-check"></i>
                <h3>Order Placed Successfully!</h3>
                <p>Thank you for your order</p>
                <div class="order-number">#${data.order.id}</div>
                <p>You will receive a confirmation shortly</p>
                <button class="btn primary" onclick="closeCheckout()" style="margin-top: 20px;">Continue Shopping</button>
            </div>
        `;
        
        state.cart = [];
        updateCartBadge();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// User Dropdown
function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    const avatar = document.querySelector('.user-avatar');
    if (dropdown && !dropdown.contains(e.target) && !avatar.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    
    toast.innerHTML = `
        <i class="fa-solid ${icons[type]} toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Close modals on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAuthModal();
        closeCart();
        closeCheckout();
    }
});

// Close modal when clicking overlay
document.getElementById('authModal').addEventListener('click', (e) => {
    if (e.target.id === 'authModal') closeAuthModal();
});
document.getElementById('checkoutModal').addEventListener('click', (e) => {
    if (e.target.id === 'checkoutModal') closeCheckout();
});
