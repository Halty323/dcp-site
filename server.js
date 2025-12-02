const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Session configuration
app.use(session({
    secret: 'dcp-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize database
const dbPath = path.join(__dirname, 'dcp.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Carts table
    db.run(`CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, product_id)
    )`);

    console.log('Database tables initialized');
}

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Пользователь с таким именем или email уже существует' });
                    }
                    return res.status(500).json({ error: 'Ошибка при регистрации' });
                }
                
                // Auto login after registration
                req.session.userId = this.lastID;
                req.session.username = username;
                
                res.json({ 
                    success: true, 
                    message: 'Регистрация успешна',
                    user: { id: this.lastID, username }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при регистрации' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Введите имя пользователя и пароль' });
    }

    db.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка при входе' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
            }

            try {
                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
                }

                req.session.userId = user.id;
                req.session.username = user.username;

                res.json({ 
                    success: true, 
                    message: 'Вход выполнен успешно',
                    user: { id: user.id, username: user.username }
                });
            } catch (error) {
                res.status(500).json({ error: 'Ошибка при входе' });
            }
        }
    );
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка при выходе' });
        }
        res.json({ success: true, message: 'Выход выполнен успешно' });
    });
});

// Check session endpoint
app.get('/api/session', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            loggedIn: true, 
            user: { 
                id: req.session.userId, 
                username: req.session.username 
            } 
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// Get user cart
app.get('/api/cart', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    db.all(
        'SELECT product_id, quantity FROM carts WHERE user_id = ?',
        [req.session.userId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка при получении корзины' });
            }
            res.json({ cart: rows });
        }
    );
});

// Add to cart
app.post('/api/cart/add', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const { productId, quantity = 1 } = req.body;

    if (!productId) {
        return res.status(400).json({ error: 'ID товара обязателен' });
    }

    db.run(
        `INSERT INTO carts (user_id, product_id, quantity) 
         VALUES (?, ?, ?) 
         ON CONFLICT(user_id, product_id) 
         DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP`,
        [req.session.userId, productId, quantity, quantity],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Ошибка при добавлении в корзину' });
            }
            res.json({ success: true });
        }
    );
});

// Update cart item quantity
app.put('/api/cart/update', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
        return res.status(400).json({ error: 'ID товара и количество обязательны' });
    }

    if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        db.run(
            'DELETE FROM carts WHERE user_id = ? AND product_id = ?',
            [req.session.userId, productId],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Ошибка при обновлении корзины' });
                }
                res.json({ success: true });
            }
        );
    } else {
        // Use INSERT OR REPLACE to handle both insert and update
        db.run(
            `INSERT INTO carts (user_id, product_id, quantity, updated_at) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id, product_id) 
             DO UPDATE SET quantity = ?, updated_at = CURRENT_TIMESTAMP`,
            [req.session.userId, productId, quantity, quantity],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Ошибка при обновлении корзины' });
                }
                res.json({ success: true });
            }
        );
    }
});

// Clear cart
app.delete('/api/cart/clear', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    db.run(
        'DELETE FROM carts WHERE user_id = ?',
        [req.session.userId],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка при очистке корзины' });
            }
            res.json({ success: true });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});

