// ============ STATE ============
let orders = [];
let products = [];
let messages = [];
let newsletter = [];

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadDashboard('orders');
    setInterval(updateLastUpdated, 60000); // 1-minute auto-refresh
    updateLastUpdated();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.dataset.target;
            document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            document.getElementById('section-title').textContent = target.charAt(0).toUpperCase() + target.slice(1);
            
            loadDashboard(target);
        });
    });
}

function updateLastUpdated() {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('last-updated').textContent = `Last updated: ${time}`;
}

async function loadDashboard(section) {
    try {
        if (section === 'orders') await fetchOrders();
        else if (section === 'products') await fetchProducts();
        else if (section === 'messages') await fetchMessages();
        else if (section === 'newsletter') await fetchNewsletter();
    } catch (err) {
        console.error(`Failed to load ${section}:`, err);
    }
}

// ============ FETCH & RENDER ============

async function fetchOrders() {
    const res = await fetch('/api/orders');
    orders = await res.json();
    
    // Stats
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const avgValue = totalOrders > 0 ? (revenue / totalOrders) : 0;
    
    document.getElementById('stat-total-orders').textContent = totalOrders;
    document.getElementById('stat-revenue').textContent = `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-avg-value').textContent = `$${avgValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // Table
    const tbody = document.getElementById('orders-body');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No orders yet. Start your marketing!</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(o => {
        const items = JSON.parse(o.items);
        const date = new Date(o.created_at).toLocaleDateString();
        return `
            <tr>
                <td>#ORD-${o.id}</td>
                <td>
                    <div style="font-weight:600">${o.customer_name}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary)">${o.customer_email}</div>
                </td>
                <td>${items.length} items</td>
                <td style="font-weight:700">$${o.total.toFixed(2)}</td>
                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');
}

async function fetchProducts() {
    const res = await fetch('/api/products');
    products = await res.json();
    
    const tbody = document.getElementById('products-body');
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>#${p.id}</td>
            <td>
                <div style="display:flex; align-items:center; gap:12px">
                    <img src="${p.image}" width="32" height="32" style="object-fit:contain; background:var(--bg-primary); border-radius:4px">
                    <span>${p.name}</span>
                </div>
            </td>
            <td style="text-transform:capitalize">${p.category}</td>
            <td style="font-weight:700">$${p.price.toFixed(2)}</td>
            <td>In Stock</td>
        </tr>
    `).join('');
}

async function fetchMessages() {
    const res = await fetch('/api/messages');
    messages = await res.json();
    
    const tbody = document.getElementById('messages-body');
    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No messages received yet.</td></tr>';
        return;
    }
    
    tbody.innerHTML = messages.map(m => {
        const date = new Date(m.created_at).toLocaleDateString();
        return `
            <tr>
                <td style="font-weight:600">${m.name}</td>
                <td>${m.email}</td>
                <td>${m.subject || '-'}</td>
                <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap" title="${m.message}">${m.message}</td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');
}

async function fetchNewsletter() {
    const res = await fetch('/api/newsletter');
    newsletter = await res.json();
    
    const tbody = document.getElementById('newsletter-body');
    if (newsletter.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No subscribers yet.</td></tr>';
        return;
    }
    
    tbody.innerHTML = newsletter.map(n => {
        const date = new Date(n.subscribed_at).toLocaleDateString();
        return `
            <tr>
                <td>#${n.id}</td>
                <td style="font-weight:600">${n.email}</td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');
}
