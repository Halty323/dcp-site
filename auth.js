// Check if user is logged in
async function checkSession() {
    try {
        const response = await fetch('/api/session');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking session:', error);
        return { loggedIn: false };
    }
}

// Update navigation based on login status
async function updateNavigation() {
    const session = await checkSession();
    const navMenus = document.querySelectorAll('.nav-menu');
    
    navMenus.forEach(navMenu => {
        // Remove existing login/logout items
        const existingAuth = navMenu.querySelector('.auth-nav-item');
        if (existingAuth) {
            existingAuth.remove();
        }

        // Add appropriate item
        const li = document.createElement('li');
        if (session.loggedIn) {
            li.className = 'auth-nav-item';
            li.innerHTML = `
                <a href="#" onclick="logout(); return false;">
                    <span>👤 ${session.user.username}</span>
                </a>
            `;
        } else {
            li.className = 'auth-nav-item';
            li.innerHTML = `
                <a href="login.html">Войти</a>
            `;
        }
        navMenu.appendChild(li);
    });
}

// Login function
async function login(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (data.success) {
            // Reload cart from database and wait for it to complete
            await loadCartFromDB();
            // Small delay to ensure cart is loaded
            await new Promise(resolve => setTimeout(resolve, 100));
            // Redirect to home page
            window.location.href = 'index.html';
        } else {
            showError(data.error || 'Ошибка при входе');
        }
    } catch (error) {
        showError('Ошибка соединения с сервером');
    }
}

// Register function
async function register(username, email, password) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            // Reload cart from database and wait for it to complete
            await loadCartFromDB();
            // Small delay to ensure cart is loaded
            await new Promise(resolve => setTimeout(resolve, 100));
            // Redirect to home page
            window.location.href = 'index.html';
        } else {
            showError(data.error || 'Ошибка при регистрации');
        }
    } catch (error) {
        showError('Ошибка соединения с сервером');
    }
}

// Logout function
async function logout() {
    try {
        // Save cart to database before logging out
        if (typeof window.saveCartToDB === 'function') {
            await window.saveCartToDB();
        }
        
        const response = await fetch('/api/logout', {
            method: 'POST'
        });

        const data = await response.json();
        
        if (data.success) {
            // Don't clear local cart - keep it for guest mode
            // localStorage.removeItem('dcpCart');
            // Redirect to home page
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Hide error message
function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Initialize login page
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        await login(username, password);
    });
}

// Initialize register page
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showError('Пароли не совпадают');
            return;
        }
        
        await register(username, email, password);
    });
}

// Load cart from database
async function loadCartFromDB() {
    try {
        const session = await checkSession();
        if (!session.loggedIn) {
            return;
        }

        const response = await fetch('/api/cart');
        if (response.ok) {
            const data = await response.json();
            
            // Wait for products to be available if needed
            if (typeof products === 'undefined' || !products) {
                // If products not loaded yet, wait a bit and try again
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // Convert database cart format to local format
            const localCart = data.cart.map(item => {
                // We'll need to get product details from products array
                if (typeof products !== 'undefined' && products) {
                    const product = products.find(p => p.id === item.product_id);
                    if (product) {
                        return {
                            ...product,
                            quantity: item.quantity
                        };
                    }
                }
                return null;
            }).filter(item => item !== null);

            localStorage.setItem('dcpCart', JSON.stringify(localCart));
            
            // Update cart count if function exists
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
            
            // Re-render if functions exist
            if (typeof renderProducts === 'function') {
                renderProducts();
            }
            if (typeof renderCart === 'function') {
                renderCart();
            }
            if (typeof renderProductPage === 'function') {
                renderProductPage();
            }
        }
    } catch (error) {
        console.error('Error loading cart from DB:', error);
    }
}

// Save cart to database
window.saveCartToDB = async function saveCartToDB() {
    try {
        const session = await checkSession();
        if (!session.loggedIn) {
            return;
        }

        const cart = JSON.parse(localStorage.getItem('dcpCart') || '[]');
        
        // First, clear existing cart in database
        await fetch('/api/cart/clear', {
            method: 'DELETE'
        });
        
        // Then sync each item to database using update endpoint (which handles insert/update)
        for (const item of cart) {
            const quantity = item.quantity || 1;
            await fetch('/api/cart/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: item.id,
                    quantity: quantity
                })
            });
        }
    } catch (error) {
        console.error('Error saving cart to DB:', error);
    }
}

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', async () => {
    await updateNavigation();
    
    // If user is logged in, load cart from database
    const session = await checkSession();
    if (session.loggedIn && typeof loadCartFromDB === 'function') {
        await loadCartFromDB();
    }
});

