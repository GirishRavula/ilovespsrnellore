const express = require('express');
const db = require('../db/database');
const { authenticate, isVendor } = require('../middleware/auth');

const router = express.Router();

// Get all product categories
router.get('/categories', (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT pc.*, COUNT(p.id) as product_count 
            FROM product_categories pc
            LEFT JOIN products p ON p.category_id = pc.id AND p.is_active = 1
            WHERE pc.is_active = 1
            GROUP BY pc.id
            ORDER BY pc.name
        `).all();

        res.json({ categories });
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get all products (with optional filters)
router.get('/', (req, res) => {
    try {
        const { category, search, featured, sort = 'popular', limit = 20, offset = 0 } = req.query;

        let query = `
            SELECT p.*, pc.name as category_name, pc.slug as category_slug,
                   b.business_name as vendor_name, b.is_verified as vendor_verified
            FROM products p
            JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN businesses b ON p.vendor_id = b.user_id
            WHERE p.is_active = 1
        `;
        const params = [];

        if (category) {
            query += ' AND pc.slug = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (featured === 'true') {
            query += ' AND p.is_featured = 1';
        }

        // Sorting
        switch (sort) {
            case 'price_low':
                query += ' ORDER BY p.price ASC';
                break;
            case 'price_high':
                query += ' ORDER BY p.price DESC';
                break;
            case 'rating':
                query += ' ORDER BY p.rating DESC';
                break;
            case 'newest':
                query += ' ORDER BY p.created_at DESC';
                break;
            default:
                query += ' ORDER BY p.is_featured DESC, p.review_count DESC, p.rating DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const products = db.prepare(query).all(...params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total FROM products p
            JOIN product_categories pc ON p.category_id = pc.id
            WHERE p.is_active = 1
        `;
        const countParams = [];

        if (category) {
            countQuery += ' AND pc.slug = ?';
            countParams.push(category);
        }
        if (search) {
            countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }
        if (featured === 'true') {
            countQuery += ' AND p.is_featured = 1';
        }

        const { total } = db.prepare(countQuery).get(...countParams);

        res.json({ products, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (err) {
        console.error('Get products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get featured products
router.get('/featured', (req, res) => {
    try {
        const products = db.prepare(`
            SELECT p.*, pc.name as category_name
            FROM products p
            JOIN product_categories pc ON p.category_id = pc.id
            WHERE p.is_active = 1 AND p.is_featured = 1
            ORDER BY p.rating DESC
            LIMIT 6
        `).all();

        res.json({ products });
    } catch (err) {
        console.error('Get featured error:', err);
        res.status(500).json({ error: 'Failed to fetch featured products' });
    }
});

// Get single product
router.get('/:id', (req, res) => {
    try {
        const product = db.prepare(`
            SELECT p.*, pc.name as category_name, pc.slug as category_slug,
                   b.business_name as vendor_name, b.is_verified as vendor_verified,
                   b.phone as vendor_phone
            FROM products p
            JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN businesses b ON p.vendor_id = b.user_id
            WHERE p.id = ? AND p.is_active = 1
        `).get(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get reviews
        const reviews = db.prepare(`
            SELECT r.*, u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.review_type = 'product' AND r.item_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        `).all(req.params.id);

        // Get related products
        const related = db.prepare(`
            SELECT id, name, slug, price, mrp, rating, review_count, image
            FROM products
            WHERE category_id = ? AND id != ? AND is_active = 1
            ORDER BY rating DESC
            LIMIT 4
        `).all(product.category_id, req.params.id);

        res.json({ product, reviews, related });
    } catch (err) {
        console.error('Get product error:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create product (vendor only)
router.post('/', authenticate, isVendor, (req, res) => {
    try {
        const { category_id, name, description, price, mrp, stock, unit, image } = req.body;

        if (!category_id || !name || !price) {
            return res.status(400).json({ error: 'Category, name, and price are required' });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const result = db.prepare(`
            INSERT INTO products (category_id, vendor_id, name, slug, description, price, mrp, stock, unit, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(category_id, req.user.id, name, slug, description, price, mrp || price, stock || 0, unit || 'piece', image);

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({ message: 'Product created', product });
    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product (vendor only)
router.put('/:id', authenticate, isVendor, (req, res) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.vendor_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this product' });
        }

        const { name, description, price, mrp, stock, unit, image, is_active } = req.body;

        const updates = [];
        const values = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (price) { updates.push('price = ?'); values.push(price); }
        if (mrp) { updates.push('mrp = ?'); values.push(mrp); }
        if (stock !== undefined) { updates.push('stock = ?'); values.push(stock); }
        if (unit) { updates.push('unit = ?'); values.push(unit); }
        if (image !== undefined) { updates.push('image = ?'); values.push(image); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.params.id);
        db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
        res.json({ message: 'Product updated', product: updated });
    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

module.exports = router;
