# ShopSmart AI — Smart E-Commerce Platform with AI Shopping Assistant

**ShopSmart AI** is a production-grade full-stack MERN e-commerce application equipped with a conversational AI Shopping Assistant. It allows customers to discover products through natural-language conversation, receive grounded recommendations, purchase securely via Razorpay, and track orders in real-time. Store administrators can manage inventory, fulfillment, customer metrics, discount coupons, and business analytics.

---

## 🌟 Key Features

### 🤖 1. AI Shopping Assistant
- **Natural-Language Product Discovery**: Understands customer intent, price constraints ("under ₹3,000", "between ₹2,000 and ₹5,000"), categories, and intended usage ("for college coding", "home espresso", "gift under ₹1,500").
- **Strict Catalog Grounding**: Never invents or hallucinates products, specs, stock quantities, or prices. Only items present in the MongoDB database are recommended.
- **Side-by-Side Comparison**: Compares specs and prices of matched products upon request.
- **Embedded Action Cards**: Direct "Add to Cart" and "View Details" buttons directly inside the chat dialog.
- **Dual-Engine Architecture**: Powered by Google Generative AI (Gemini 1.5 Flash) with an intelligent, resilient local semantic search fallback engine when offline or if an API key is not supplied.

### 🛍️ 2. Customer Shopping Experience
- **Interactive Home Page**: Promotional announcement bar, AI hero search bar, example prompt chips, trending products, best sellers, and personalized recommendations for authenticated users.
- **Comprehensive Product Catalog**: Instant search, multi-brand filter, price range slider/inputs, star rating filter, in-stock toggle, and sorting options (Newest, Price Low-to-High, Price High-to-Low, Highest Rated, Most Popular).
- **Product Details**: Image gallery with thumbnail selector, real-time stock status badge, technical specifications table, verified customer reviews, review submission form, and related products.
- **Smart Shopping Cart**: Backend recalculated pricing, stock validation, free delivery progress bar, and active discount promo codes (`WELCOME10`, `SMART500`, `FESTIVE20`).
- **Wishlist**: Save favorite products with 1-click "Move to Cart".
- **Customer Dashboard**: Manage profile details, saved delivery addresses, order history, and visual status progression timeline.

### 💳 3. Payments & Order Integrity
- **Official Razorpay Integration**: Server-side order creation in integer paise and cryptographic HMAC-SHA256 signature verification.
- **Built-in Development Sandbox Simulation**: Enables complete end-to-end payment testing without requiring real credit cards.
- **Atomic Stock Protection**: Safe inventory decrements upon verified payment to prevent overselling.
- **Cash on Delivery (COD)**: Doorstep payment option with immediate order confirmation.
- **Idempotent Webhooks**: Prevents duplicate order updates.
- **Transactional Emails**: Automated order confirmation emails with itemized receipts.

### 📊 4. Admin Management Console
- **Business KPI Metrics**: Total confirmed revenue, total orders, customers, active products, average order value, pending orders count, and low-stock alerts.
- **Visual Analytics with Recharts**: Daily revenue trend (AreaChart), order status distribution (PieChart), and category product breakdown (BarChart).
- **Product CRUD**: Add, edit, or deactivate products with Cloudinary image upload support.
- **Inventory Management**: Low-stock warning table (<= 5 units), quick restock modal, and complete stock movement audit logs.
- **Order Fulfillment**: Permitted status transitions (`pending_payment` → `confirmed` → `processing` → `shipped` → `delivered`), carrier assignment, and tracking numbers.
- **Coupon Management**: Create percentage or fixed discount promo codes with minimum spend requirements and usage limits.
- **Data Export**: One-click sales report export to CSV.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router DOM, Axios, Context API, Lucide React, Recharts |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Helmet, Express Rate Limit, Multer |
| **AI Integration** | Google Generative AI (Gemini 1.5 Flash SDK) + Semantic Catalog Grounding Engine |
| **Payments** | Razorpay Node.js SDK, Crypto HMAC-SHA256 Verification |
| **Services** | Cloudinary (Image uploads), Nodemailer (Transactional email alerts) |
| **Testing** | Jest, Supertest (14 Automated Integration Tests) |

