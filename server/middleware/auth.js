const jwt = require('jsonwebtoken');
const config = require('../config');

// Verify JWT token middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Optional auth - doesn't fail if no token
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = jwt.verify(token, config.JWT_SECRET);
        } catch (err) {
            // Token invalid, but continue without user
        }
    }
    next();
};

// Check if user is vendor or admin
const isVendor = (req, res, next) => {
    if (!req.user || (req.user.role !== 'vendor' && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Access denied. Vendor privileges required.' });
    }
    next();
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

module.exports = { authenticate, optionalAuth, isVendor, isAdmin };
