// ============ STATE ============
let cart = JSON.parse(localStorage.getItem('solecraft_cart') || '[]');
let allProducts = [];
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let quantity = 1;

// ============ DOM READY ============
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initNavbar();
  initSearch();
  initCart();
  initModals();
  initNewsletterForm();
  initContactForm();
  initCheckout();
  initScrollReveal();
  initCounters();
  initParticles();
  initCursorGlow();
  initRippleButtons();
  init3DCardTilt();
  initParallax();
  fetchProducts();
});

// ============ PRELOADER ============
function initPreloader() {
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => { preloader.classList.add('hidden'); }, 1600);
  });
  // Fallback
  setTimeout(() => { preloader.classList.add('hidden'); }, 3000);
}

// ============ NAVBAR ============
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveNavLink();
  });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
}

function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const scrollPos = window.scrollY + 100;

  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`.nav-link[data-section="${id}"]`);
    if (link) {
      link.classList.toggle('active', scrollPos >= top && scrollPos < top + height);
    }
  });
}

// ============ SEARCH ============
function initSearch() {
  const toggle = document.getElementById('search-toggle');
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const close = document.getElementById('search-close');

  toggle.addEventListener('click', () => {
    overlay.classList.toggle('active');
    if (overlay.classList.contains('active')) input.focus();
  });

  close.addEventListener('click', () => {
    overlay.classList.remove('active');
    input.value = '';
    renderProducts(allProducts);
  });

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      if (q) {
        const filtered = allProducts.filter(p =>
          p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
        renderProducts(filtered);
      } else {
        renderProducts(allProducts);
      }
      document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    }, 300);
  });
}

// ============ PRODUCTS ============
async function fetchProducts(category = 'all') {
  try {
    const url = category === 'all' ? '/api/products' : `/api/products?category=${category}`;
    const res = await fetch(url);
    const products = await res.json();
    if (category === 'all') allProducts = products;
    renderProducts(products);
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (products.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);grid-column:1/-1;"><p>No products found</p></div>';
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card reveal visible" data-id="${p.id}">
      <div class="product-image">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <button class="product-quick-view" onclick="openProductModal(${p.id})" aria-label="Quick view">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">
          <span class="product-stars">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</span>
          <span class="product-review-count">(${p.reviews})</span>
        </div>
        <div class="product-price-row">
          <div>
            <span class="product-current-price">$${p.price.toFixed(2)}</span>
            ${p.original_price ? `<span class="product-original-price">$${p.original_price.toFixed(2)}</span>` : ''}
          </div>
          <button class="product-add-btn" onclick="event.stopPropagation(); quickAdd(${p.id})" aria-label="Add to cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Make entire card clickable
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => openProductModal(parseInt(card.dataset.id)));
  });
}

// Filter buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fetchProducts(btn.dataset.category);
    });
  });
});

// ============ QUICK ADD ============
function quickAdd(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  const sizes = product.sizes ? product.sizes.split(',') : [];
  const colors = product.colors ? product.colors.split(',') : [];
  addToCart({
    id: product.id, name: product.name, price: product.price,
    image: product.image, size: sizes[0] || 'N/A', color: colors[0] || 'N/A', quantity: 1
  });
}

// ============ PRODUCT MODAL ============
function initModals() {
  document.getElementById('modal-close').addEventListener('click', closeProductModal);
  document.getElementById('product-modal-overlay').addEventListener('click', closeProductModal);
  document.getElementById('qty-minus').addEventListener('click', () => { if (quantity > 1) { quantity--; document.getElementById('qty-value').textContent = quantity; } });
  document.getElementById('qty-plus').addEventListener('click', () => { if (quantity < 10) { quantity++; document.getElementById('qty-value').textContent = quantity; } });
  document.getElementById('modal-add-to-cart').addEventListener('click', addFromModal);
}

