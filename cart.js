// Get cart from localStorage
function getCart() {
    const cartData = localStorage.getItem('dcpCart');
    return cartData ? JSON.parse(cartData) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('dcpCart', JSON.stringify(cart));
}

// Update cart count in sidebar
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
}

// Remove item from cart (decrease quantity by 1)
async function removeFromCart(productId) {
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
        renderCart();
        updateCartCount();
        
        // Sync to database if logged in
        if (typeof window.saveCartToDB === 'function') {
            await window.saveCartToDB();
        }
    }
}

// Add item to cart from cart page
async function addToCartFromCart(productId) {
    let cart = getCart();
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        saveCart(cart);
        renderCart();
        updateCartCount();
        
        // Sync to database if logged in
        if (typeof window.saveCartToDB === 'function') {
            await window.saveCartToDB();
        }
    }
}

// Render cart
function renderCart() {
    const cart = getCart();
    const cartContent = document.getElementById('cartContent');
    
    if (!cartContent) return;

    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h2>Ваша корзина пуста</h2>
                <p>Похоже, вы ещё не добавили товары в корзину.</p>
                <a href="index.html#products" class="back-to-shop">Продолжить Покупки</a>
            </div>
        `;
        return;
    }

    // Ensure all items have quantity property (for backward compatibility)
    cart.forEach(item => {
        if (!item.quantity) {
            item.quantity = 1;
        }
    });
    saveCart(cart);

    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    let cartItemsHTML = '<div class="cart-layout"><div class="cart-items">';
    
    cart.forEach((item) => {
        const quantity = item.quantity || 1;
        const itemTotal = item.price * quantity;
        // Handle backward compatibility: use image if available, otherwise try to construct from id, or use placeholder
        let itemImage = item.image;
        if (!itemImage && item.id) {
            itemImage = `images/product-${item.id}.jpg`;
        }
        if (!itemImage) {
            itemImage = 'images/placeholder.jpg';
        }
        cartItemsHTML += `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${itemImage}" alt="${item.name}" onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-category">${item.category}</div>
                </div>
                <div class="cart-item-quantity-controls">
                    <button class="qty-btn minus" onclick="removeFromCart(${item.id})">-</button>
                    <span class="quantity-display">${quantity}</span>
                    <button class="qty-btn plus" onclick="addToCartFromCart(${item.id})">+</button>
                </div>
                <div class="cart-item-price">
                    <div class="item-total">${itemTotal.toLocaleString('ru-RU')} ₽</div>
                    <div class="item-unit-price">${item.price.toLocaleString('ru-RU')} ₽ за шт.</div>
                </div>
            </div>
        `;
    });
    
    cartItemsHTML += '</div>';
    
    cartItemsHTML += `
        <div class="cart-summary">
            <h3>Итоги Заказа</h3>
            <div class="summary-row">
                <span>Итого:</span>
                <span>${total.toLocaleString('ru-RU')} ₽</span>
            </div>
            <button class="checkout-btn" onclick="checkout()">Оформить Заказ</button>
        </div>
    </div>`;

    cartContent.innerHTML = cartItemsHTML;
}

// Checkout function
async function checkout() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('Ваша корзина пуста!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    alert(`Спасибо за ваш заказ!\n\nИтого: ${total.toLocaleString('ru-RU')} ₽\n\nЭто демонстрационный сайт. В реальном приложении вы будете перенаправлены на платёжный процессор.`);
    
    // Clear cart after checkout
    saveCart([]);
    
    // Clear cart in database if logged in
    if (typeof checkSession === 'function') {
        const session = await checkSession();
        if (session.loggedIn) {
            try {
                await fetch('/api/cart/clear', {
                    method: 'DELETE'
                });
            } catch (error) {
                console.error('Error clearing cart in DB:', error);
            }
        }
    }
    
    renderCart();
    updateCartCount();
}

// Initialize cart page
document.addEventListener('DOMContentLoaded', async function() {
    // Wait a bit for auth.js to load cart from DB if user is logged in
    await new Promise(resolve => setTimeout(resolve, 100));
    renderCart();
    updateCartCount();
});

