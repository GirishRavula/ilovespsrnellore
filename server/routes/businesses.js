const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { authenticate, isVendor } = require('../middleware/auth');

const router = express.Router();

// Get all verified businesses
router.get('/', (req, res) => {
    try {
        const { type, area, search, limit = 20, offset = 0 } = req.query;

        let query = `
            SELECT b.*, u.name as owner_name
            FROM businesses b
            JOIN users u ON b.user_id = u.id
            WHERE b.is_active = 1
        `;
        const params = [];

        if (type) {
            query += ' AND (b.business_type = ? OR b.business_type = ?)';
            params.push(type, 'both');
        }

        if (area) {
            query += ' AND b.area LIKE ?';
            params.push(`%${area}%`);
        }

        if (search) {
            query += ' AND (b.business_name LIKE ? OR b.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY b.is_verified DESC, b.rating DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const businesses = db.prepare(query).all(...params);

        res.json({ businesses });
    } catch (err) {
        console.error('Get businesses error:', err);
        res.status(500).json({ error: 'Failed to fetch businesses' });
    }
});

// Get single business
router.get('/:id', (req, res) => {
    try {
        const business = db.prepare(`
            SELECT b.*, u.name as owner_name, u.email as owner_email
            FROM businesses b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ? AND b.is_active = 1
        `).get(req.params.id);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Get services
        const services = db.prepare(`
            SELECT id, name, slug, price, rating, review_count 
            FROM services 
            WHERE vendor_id = ? AND is_active = 1
            ORDER BY rating DESC LIMIT 10
        `).all(business.user_id);

        // Get products
        const products = db.prepare(`
            SELECT id, name, slug, price, mrp, rating, review_count, image
            FROM products 
            WHERE vendor_id = ? AND is_active = 1
            ORDER BY rating DESC LIMIT 10
        `).all(business.user_id);

        // Get reviews
        const reviews = db.prepare(`
            SELECT r.*, u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.review_type = 'business' AND r.item_id = ?
            ORDER BY r.created_at DESC LIMIT 10
        `).all(req.params.id);

        res.json({ business, services, products, reviews });
    } catch (err) {
        console.error('Get business error:', err);
        res.status(500).json({ error: 'Failed to fetch business' });
    }
});

// Register business (for vendors)
router.post('/register', authenticate, [
    body('business_name').trim().notEmpty().withMessage('Business name required'),
    body('business_type').isIn(['service', 'product', 'both']).withMessage('Invalid business type'),
    body('address').trim().notEmpty().withMessage('Address required'),
    body('area').trim().notEmpty().withMessage('Area required'),
    body('pincode').trim().isLength({ min: 6, max: 6 }).withMessage('Valid pincode required'),
    body('phone').isMobilePhone('en-IN').withMessage('Valid phone required')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Check if user already has a business
        const existing = db.prepare('SELECT id FROM businesses WHERE user_id = ?').get(req.user.id);
        if (existing) {
            return res.status(400).json({ error: 'You already have a registered business' });
        }

        const { 
            business_name, business_type, description, logo, 
            address, area, pincode, phone, whatsapp, email, gstin 
        } = req.body;

        const result = db.prepare(`
            INSERT INTO businesses (user_id, business_name, business_type, description, logo, 
                address, area, pincode, phone, whatsapp, email, gstin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            req.user.id, business_name, business_type, description, logo,
            address, area, pincode, phone, whatsapp || phone, email, gstin
        );

        // Update user role to vendor
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run('vendor', req.user.id);

        const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({ 
            message: 'Business registered successfully. Verification pending.', 
            business 
        });
    } catch (err) {
        console.error('Register business error:', err);
        res.status(500).json({ error: 'Failed to register business' });
    }
});

// Update business (vendor only)
router.put('/', authenticate, isVendor, (req, res) => {
    try {
        const business = db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(req.user.id);
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const { 
            business_name, description, logo, address, area, 
            pincode, phone, whatsapp, email 
        } = req.body;

        const updates = [];
        const values = [];

        if (business_name) { updates.push('business_name = ?'); values.push(business_name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (logo !== undefined) { updates.push('logo = ?'); values.push(logo); }
        if (address) { updates.push('address = ?'); values.push(address); }
        if (area) { updates.push('area = ?'); values.push(area); }
        if (pincode) { updates.push('pincode = ?'); values.push(pincode); }
        if (phone) { updates.push('phone = ?'); values.push(phone); }
        if (whatsapp) { updates.push('whatsapp = ?'); values.push(whatsapp); }
        if (email) { updates.push('email = ?'); values.push(email); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.user.id);
        db.prepare(`UPDATE businesses SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);

        const updated = db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(req.user.id);
        res.json({ message: 'Business updated', business: updated });
    } catch (err) {
        console.error('Update business error:', err);
        res.status(500).json({ error: 'Failed to update business' });
    }
});

// Get business stats (vendor only)
router.get('/my/stats', authenticate, isVendor, (req, res) => {
    try {
        const business = db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(req.user.id);
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Get stats
        const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE vendor_id = ?').get(req.user.id);
        const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE vendor_id = ? AND status = ?').get(req.user.id, 'pending');
        const completedOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE vendor_id = ? AND status = ?').get(req.user.id, 'completed');
        const totalRevenue = db.prepare('SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE vendor_id = ? AND status = ?').get(req.user.id, 'completed');
        const totalServices = db.prepare('SELECT COUNT(*) as count FROM services WHERE vendor_id = ? AND is_active = 1').get(req.user.id);
        const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE vendor_id = ? AND is_active = 1').get(req.user.id);

        res.json({
            business,
            stats: {
                total_orders: totalOrders.count,
                pending_orders: pendingOrders.count,
                completed_orders: completedOrders.count,
                total_revenue: totalRevenue.sum,
                total_services: totalServices.count,
                total_products: totalProducts.count
            }
        });
    } catch (err) {
        console.error('Get business stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Add review
router.post('/:id/review', authenticate, [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').optional().trim()
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const business = db.prepare('SELECT id FROM businesses WHERE id = ?').get(req.params.id);
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const { rating, comment } = req.body;

        // Check if already reviewed
        const existing = db.prepare(`
            SELECT id FROM reviews 
            WHERE user_id = ? AND review_type = 'business' AND item_id = ?
        `).get(req.user.id, req.params.id);

        if (existing) {
            // Update existing review
            db.prepare(`
                UPDATE reviews SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(rating, comment, existing.id);
        } else {
            // Create new review
            db.prepare(`
                INSERT INTO reviews (user_id, review_type, item_id, rating, comment)
                VALUES (?, 'business', ?, ?, ?)
            `).run(req.user.id, req.params.id, rating, comment);
        }

        // Update business rating
        const avgRating = db.prepare(`
            SELECT AVG(rating) as avg, COUNT(*) as count 
            FROM reviews WHERE review_type = 'business' AND item_id = ?
        `).get(req.params.id);

        db.prepare('UPDATE businesses SET rating = ?, review_count = ? WHERE id = ?')
            .run(avgRating.avg.toFixed(1), avgRating.count, req.params.id);

        res.json({ message: 'Review submitted' });
    } catch (err) {
        console.error('Add review error:', err);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

module.exports = router;