function openProductModal(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  currentProduct = product;
  quantity = 1;
  selectedSize = null;
  selectedColor = null;

  document.getElementById('modal-product-image').src = product.image;
  document.getElementById('modal-product-name').textContent = product.name;
  document.getElementById('modal-badge').textContent = product.badge || '';
  document.getElementById('modal-badge').style.display = product.badge ? 'inline-block' : 'none';
  document.getElementById('modal-stars').textContent = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
  document.getElementById('modal-reviews').textContent = `(${product.reviews} reviews)`;
  document.getElementById('modal-price').textContent = `$${product.price.toFixed(2)}`;
  document.getElementById('modal-original-price').textContent = product.original_price ? `$${product.original_price.toFixed(2)}` : '';
  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0;
  document.getElementById('modal-discount').textContent = discount > 0 ? `-${discount}%` : '';
  document.getElementById('modal-description').textContent = product.description;
  document.getElementById('qty-value').textContent = '1';

  // Sizes
  const sizesContainer = document.getElementById('modal-sizes');
  const sizes = product.sizes ? product.sizes.split(',') : [];
  sizesContainer.innerHTML = sizes.map(s => `<button class="size-btn" data-size="${s.trim()}">${s.trim()}</button>`).join('');
  sizesContainer.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sizesContainer.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.dataset.size;
    });
  });

  // Colors
  const colorsContainer = document.getElementById('modal-colors');
  const colors = product.colors ? product.colors.split(',') : [];
  colorsContainer.innerHTML = colors.map(c => `<button class="color-btn" data-color="${c.trim()}">${c.trim()}</button>`).join('');
  colorsContainer.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      colorsContainer.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColor = btn.dataset.color;
    });
  });

  document.getElementById('product-modal').classList.add('active');
  document.getElementById('product-modal-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
  document.getElementById('product-modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function addFromModal() {
  if (!currentProduct) return;
  const sizes = currentProduct.sizes ? currentProduct.sizes.split(',') : [];
  const colors = currentProduct.colors ? currentProduct.colors.split(',') : [];
  addToCart({
    id: currentProduct.id, name: currentProduct.name, price: currentProduct.price,
    image: currentProduct.image,
    size: selectedSize || sizes[0]?.trim() || 'N/A',
    color: selectedColor || colors[0]?.trim() || 'N/A',
    quantity: quantity
  });
  closeProductModal();
}

// ============ CART ============
function initCart() {
  document.getElementById('cart-toggle').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);
  document.getElementById('cart-shop-btn')?.addEventListener('click', closeCart);
  updateCartUI();
}

function openCart() {
  document.getElementById('cart-sidebar').classList.add('active');
  document.getElementById('cart-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('active');
  document.getElementById('cart-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function addToCart(item) {
  const existing = cart.find(c => c.id === item.id && c.size === item.size && c.color === item.color);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart();
  updateCartUI();

  // Bounce the cart count badge
  const countEl = document.getElementById('cart-count');
  countEl.classList.remove('bounce');
  void countEl.offsetWidth; // force reflow
  countEl.classList.add('bounce');

  showToast(`${item.name} added to cart!`);
  openCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('solecraft_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const countEl = document.getElementById('cart-count');
  const itemsEl = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const footerEl = document.getElementById('cart-footer');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  countEl.textContent = totalItems;

  if (cart.length === 0) {
    emptyEl.style.display = 'block';
    footerEl.style.display = 'none';
    // Remove cart item elements but keep empty element
    itemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
    return;
  }

  emptyEl.style.display = 'none';
  footerEl.style.display = 'block';

  const cartItemsHTML = cart.map((item, i) => `
    <div class="cart-item">
      <div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div>
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}</div>
        <div class="cart-item-bottom">
          <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
          <button class="cart-item-remove" onclick="removeFromCart(${i})">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  // Keep the empty element, replace everything else
  itemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
  itemsEl.insertAdjacentHTML('beforeend', cartItemsHTML);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  totalEl.textContent = `$${subtotal.toFixed(2)}`;
}

// ============ CHECKOUT ============
function initCheckout() {
  document.getElementById('checkout-btn').addEventListener('click', openCheckout);
  document.getElementById('checkout-close').addEventListener('click', closeCheckout);
  document.getElementById('checkout-modal-overlay').addEventListener('click', closeCheckout);
  document.getElementById('checkout-form').addEventListener('submit', placeOrder);
}

function openCheckout() {
  closeCart();
  const summary = document.getElementById('checkout-summary');
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  summary.innerHTML = `
    <div style="font-size:0.9rem; color: var(--text-secondary); margin-bottom: 12px;">Order Summary</div>
    ${cart.map(item => `
      <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
        <span>${item.name} (x${item.quantity})</span>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('')}
    <div style="display:flex; justify-content:space-between; margin-top:12px; padding-top:12px; border-top:1px solid var(--border-color); font-weight:700; font-size:1.1rem;">
      <span>Total</span><span>$${total.toFixed(2)}</span>
    </div>
  `;

  setTimeout(() => {
    document.getElementById('checkout-modal').classList.add('active');
    document.getElementById('checkout-modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }, 300);
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('active');
  document.getElementById('checkout-modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

async function placeOrder(e) {
  e.preventDefault();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderData = {
    customer_name: document.getElementById('checkout-name').value,
    customer_email: document.getElementById('checkout-email').value,
    customer_phone: document.getElementById('checkout-phone').value,
    address: document.getElementById('checkout-address').value,
    city: document.getElementById('checkout-city').value,
    zip: document.getElementById('checkout-zip').value,
    items: cart,
    total
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (res.ok) {
      cart = [];
      saveCart();
      updateCartUI();
      closeCheckout();
      showToast('🎉 Order placed successfully! Thank you!');
      document.getElementById('checkout-form').reset();
    } else {
      showToast(data.error || 'Failed to place order', true);
    }
  } catch (err) {
    showToast('Network error. Please try again.', true);
  }
}

// ============ NEWSLETTER ============
function initNewsletterForm() {
  document.getElementById('newsletter-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletter-email').value;
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      showToast(data.message);
      if (res.ok) document.getElementById('newsletter-email').value = '';
    } catch (err) {
      showToast('Failed to subscribe. Try again.', true);
    }
  });
}

// ============ CONTACT FORM ============
function initContactForm() {
  document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
      name: document.getElementById('contact-name').value,
      email: document.getElementById('contact-email').value,
      subject: document.getElementById('contact-subject').value,
      message: document.getElementById('contact-message').value
    };
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Message sent! We\'ll get back to you soon.');
        document.getElementById('contact-form').reset();
      } else {
        showToast(data.error || 'Failed to send message.', true);
      }
    } catch (err) {
      showToast('Network error. Please try again.', true);
    }
  });
}

// ============ SCROLL REVEAL ============
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  // Standard reveals
  document.querySelectorAll('.newsletter-card').forEach(el => {
    el.classList.add('reveal-scale');
    observer.observe(el);
  });

  // Left/Right reveals
  document.querySelectorAll('.about-content, .contact-info').forEach(el => {
    el.classList.add('reveal-left');
    observer.observe(el);
  });
  document.querySelectorAll('.about-visual, .contact-form').forEach(el => {
    el.classList.add('reveal-right');
    observer.observe(el);
  });

  // Staggered reveals for groups
  document.querySelectorAll('.feature-card, .testimonial-card').forEach(el => {
    el.classList.add('reveal', 'reveal-stagger');
    observer.observe(el);
  });

  // Section headers
  document.querySelectorAll('.section-header, .section-badge').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

// ============ COUNTER ANIMATION ============
function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-number').forEach(el => {
          const target = parseFloat(el.dataset.target);
          const isFloat = target % 1 !== 0;
          let current = 0;
          const increment = target / 60;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = isFloat ? current.toFixed(1) : Math.floor(current);
          }, 25);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const statsEl = document.querySelector('.hero-stats');
  if (statsEl) observer.observe(statsEl);
}

