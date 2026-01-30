const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const businessesRoutes = require('./routes/businesses');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.RATE_LIMIT.windowMs,
    max: config.RATE_LIMIT.max,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/businesses', businessesRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        name: 'iLoveSPSR Nellore API'
    });
});

// Dashboard stats (public)
app.get('/api/stats', (req, res) => {
    try {
        const db = require('./db/database');
        
        const businesses = db.prepare('SELECT COUNT(*) as count FROM businesses WHERE is_active = 1').get();
        const services = db.prepare('SELECT COUNT(*) as count FROM services WHERE is_active = 1').get();
        const products = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get();
        const orders = db.prepare('SELECT COUNT(*) as count FROM orders').get();

        res.json({
            businesses: businesses.count,
            services: services.count,
            products: products.count,
            orders: orders.count
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// Start server
const PORT = config.PORT;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌟 iLoveSPSR Nellore API Server                         ║
║                                                           ║
║   Server running on http://localhost:${PORT}                 ║
║   API Base: http://localhost:${PORT}/api                     ║
║                                                           ║
║   Endpoints:                                              ║
║   • GET  /api/health     - Health check                   ║
║   • POST /api/auth/login - User login                     ║
║   • GET  /api/services   - List services                  ║
║   • GET  /api/products   - List products                  ║
║   • GET  /api/businesses - List businesses                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
