# 🌟 iLoveSPSR Nellore

A modern services and e-commerce platform for SPSR Nellore district, Andhra Pradesh.

**Live Platform**: Connect local businesses with customers for services and shopping.

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🚀 Quick Start

### One Command Setup

```bash
# Clone and run the quick start script
git clone <repo-url>
cd ilovespsrnellore
./quickstart.sh
```

The script will:
- ✅ Detect if you have Docker or Node.js
- ✅ Set up environment variables
- ✅ Install dependencies
- ✅ Seed database with demo data
- ✅ Start the application

**Then open**: [http://localhost:3001](http://localhost:3001)

### Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### Using Docker (Recommended)

```bash
# 1. Clone repository
git clone <repo-url>
cd ilovespsrnellore

# 2. Start with Docker Compose
docker-compose up -d --build

# 3. Seed database
docker exec -it ilovespsr-nellore node server/db/seed.js

# 4. Open http://localhost:3001
```

#### Using Node.js

```bash
# Prerequisites: Node.js 18+ and npm
git clone <repo-url>
cd ilovespsrnellore
npm install

# Seed database
npm run seed

# Start server
npm start

# Open http://localhost:3001
```

</details>

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | priya@gmail.com | customer123 |
| Vendor | ravi@nelloreservices.com | vendor123 |
| Admin | admin@ilovespsrnellore.com | admin123 |

## 🎯 Features

- ✅ **Services Marketplace** - Book local services (electrician, plumber, cleaning, etc.)
- ✅ **E-commerce** - Shop local products (groceries, fashion, electronics)
- ✅ **Business Registration** - Vendors can register and manage their offerings
- ✅ **Secure Authentication** - JWT-based login with bcrypt password hashing
- ✅ **Shopping Cart** - Add items to cart and checkout
- ✅ **Order Management** - Track orders and history
- ✅ **Mobile Responsive** - Works on all devices

## 🛠️ Tech Stack

**Safe, Secure, Fast, and Affordable** ✨

| Component | Technology | Why? |
|-----------|------------|------|
| Backend | Node.js + Express.js | Fast, scalable, widely supported |
| Database | SQLite (WAL mode) | Zero config, serverless, performant |
| Auth | JWT + bcrypt | Industry standard security |
| Security | Helmet, CORS, Rate Limiting | Protection against common attacks |
| Frontend | Vanilla JS + CSS3 | No build step, fast load times |
| Deployment | Docker | Deploy anywhere - any cloud platform |

### Security Features

- 🔒 **Helmet** - Secure HTTP headers
- 🔒 **CORS** - Cross-origin protection
- 🔒 **Rate Limiting** - 100 requests per 15 minutes per IP
- 🔒 **bcrypt** - Password hashing (12 rounds)
- 🔒 **JWT** - Secure token-based authentication
- 🔒 **Input Validation** - All inputs validated with express-validator
- 🔒 **SQL Injection Prevention** - Parameterized queries

## 📁 Project Structure

```
ilovespsrnellore/
├── server/
│   ├── index.js              # Express server
│   ├── config.js             # Configuration
│   ├── db/
│   │   ├── database.js       # SQLite schema
│   │   └── seed.js           # Demo data seeder
│   ├── middleware/
│   │   └── auth.js           # JWT auth middleware
│   └── routes/
│       ├── auth.js           # Authentication API
│       ├── services.js       # Services API
│       ├── products.js       # Products API
│       ├── orders.js         # Orders/Cart API
│       └── businesses.js     # Business registration API
├── public/
│   ├── index.html            # Frontend SPA
│   ├── style.css             # Styles
│   └── script.js             # Frontend logic
├── Dockerfile                # Production Docker image
├── docker-compose.yml        # Docker orchestration
├── quickstart.sh             # Quick setup script
├── DEPLOYMENT.md             # Cloud deployment guide
└── README.md                 # This file
```

## 📚 API Documentation

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Authentication
```bash
# Register
POST /api/auth/register
Content-Type: application/json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "securepass123",
  "role": "customer"
}

# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "priya@gmail.com",
  "password": "customer123"
}

# Get Profile (requires auth token)
GET /api/auth/me
Authorization: Bearer <your-jwt-token>
```

### Services & Products
```bash
# List all services
GET /api/services

# List all products
GET /api/products

# Get featured products
GET /api/products/featured
```

### Cart & Orders (requires authentication)
```bash
# Add to cart
POST /api/orders/cart
Authorization: Bearer <token>
{
  "item_type": "product",
  "item_id": 1,
  "quantity": 2
}

# Get cart
GET /api/orders/cart
Authorization: Bearer <token>

# Place order
POST /api/orders
Authorization: Bearer <token>
{
  "delivery_address": "123 Main St",
  "delivery_area": "Magunta Layout",
  "payment_method": "cod"
}
```

For complete API documentation, see the individual route files in `server/routes/`.

## 🌐 Cloud Deployment

**Deploy to any cloud platform in minutes!**

We support deployment to:
- ✅ Render.com (Free tier available)
- ✅ Railway.app (Free tier available)
- ✅ Fly.io (Free tier available)
- ✅ DigitalOcean App Platform
- ✅ AWS, Azure, Google Cloud
- ✅ Any VPS with Docker

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.**

### Quick Deploy to Render.com

1. Fork this repository
2. Sign up at [render.com](https://render.com)
3. Create New Web Service → Connect your repo
4. Render auto-detects Docker
5. Add environment variable: `JWT_SECRET=<random-string>`
6. Click "Create Web Service"
7. Once deployed, seed the database in Render shell:
   ```bash
   node server/db/seed.js
   ```

## 🔧 Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
NODE_ENV=development
PORT=3001
DB_PATH=./server/db/nellore.db
JWT_SECRET=your-super-secret-jwt-key-change-me-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ Important**: Change `JWT_SECRET` to a strong random value in production!

## 🏃 Scripts

```bash
npm start          # Start production server
npm run dev        # Start with nodemon (hot reload)
npm run seed       # Seed database with demo data
npm test           # Run tests (coming soon)
```

## 📱 Features by Role

### Customer
- Browse services and products
- Search and filter
- Add items to cart
- Place orders (COD/Online)
- Track order status
- Rate and review

### Vendor
- Register business
- Add/manage services or products
- View and manage orders
- Business analytics dashboard
- Respond to customer reviews

### Admin
- Full platform access
- Manage users and businesses
- Platform analytics
- Content moderation

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use for your local community projects!

## 🆘 Support

- 📖 [Deployment Guide](./DEPLOYMENT.md)
- 💬 Create an issue for bug reports or feature requests
- 📧 Contact: hello@ilovespsrnellore.com

---

**Made with ❤️ for SPSR Nellore, Andhra Pradesh 🇮🇳**