// ============ TOAST ============
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const msg = document.getElementById('toast-message');
  msg.textContent = message;
  icon.textContent = isError ? '!' : '✓';
  icon.style.background = isError ? 'var(--accent-2)' : '#10b981';
  toast.classList.add('active');
  setTimeout(() => toast.classList.remove('active'), 3000);
}

// ============ HERO PARTICLES ============
function initParticles() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'hero-particles';
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouseX = 0, mouseY = 0;

  function resize() {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.hue = Math.random() > 0.5 ? 36 : 0; // amber or red
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Mouse repulsion
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.8;
        this.x += (dx / dist) * force;
        this.y += (dy / dist) * force;
      }

      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
        this.reset();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 90%, 60%, ${this.opacity})`;
      ctx.fill();
    }
  }

  // Create particles
  for (let i = 0; i < 80; i++) particles.push(new Particle());

  // Track mouse relative to hero
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.06 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

// ============ CURSOR GLOW ============
function initCursorGlow() {
  if (window.innerWidth < 768) return; // Skip on mobile

  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);

  let cx = -500, cy = -500;
  let tx = -500, ty = -500;

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    glow.style.opacity = '1';
  });

  function updateGlow() {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    glow.style.left = cx + 'px';
    glow.style.top = cy + 'px';
    requestAnimationFrame(updateGlow);
  }
  updateGlow();
}

// ============ BUTTON RIPPLE ============
function initRippleButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

// ============ 3D CARD TILT ============
function init3DCardTilt() {
  document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.product-card').forEach(card => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < 400) {
        const rotateY = (distX / rect.width) * 8;
        const rotateX = -(distY / rect.height) * 8;
        const intensity = Math.max(0, 1 - dist / 400);
        card.style.transform = `translateY(-${10 * intensity}px) perspective(800px) rotateX(${rotateX * intensity}deg) rotateY(${rotateY * intensity}deg)`;
      } else {
        card.style.transform = '';
      }
    });
  });

  // Reset on mouse leave
  document.addEventListener('mouseleave', () => {
    document.querySelectorAll('.product-card').forEach(card => {
      card.style.transform = '';
    });
  });
}

// ============ PARALLAX ON SCROLL ============
function initParallax() {
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;

        // Parallax background shapes
        document.querySelectorAll('.shape').forEach((shape, i) => {
          const speed = [0.03, 0.05, 0.04][i] || 0.03;
          shape.style.transform = `translateY(${scrollY * speed}px)`;
        });

        // Parallax hero content
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrollY < window.innerHeight) {
          heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;
          heroContent.style.opacity = 1 - scrollY / (window.innerHeight * 0.8);
        }

        // Parallax hero shoe
        const heroShoe = document.querySelector('.hero-shoe');
        if (heroShoe && scrollY < window.innerHeight) {
          heroShoe.style.transform = `rotate(-10deg) translateY(${-scrollY * 0.08}px)`;
        }

        ticking = false;
      });
      ticking = true;
    }
  });
}
