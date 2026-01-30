const express = require('express');
const db = require('../db/database');
const { authenticate, isVendor } = require('../middleware/auth');

const router = express.Router();

// Get all service categories
router.get('/categories', (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT sc.*, COUNT(s.id) as service_count 
            FROM service_categories sc
            LEFT JOIN services s ON s.category_id = sc.id AND s.is_active = 1
            WHERE sc.is_active = 1
            GROUP BY sc.id
            ORDER BY sc.name
        `).all();

        res.json({ categories });
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get all services (with optional filters)
router.get('/', (req, res) => {
    try {
        const { category, search, sort = 'popular', limit = 20, offset = 0 } = req.query;

        let query = `
            SELECT s.*, sc.name as category_name, sc.slug as category_slug,
                   b.business_name as vendor_name, b.is_verified as vendor_verified
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.id
            LEFT JOIN businesses b ON s.vendor_id = b.user_id
            WHERE s.is_active = 1
        `;
        const params = [];

        if (category) {
            query += ' AND sc.slug = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (s.name LIKE ? OR s.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Sorting
        switch (sort) {
            case 'price_low':
                query += ' ORDER BY s.price ASC';
                break;
            case 'price_high':
                query += ' ORDER BY s.price DESC';
                break;
            case 'rating':
                query += ' ORDER BY s.rating DESC';
                break;
            default:
                query += ' ORDER BY s.review_count DESC, s.rating DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const services = db.prepare(query).all(...params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total FROM services s
            JOIN service_categories sc ON s.category_id = sc.id
            WHERE s.is_active = 1
        `;
        const countParams = [];

        if (category) {
            countQuery += ' AND sc.slug = ?';
            countParams.push(category);
        }
        if (search) {
            countQuery += ' AND (s.name LIKE ? OR s.description LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const { total } = db.prepare(countQuery).get(...countParams);

        res.json({ services, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (err) {
        console.error('Get services error:', err);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Get single service
router.get('/:id', (req, res) => {
    try {
        const service = db.prepare(`
            SELECT s.*, sc.name as category_name, sc.slug as category_slug,
                   b.business_name as vendor_name, b.is_verified as vendor_verified,
                   b.phone as vendor_phone, b.whatsapp as vendor_whatsapp
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.id
            LEFT JOIN businesses b ON s.vendor_id = b.user_id
            WHERE s.id = ? AND s.is_active = 1
        `).get(req.params.id);

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        // Get reviews
        const reviews = db.prepare(`
            SELECT r.*, u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.review_type = 'service' AND r.item_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        `).all(req.params.id);

        // Get related services
        const related = db.prepare(`
            SELECT id, name, slug, price, rating, review_count
            FROM services
            WHERE category_id = ? AND id != ? AND is_active = 1
            ORDER BY rating DESC
            LIMIT 4
        `).all(service.category_id, req.params.id);

        res.json({ service, reviews, related });
    } catch (err) {
        console.error('Get service error:', err);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

// Create service (vendor only)
router.post('/', authenticate, isVendor, (req, res) => {
    try {
        const { category_id, name, description, price, price_unit, duration_mins } = req.body;

        if (!category_id || !name || !price) {
            return res.status(400).json({ error: 'Category, name, and price are required' });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const result = db.prepare(`
            INSERT INTO services (category_id, vendor_id, name, slug, description, price, price_unit, duration_mins)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(category_id, req.user.id, name, slug, description, price, price_unit || 'per service', duration_mins);

        const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({ message: 'Service created', service });
    } catch (err) {
        console.error('Create service error:', err);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// Update service (vendor only)
router.put('/:id', authenticate, isVendor, (req, res) => {
    try {
        const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        if (service.vendor_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this service' });
        }

        const { name, description, price, price_unit, duration_mins, is_active } = req.body;

        const updates = [];
        const values = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (price) { updates.push('price = ?'); values.push(price); }
        if (price_unit) { updates.push('price_unit = ?'); values.push(price_unit); }
        if (duration_mins !== undefined) { updates.push('duration_mins = ?'); values.push(duration_mins); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.params.id);
        db.prepare(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
        res.json({ message: 'Service updated', service: updated });
    } catch (err) {
        console.error('Update service error:', err);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

module.exports = router;
