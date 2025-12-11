// Product data
const products = [
    {
        id: 1,
        name: "Смартфон Pro X",
        category: "Smartphones",
        price: 69900,
        image: "images/product-1.jpg"
    },
    {
        id: 2,
        name: "Беспроводные Наушники",
        category: "Audio",
        price: 12900,
        image: "images/product-2.jpg"
    },
    {
        id: 3,
        name: "Умные Часы",
        category: "Wearables",
        price: 29900,
        image: "images/product-3.jpg"
    },
    {
        id: 4,
        name: "Ноутбук Ultra",
        category: "Computers",
        price: 129900,
        image: "images/product-4.jpg"
    },
    {
        id: 5,
        name: "Планшет Pro",
        category: "Tablets",
        price: 49900,
        image: "images/product-5.jpg"
    },
    {
        id: 6,
        name: "Игровая Консоль",
        category: "Gaming",
        price: 39900,
        image: "images/product-6.jpg"
    },
    {
        id: 7,
        name: "Умный Телевизор 55\"",
        category: "TVs",
        price: 79900,
        image: "images/product-7.jpg"
    },
    {
        id: 8,
        name: "Камера DSLR",
        category: "Cameras",
        price: 89900,
        image: "images/product-8.jpg"
    },
    {
        id: 9,
        name: "Смартфон Galaxy S",
        category: "Smartphones",
        price: 79900,
        image: "images/product-9.jpg"
    },
    {
        id: 10,
        name: "Наушники Over-Ear Pro",
        category: "Audio",
        price: 15900,
        image: "images/product-10.jpg"
    },
    {
        id: 11,
        name: "Фитнес-браслет",
        category: "Wearables",
        price: 12900,
        image: "images/product-11.jpg"
    },
    {
        id: 12,
        name: "Игровой ПК",
        category: "Computers",
        price: 149900,
        image: "images/product-12.jpg"
    },
    {
        id: 13,
        name: "Планшет Mini",
        category: "Tablets",
        price: 29900,
        image: "images/product-13.jpg"
    },
    {
        id: 14,
        name: "Игровая Приставка Pro",
        category: "Gaming",
        price: 49900,
        image: "images/product-14.jpg"
    },
    {
        id: 15,
        name: "Телевизор 65\" 4K",
        category: "TVs",
        price: 99900,
        image: "images/product-15.jpg"
    },
    {
        id: 16,
        name: "Экшн-камера",
        category: "Cameras",
        price: 24900,
        image: "images/product-16.jpg"
    }
];

// Get cart from localStorage or initialize empty array
function getCart() {
    const cartData = localStorage.getItem('dcpCart');
    return cartData ? JSON.parse(cartData) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('dcpCart', JSON.stringify(cart));
}

// Shopping cart
let cart = getCart();
let currentCategory = 'all';
let currentSort = 'default';
let filteredProducts = [...products];

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    // Wait a bit for auth.js to load cart from DB if user is logged in
    await new Promise(resolve => setTimeout(resolve, 100));
    
    renderProducts();
    updateCartCount();
    updateProductCount();
    setupEventListeners();
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Setup event listeners
function setupEventListeners() {
    // Category filter buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            currentCategory = this.getAttribute('data-category');
            filterAndSortProducts();
        });
    });

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            filterAndSortProducts();
        });
    }
}

// Filter and sort products
function filterAndSortProducts() {
    // Filter by category
    if (currentCategory === 'all') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(p => p.category === currentCategory);
    }

    // Sort products
    switch(currentSort) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        default:
            // Keep original order
            break;
    }

    renderProducts();
    updateProductCount();
}

// Update product count
function updateProductCount() {
    const productCount = document.getElementById('productCount');
    if (productCount) {
        const count = filteredProducts.length;
        let categoryText = '';
        if (currentCategory === 'all') {
            productCount.textContent = `Показаны все товары`;
        } else {
            const categoryNames = {
                'Smartphones': 'смартфонах',
                'Audio': 'аудио',
                'Wearables': 'носимых устройствах',
                'Computers': 'компьютерах',
                'Tablets': 'планшетах',
                'Gaming': 'играх',
                'TVs': 'телевизорах',
                'Cameras': 'камерах'
            };
            categoryText = categoryNames[currentCategory] || currentCategory.toLowerCase();
            const word = count === 1 ? 'товар' : (count < 5 ? 'товара' : 'товаров');
            productCount.textContent = `Показано ${count} ${word} в категории ${categoryText}`;
        }
    }
}

// Render products
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    const categoryNames = {
        'Smartphones': 'Смартфоны',
        'Audio': 'Аудио',
        'Wearables': 'Носимые устройства',
        'Computers': 'Компьютеры',
        'Tablets': 'Планшеты',
        'Gaming': 'Игровое',
        'TVs': 'Телевизоры',
        'Cameras': 'Камеры'
    };
    
    productsGrid.innerHTML = '';

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--gray);">В этой категории товары не найдены.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const quantity = getProductQuantity(product.id);
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        let buttonHTML = '';
        if (quantity > 0) {
            buttonHTML = `
                <div class="quantity-controls">
                    <button class="qty-btn minus" onclick="event.stopPropagation(); removeFromCartProduct(${product.id})">-</button>
                    <span class="quantity-display">${quantity}</span>
                    <button class="qty-btn plus" onclick="event.stopPropagation(); addToCart(${product.id})">+</button>
                </div>
            `;
        } else {
            buttonHTML = `
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
                    В Корзину
                </button>
            `;
        }
        
        productCard.innerHTML = `
            <a href="product.html?id=${product.id}" class="product-link">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${categoryNames[product.category]}</div>
                    <div class="product-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                </div>
            </a>
            <div class="product-actions">
                ${buttonHTML}
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// Get quantity of a product in cart
function getProductQuantity(productId) {
    cart = getCart();
    const item = cart.find(item => item.id === productId);
    return item ? (item.quantity || 1) : 0;
}

// Add to cart
async function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart = getCart();
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        saveCart(cart);
        updateCartCount();
        renderProducts(); // Re-render to update quantity controls
        
        // Sync to database if logged in
        if (typeof window.saveCartToDB === 'function') {
            await window.saveCartToDB();
        }
    }
}

// Remove from cart (decrease quantity)
async function removeFromCartProduct(productId) {
    cart = getCart();
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        const quantity = existingItem.quantity || 1;
        if (quantity > 1) {
            existingItem.quantity = quantity - 1;
        } else {
            cart = cart.filter(item => item.id !== productId);
        }
        saveCart(cart);
        updateCartCount();
        renderProducts(); // Re-render to update quantity controls
        
        // Sync to database if logged in
        if (typeof window.saveCartToDB === 'function') {
            await window.saveCartToDB();
        }
    }
}

// Update cart count
function updateCartCount() {
    cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
}

