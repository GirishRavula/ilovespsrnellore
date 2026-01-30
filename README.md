# 🌟 iLoveSPSR Nellore

A modern services and e-commerce platform for SPSR Nellore district, Andhra Pradesh.

## 🚀 Features

- **Services Marketplace** - Book local services like home repair, personal care, education, healthcare
- **E-commerce** - Buy local products including food items, handloom, electronics
- **Business Registration** - Local businesses can register and offer their services
- **User Authentication** - Secure JWT-based authentication
- **Shopping Cart** - Add services/products to cart and checkout
- **Order Management** - Track orders and order history

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js + Express.js |
| Database | SQLite (WAL mode) |
| Auth | JWT + bcrypt |
| Security | Helmet, CORS, Rate Limiting |
| Frontend | Vanilla JS, CSS3 |
| Deployment | Docker |

## 📦 Quick Start

### Prerequisites
- Node.js 18+ (or Docker)
- npm

### Local Development

```bash
# Clone and install
git clone <repo-url>
cd ilovespsrnellore2
npm install

# Seed database with demo data
npm run seed

# Start server
npm start
# Or with hot-reload
npm run dev
```

Visit http://localhost:3001

### Using Docker

```bash
# Build and run
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# Development mode with hot reload
docker-compose --profile dev up dev
```

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get user profile (auth required) |
| PUT | `/api/auth/profile` | Update profile (auth required) |
| PUT | `/api/auth/password` | Change password (auth required) |

### Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all services |
| GET | `/api/services/categories` | List service categories |
| GET | `/api/services/:id` | Get service details |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/featured` | Featured products |
| GET | `/api/products/categories` | Product categories |
| GET | `/api/products/:id` | Product details |

### Cart & Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/cart` | Get user cart (auth) |
| POST | `/api/orders/cart` | Add to cart (auth) |
| PUT | `/api/orders/cart/:id` | Update cart item (auth) |
| DELETE | `/api/orders/cart/:id` | Remove from cart (auth) |
| POST | `/api/orders` | Create order (auth) |
| GET | `/api/orders` | Get user orders (auth) |

### Businesses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/businesses` | List businesses |
| POST | `/api/businesses` | Register business (auth) |
| GET | `/api/businesses/:id/stats` | Business stats |

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ilovespsrnellore.com | admin123 |
| Vendor | ravi@nelloreservices.com | vendor123 |
| Customer | priya@gmail.com | customer123 |

## 📁 Project Structure

```
ilovespsrnellore2/
├── server/
│   ├── index.js           # Express server entry
│   ├── config.js          # Configuration
│   ├── db/
│   │   ├── database.js    # SQLite schema
│   │   └── seed.js        # Demo data seeder
│   ├── middleware/
│   │   └── auth.js        # JWT auth middleware
│   └── routes/
│       ├── auth.js        # Auth endpoints
│       ├── services.js    # Services API
│       ├── products.js    # Products API
│       ├── orders.js      # Orders/Cart API
│       └── businesses.js  # Business API
├── public/
│   ├── index.html         # Frontend HTML
│   ├── style.css          # Styles
│   └── script.js          # Frontend JavaScript
├── data/                  # SQLite database (auto-created)
├── Dockerfile             # Production Docker image
├── Dockerfile.dev         # Development Docker image
├── docker-compose.yml     # Docker Compose config
├── package.json           # Dependencies
└── README.md              # This file
```

## 🔧 Environment Variables

Create a `.env` file (see `.env.example`):

```env
NODE_ENV=development
PORT=3001
DB_PATH=./data/ilovespsr.db
JWT_SECRET=your-super-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔒 Security Features

- **Helmet** - Secure HTTP headers
- **CORS** - Cross-origin resource sharing protection
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **bcrypt** - Password hashing (12 rounds)
- **JWT** - Secure token-based authentication
- **Input Validation** - express-validator for all inputs
- **SQL Injection Prevention** - Parameterized queries

## 🏃 Scripts

```bash
npm start     # Start production server
npm run dev   # Start with nodemon (hot reload)
npm run seed  # Seed database with demo data
npm test      # Run tests (coming soon)
```

## 📱 Features by Role

### Customer
- Browse and search services/products
- Add items to cart
- Checkout and track orders
- Rate and review services

### Vendor
- Register business
- Manage services/products
- View orders and stats
- Respond to reviews

### Admin
- Full access to all features
- Manage users and businesses
- View platform analytics

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

MIT License - feel free to use for your local community projects!

---

Made with ❤️ for SPSR Nellore, Andhra Pradesh 🇮🇳
