const express = require('express');
const db = require('../db/database');
const { authenticate, isVendor } = require('../middleware/auth');

const router = express.Router();

// Generate order number
const generateOrderNumber = () => {
    const prefix = 'NLR';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
};

// Get cart
router.get('/cart', authenticate, (req, res) => {
    try {
        const cartItems = db.prepare(`
            SELECT c.*, 
                CASE 
                    WHEN c.item_type = 'product' THEN p.name
                    WHEN c.item_type = 'service' THEN s.name
                END as item_name,
                CASE 
                    WHEN c.item_type = 'product' THEN p.price
                    WHEN c.item_type = 'service' THEN s.price
                END as item_price,
                CASE 
                    WHEN c.item_type = 'product' THEN p.image
                    ELSE NULL
                END as item_image,
                CASE 
                    WHEN c.item_type = 'product' THEN p.stock
                    ELSE 999
                END as item_stock
            FROM cart c
            LEFT JOIN products p ON c.item_type = 'product' AND c.item_id = p.id
            LEFT JOIN services s ON c.item_type = 'service' AND c.item_id = s.id
            WHERE c.user_id = ?
        `).all(req.user.id);

        const total = cartItems.reduce((sum, item) => sum + (item.item_price * item.quantity), 0);

        res.json({ items: cartItems, total, count: cartItems.length });
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Add to cart
router.post('/cart', authenticate, (req, res) => {
    try {
        const { item_type, item_id, quantity = 1 } = req.body;

        if (!item_type || !item_id) {
            return res.status(400).json({ error: 'Item type and ID are required' });
        }

        if (!['product', 'service'].includes(item_type)) {
            return res.status(400).json({ error: 'Invalid item type' });
        }

        // Check if item exists
        if (item_type === 'product') {
            const product = db.prepare('SELECT id, stock FROM products WHERE id = ? AND is_active = 1').get(item_id);
            if (!product) return res.status(404).json({ error: 'Product not found' });
            if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });
        } else {
            const service = db.prepare('SELECT id FROM services WHERE id = ? AND is_active = 1').get(item_id);
            if (!service) return res.status(404).json({ error: 'Service not found' });
        }

        // Upsert cart item
        db.prepare(`
            INSERT INTO cart (user_id, item_type, item_id, quantity)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, item_type, item_id) 
            DO UPDATE SET quantity = quantity + ?
        `).run(req.user.id, item_type, item_id, quantity, quantity);

        res.json({ message: 'Item added to cart' });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Update cart item quantity
router.put('/cart/:id', authenticate, (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Valid quantity required' });
        }

        const cartItem = db.prepare('SELECT * FROM cart WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Check stock for products
        if (cartItem.item_type === 'product') {
            const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(cartItem.item_id);
            if (product.stock < quantity) {
                return res.status(400).json({ error: 'Insufficient stock' });
            }
        }

        db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(quantity, req.params.id);

        res.json({ message: 'Cart updated' });
    } catch (err) {
        console.error('Update cart error:', err);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Remove from cart
router.delete('/cart/:id', authenticate, (req, res) => {
    try {
        const result = db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
});

// Clear cart
router.delete('/cart', authenticate, (req, res) => {
    try {
        db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        console.error('Clear cart error:', err);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

// Create order
router.post('/', authenticate, (req, res) => {
    try {
        const { 
            order_type, 
            items, 
            delivery_address, 
            delivery_area, 
            delivery_pincode,
            scheduled_date,
            scheduled_time,
            payment_method = 'cod',
            notes 
        } = req.body;

        if (!order_type || !items || items.length === 0) {
            return res.status(400).json({ error: 'Order type and items are required' });
        }

        if (!delivery_address) {
            return res.status(400).json({ error: 'Delivery address is required' });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = [];
        let vendorId = null;

        for (const item of items) {
            let itemData;
            if (item.item_type === 'product') {
                itemData = db.prepare('SELECT id, name, price, stock, vendor_id FROM products WHERE id = ? AND is_active = 1').get(item.item_id);
                if (!itemData) return res.status(404).json({ error: `Product ${item.item_id} not found` });
                if (itemData.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${itemData.name}` });
            } else {
                itemData = db.prepare('SELECT id, name, price, vendor_id FROM services WHERE id = ? AND is_active = 1').get(item.item_id);
                if (!itemData) return res.status(404).json({ error: `Service ${item.item_id} not found` });
            }

            if (!vendorId) vendorId = itemData.vendor_id;

            const itemTotal = itemData.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                item_type: item.item_type,
                item_id: item.item_id,
                item_name: itemData.name,
                quantity: item.quantity,
                price: itemData.price,
                total: itemTotal
            });
        }

        const deliveryFee = order_type === 'product' && subtotal < 500 ? 39 : 0;
        const total = subtotal + deliveryFee;
        const orderNumber = generateOrderNumber();

        // Create order
        const orderResult = db.prepare(`
            INSERT INTO orders (order_number, user_id, vendor_id, order_type, subtotal, delivery_fee, total, 
                payment_method, delivery_address, delivery_area, delivery_city, delivery_pincode,
                scheduled_date, scheduled_time, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            orderNumber, req.user.id, vendorId, order_type, subtotal, deliveryFee, total,
            payment_method, delivery_address, delivery_area, 'Nellore', delivery_pincode,
            scheduled_date, scheduled_time, notes
        );

        const orderId = orderResult.lastInsertRowid;

        // Insert order items
        const insertItem = db.prepare(`
            INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, price, total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of orderItems) {
            insertItem.run(orderId, item.item_type, item.item_id, item.item_name, item.quantity, item.price, item.total);

            // Reduce stock for products
            if (item.item_type === 'product') {
                db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.item_id);
            }
        }

        // Clear cart
        db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

        res.status(201).json({ 
            message: 'Order placed successfully', 
            order,
            order_number: orderNumber
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get user orders
router.get('/', authenticate, (req, res) => {
    try {
        const { status, limit = 20, offset = 0 } = req.query;

        let query = 'SELECT * FROM orders WHERE user_id = ?';
        const params = [req.user.id];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const orders = db.prepare(query).all(...params);

        // Get items for each order
        const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
        orders.forEach(order => {
            order.items = getItems.all(order.id);
        });

        res.json({ orders });
    } catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order
router.get('/:id', authenticate, (req, res) => {
    try {
        const order = db.prepare(`
            SELECT o.*, b.business_name as vendor_name, b.phone as vendor_phone
            FROM orders o
            LEFT JOIN businesses b ON o.vendor_id = b.user_id
            WHERE o.id = ? AND (o.user_id = ? OR o.vendor_id = ?)
        `).get(req.params.id, req.user.id, req.user.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
        order.items = items;

        res.json({ order });
    } catch (err) {
        console.error('Get order error:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Update order status (vendor only)
router.put('/:id/status', authenticate, isVendor, (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.vendor_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this order' });
        }

        db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(status, req.params.id);

        // If cancelled, restore stock
        if (status === 'cancelled') {
            const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? AND item_type = ?').all(req.params.id, 'product');
            for (const item of items) {
                db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.item_id);
            }
        }

        res.json({ message: 'Order status updated' });
    } catch (err) {
        console.error('Update order status error:', err);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Get vendor orders
router.get('/vendor/all', authenticate, isVendor, (req, res) => {
    try {
        const { status, limit = 20, offset = 0 } = req.query;

        let query = `
            SELECT o.*, u.name as customer_name, u.phone as customer_phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.vendor_id = ?
        `;
        const params = [req.user.id];

        if (status) {
            query += ' AND o.status = ?';
            params.push(status);
        }

        query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const orders = db.prepare(query).all(...params);

        const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
        orders.forEach(order => {
            order.items = getItems.all(order.id);
        });

        res.json({ orders });
    } catch (err) {
        console.error('Get vendor orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

module.exports = router;