---

## 📂 Project Structure

```text
shopsmart-ai/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Footer, ProductCard, AIAssistantModal, etc.
│   │   ├── context/            # AuthContext, CartContext, WishlistContext, ToastContext
│   │   ├── layouts/            # MainLayout, AdminLayout
│   │   ├── pages/              # Home, Products, ProductDetails, Cart, Checkout, etc.
│   │   │   └── admin/          # AdminDashboard, AdminAnalytics, AdminProducts, etc.
│   │   ├── services/           # Axios API instance with auth interceptor
│   │   └── App.jsx             # React Router configuration
│   └── vite.config.js          # Vite config with Tailwind & proxy
│
├── server/                     # Express Backend API
│   ├── config/                 # MongoDB database connection
│   ├── controllers/            # Auth, Product, Cart, Order, Payment, AI, Admin controllers
│   ├── middleware/             # Auth JWT, RBAC, Central Error Handler, Rate Limiting, Multer
│   ├── models/                 # User, Product, Category, Cart, Order, Review, Coupon, Conversation, Inventory
│   ├── routes/                 # REST API route handlers
│   ├── scripts/                # Database seed script
│   ├── services/               # AI Service, Payment Service, Email Service, Cloudinary Service
│   ├── tests/                  # Automated Jest & Supertest integration test suite
│   ├── app.js                  # Express application setup
│   └── server.js               # HTTP server entry point
│
├── .gitignore
├── package.json                # Monorepo root scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or newer
- **MongoDB**: Running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string.

### 2. Installation
Install all dependencies for root, server, and client:
```bash
# Root directory
npm install

# Server dependencies
cd server
npm install
cd ..

# Client dependencies
cd client
npm install
cd ..
```

### 3. Environment Variables
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/shopsmart_ai

# JWT Auth
JWT_SECRET=shopsmart_super_secure_jwt_secret_dev_key_2026_change_in_production
JWT_EXPIRES_IN=7d

# Optional Integrations (Sandboxed fallbacks active if unconfigured)
GEMINI_API_KEY=
RAZORPAY_KEY_ID=rzp_test_shopsmart_dev
RAZORPAY_KEY_SECRET=shopsmart_secret_key_123456
RAZORPAY_WEBHOOK_SECRET=shopsmart_webhook_secret_key
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Seed Database
Populate MongoDB with realistic sample categories, products, customer reviews, promo coupons, and historical orders:
```bash
npm run seed
```

### 5. Run the Application
Launch both client and server concurrently:
```bash
npm run dev
```
- **Storefront & Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Credentials

For quick evaluation, click the **Quick Fill Demo Accounts** buttons directly on the Login page:

| Role | Email | Password | Access |
|---|---|---|---|
| **Administrator** | `admin@shopsmart.ai` | `Admin@123456` | Full Admin Console (`/admin`), Inventory, Analytics, Orders, Coupons |
| **Customer** | `customer@shopsmart.ai` | `Customer@123456` | Storefront, AI Assistant, Cart, Checkout, Order Tracking |

### Active Promo Coupons
- `WELCOME10`: 10% discount on orders above ₹500
- `SMART500`: Flat ₹500 off on orders above ₹2,999
- `FESTIVE20`: 20% discount on orders above ₹1,500

---

## 🧪 Automated Testing

Execute the 14 automated backend integration tests covering authentication, catalog filtering, budget extraction, cart stock validation, admin authorization, AI shopping assistant endpoint, and Razorpay signature verification:

```bash
npm run test
```

---

## 🌐 Production Deployment

### 1. Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Whitelist all network IPs (`0.0.0.0/0`) or your hosting provider's IP.
3. Set `MONGODB_URI` in your backend environment variables.

### 2. Backend (Render / Railway)
1. Root directory: `server`
2. Build Command: `npm install`
3. Start Command: `node server.js`
4. Configure environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, etc.).

### 3. Frontend (Vercel)
1. Root directory: `client`
2. Framework Preset: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set `VITE_API_URL` to your production backend URL (e.g. `https://your-api.onrender.com/api`).

---

## 📄 License
ISC License © 2026 ShopSmart AI Inc.
