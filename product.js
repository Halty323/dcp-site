// Get product ID from URL
function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

// Get cart from localStorage
function getCart() {
    const cartData = localStorage.getItem('dcpCart');
    return cartData ? JSON.parse(cartData) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('dcpCart', JSON.stringify(cart));
}

// Get quantity of a product in cart
function getProductQuantity(productId) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    return item ? (item.quantity || 1) : 0;
}

// Add to cart
async function addToCartProductPage(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        let cart = getCart();
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
        renderProductPage();
        
        // Sync to database if logged in
        if (typeof window.saveCartToDB === 'function') {
            await window.saveCartToDB();
        }
    }
}

// Remove from cart (decrease quantity)
async function removeFromCartProductPage(productId) {
    let cart = getCart();
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
        renderProductPage();
        
        // Sync to database if logged in
        if (typeof window.saveCartToDB === 'function') {
            await window.saveCartToDB();
        }
    }
}

// Update cart count
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
}

// Render product page
function renderProductPage() {
    const productId = getProductIdFromURL();
    const productContent = document.getElementById('productContent');
    
    if (!productContent) return;

    if (!productId) {
        productContent.innerHTML = `
            <div class="product-not-found">
                <h1>Товар не найден</h1>
                <p>Товар с указанным ID не существует.</p>
                <a href="index.html#products" class="back-to-shop">Вернуться к товарам</a>
            </div>
        `;
        return;
    }

    const product = products.find(p => p.id === productId);
    
    if (!product) {
        productContent.innerHTML = `
            <div class="product-not-found">
                <h1>Товар не найден</h1>
                <p>Товар с указанным ID не существует.</p>
                <a href="index.html#products" class="back-to-shop">Вернуться к товарам</a>
            </div>
        `;
        return;
    }

    const quantity = getProductQuantity(productId);
    const categoryNames = {
        'Smartphones': 'Смартфоны',
        'Audio': 'Аудио',
        'Wearables': 'Носимые устройства',
        'Computers': 'Компьютеры',
        'Tablets': 'Планшеты',
        'Gaming': 'Игры',
        'TVs': 'Телевизоры',
        'Cameras': 'Камеры'
    };

    let buttonHTML = '';
    if (quantity > 0) {
        buttonHTML = `
            <div class="product-quantity-controls">
                <button class="qty-btn minus" onclick="removeFromCartProductPage(${product.id})">-</button>
                <span class="quantity-display">${quantity}</span>
                <button class="qty-btn plus" onclick="addToCartProductPage(${product.id})">+</button>
            </div>
        `;
    } else {
        buttonHTML = `
            <button class="add-to-cart-large" onclick="addToCartProductPage(${product.id})">
                В Корзину
            </button>
        `;
    }

    productContent.innerHTML = `
        <div class="product-detail">
            <div class="product-detail-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="product-detail-info">
                <div class="product-detail-category">${categoryNames[product.category] || product.category}</div>
                <h1 class="product-detail-name">${product.name}</h1>
                <div class="product-detail-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                <div class="product-detail-description">
                    <p>${product.description || 'Премиальное качество и инновационные технологии в одном устройстве. Идеальное сочетание функциональности и стиля для современного образа жизни. Этот продукт разработан с использованием передовых технологий и материалов высочайшего качества.'}</p>
                </div>
                ${buttonHTML}
                <div class="product-detail-features">
                    <h3>Характеристики</h3>
                    <ul>
                        ${product.features ? product.features.map(feature => `<li>${feature}</li>`).join('') : `
                            <li>Высокое качество сборки</li>
                            <li>Современный дизайн</li>
                            <li>Гарантия производителя</li>
                            <li>Быстрая доставка</li>
                        `}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Initialize product page
document.addEventListener('DOMContentLoaded', async function() {
    // Wait a bit for auth.js to load cart from DB if user is logged in
    await new Promise(resolve => setTimeout(resolve, 100));
    renderProductPage();
    updateCartCount();
});

