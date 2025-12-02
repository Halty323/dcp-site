# DCP Electronics E-commerce Site

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### 3. Database

The SQLite database (`dcp.db`) will be automatically created when you first run the server.

## Features

- User registration and login
- Product browsing with categories and sorting
- Shopping cart (saved to database for logged-in users)
- Individual product pages
- Responsive design

## File Structure

- `server.js` - Node.js/Express backend server
- `package.json` - Dependencies and scripts
- `dcp.db` - SQLite database (created automatically)
- Frontend files: `index.html`, `cart.html`, `product.html`, `login.html`, `register.html`
- JavaScript files: `script.js`, `cart.js`, `product.js`, `auth.js`
- `styles.css` - All styling

## API Endpoints

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/session` - Check current session
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/clear` - Clear cart

## Notes

- Passwords are hashed using bcrypt
- Sessions are stored server-side
- Cart is saved to database for logged-in users
- Cart persists in localStorage for non-logged-in users

