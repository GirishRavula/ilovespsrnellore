const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Deep Research API - Intelligent search and discovery
 * Provides AI-powered insights for finding the best services and products
 */

// Deep research for services based on user needs
router.post('/services', (req, res) => {
    try {
        const { query, preferences = {}, budget, location } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Build intelligent search query
        let sqlQuery = `
            SELECT s.*, sc.name as category_name, sc.slug as category_slug,
                   b.business_name as vendor_name, b.is_verified as vendor_verified,
                   b.rating as vendor_rating,
                   (s.rating * 0.4 + b.rating * 0.3 + (s.review_count * 0.01) + (b.is_verified * 10)) as relevance_score
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.id
            LEFT JOIN businesses b ON s.vendor_id = b.user_id
            WHERE s.is_active = 1
            AND (s.name LIKE ? OR s.description LIKE ? OR sc.name LIKE ?)
        `;
        const params = [`%${query}%`, `%${query}%`, `%${query}%`];

        // Apply budget filter
        if (budget) {
            sqlQuery += ' AND s.price <= ?';
            params.push(budget);
        }

        // Order by relevance score
        sqlQuery += ' ORDER BY relevance_score DESC LIMIT 10';

        const services = db.prepare(sqlQuery).all(...params);

        // Calculate insights
        const insights = {
            total_found: services.length,
            avg_price: services.reduce((sum, s) => sum + s.price, 0) / services.length || 0,
            avg_rating: services.reduce((sum, s) => sum + s.rating, 0) / services.length || 0,
            verified_vendors: services.filter(s => s.vendor_verified).length,
            recommendations: []
        };

        // Generate personalized recommendations
        if (services.length > 0) {
            const topRated = services.filter(s => s.rating >= 4.5).slice(0, 3);
            const bestValue = services.sort((a, b) => (b.rating / b.price) - (a.rating / a.price)).slice(0, 3);
            const mostReviewed = services.sort((a, b) => b.review_count - a.review_count).slice(0, 3);

            insights.recommendations = [
                { type: 'top_rated', title: 'Highest Rated', services: topRated },
                { type: 'best_value', title: 'Best Value for Money', services: bestValue },
                { type: 'most_trusted', title: 'Most Reviewed', services: mostReviewed }
            ];
        }

        res.json({ 
            query, 
            services, 
            insights,
            search_metadata: {
                timestamp: new Date().toISOString(),
                filters_applied: { budget: budget || 'none', location: location || 'all' }
            }
        });
    } catch (err) {
        console.error('Research services error:', err);
        res.status(500).json({ error: 'Failed to perform research' });
    }
});

// Deep research for products
router.post('/products', (req, res) => {
    try {
        const { query, preferences = {}, min_price, max_price, min_rating } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Build intelligent search query
        let sqlQuery = `
            SELECT p.*, pc.name as category_name, pc.slug as category_slug,
                   b.business_name as vendor_name, b.is_verified as vendor_verified,
                   (p.rating * 0.4 + (p.review_count * 0.01) + (b.is_verified * 10) + p.is_featured * 5) as relevance_score,
                   ROUND(((p.mrp - p.price) / p.mrp * 100), 2) as discount_percent
            FROM products p
            JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN businesses b ON p.vendor_id = b.user_id
            WHERE p.is_active = 1
            AND (p.name LIKE ? OR p.description LIKE ? OR pc.name LIKE ?)
        `;
        const params = [`%${query}%`, `%${query}%`, `%${query}%`];

        // Apply price filters
        if (min_price) {
            sqlQuery += ' AND p.price >= ?';
            params.push(min_price);
        }
        if (max_price) {
            sqlQuery += ' AND p.price <= ?';
            params.push(max_price);
        }

        // Apply rating filter
        if (min_rating) {
            sqlQuery += ' AND p.rating >= ?';
            params.push(min_rating);
        }

        // Order by relevance score
        sqlQuery += ' ORDER BY relevance_score DESC LIMIT 20';

        const products = db.prepare(sqlQuery).all(...params);

        // Handle empty results
        if (products.length === 0) {
            return res.json({ 
                query, 
                products: [], 
                insights: {
                    total_found: 0,
                    price_range: { min: 0, max: 0, avg: 0 },
                    avg_rating: 0,
                    avg_discount: 0,
                    verified_sellers: 0,
                    recommendations: []
                },
                search_metadata: {
                    timestamp: new Date().toISOString(),
                    filters_applied: { 
                        min_price: min_price || 'none', 
                        max_price: max_price || 'none',
                        min_rating: min_rating || 'none'
                    }
                }
            });
        }

        // Calculate insights
        const insights = {
            total_found: products.length,
            price_range: {
                min: Math.min(...products.map(p => p.price)),
                max: Math.max(...products.map(p => p.price)),
                avg: products.reduce((sum, p) => sum + p.price, 0) / products.length
            },
            avg_rating: products.reduce((sum, p) => sum + p.rating, 0) / products.length,
            avg_discount: products.reduce((sum, p) => sum + p.discount_percent, 0) / products.length,
            verified_sellers: products.filter(p => p.vendor_verified).length,
            recommendations: []
        };

        // Generate personalized recommendations
        if (products.length > 0) {
            const topRated = products.filter(p => p.rating >= 4.5).slice(0, 3);
            const bestDeals = products.filter(p => p.discount_percent > 10).sort((a, b) => b.discount_percent - a.discount_percent).slice(0, 3);
            const trending = products.filter(p => p.review_count >= 5).sort((a, b) => b.review_count - a.review_count).slice(0, 3);

            insights.recommendations = [
                { type: 'top_rated', title: 'Highest Rated Products', products: topRated },
                { type: 'best_deals', title: 'Best Deals & Discounts', products: bestDeals },
                { type: 'trending', title: 'Most Popular', products: trending }
            ];
        }

        res.json({ 
            query, 
            products, 
            insights,
            search_metadata: {
                timestamp: new Date().toISOString(),
                filters_applied: { 
                    min_price: min_price || 'none', 
                    max_price: max_price || 'none',
                    min_rating: min_rating || 'none'
                }
            }
        });
    } catch (err) {
        console.error('Research products error:', err);
        res.status(500).json({ error: 'Failed to perform research' });
    }
});

// Compare multiple services
router.post('/compare/services', (req, res) => {
    try {
        const { service_ids } = req.body;

        if (!service_ids || !Array.isArray(service_ids) || service_ids.length < 2) {
            return res.status(400).json({ error: 'At least 2 service IDs required for comparison' });
        }

        if (service_ids.length > 5) {
            return res.status(400).json({ error: 'Maximum 5 services can be compared at once' });
        }

        // Validate all IDs are numbers
        if (!service_ids.every(id => !isNaN(parseInt(id)))) {
            return res.status(400).json({ error: 'All service IDs must be valid numbers' });
        }

        const placeholders = service_ids.map(() => '?').join(',');
        const services = db.prepare(`
            SELECT s.*, sc.name as category_name,
                   b.business_name as vendor_name, b.is_verified as vendor_verified,
                   b.rating as vendor_rating, b.review_count as vendor_reviews
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.id
            LEFT JOIN businesses b ON s.vendor_id = b.user_id
            WHERE s.id IN (${placeholders}) AND s.is_active = 1
        `).all(...service_ids);

        if (services.length < 2) {
            return res.status(404).json({ error: 'Not enough services found for comparison' });
        }

        // Calculate comparison insights
        const comparison = {
            services,
            insights: {
                price_comparison: {
                    lowest: Math.min(...services.map(s => s.price)),
                    highest: Math.max(...services.map(s => s.price)),
                    average: services.reduce((sum, s) => sum + s.price, 0) / services.length
                },
                rating_comparison: {
                    best: Math.max(...services.map(s => s.rating)),
                    lowest: Math.min(...services.map(s => s.rating)),
                    average: services.reduce((sum, s) => sum + s.rating, 0) / services.length
                },
                verified_vendors: services.filter(s => s.vendor_verified).length,
                total_reviews: services.reduce((sum, s) => sum + s.review_count, 0)
            },
            recommendation: null
        };

        // Determine best overall choice
        const scored = services.map(s => ({
            ...s,
            overall_score: (s.rating * 0.4) + (s.vendor_verified * 20) + (s.review_count * 0.1) + ((1 / s.price) * 100)
        }));
        const best = scored.sort((a, b) => b.overall_score - a.overall_score)[0];
        
        comparison.recommendation = {
            service_id: best.id,
            service_name: best.name,
            reason: `Best overall choice based on rating (${best.rating}★), price (₹${best.price}), and ${best.review_count} reviews`
        };

        res.json(comparison);
    } catch (err) {
        console.error('Compare services error:', err);
        res.status(500).json({ error: 'Failed to compare services' });
    }
});

// Compare multiple products
router.post('/compare/products', (req, res) => {
    try {
        const { product_ids } = req.body;

        if (!product_ids || !Array.isArray(product_ids) || product_ids.length < 2) {
            return res.status(400).json({ error: 'At least 2 product IDs required for comparison' });
        }

        if (product_ids.length > 5) {
            return res.status(400).json({ error: 'Maximum 5 products can be compared at once' });
        }

        // Validate all IDs are numbers
        if (!product_ids.every(id => !isNaN(parseInt(id)))) {
            return res.status(400).json({ error: 'All product IDs must be valid numbers' });
        }

        const placeholders = product_ids.map(() => '?').join(',');
        const products = db.prepare(`
            SELECT p.*, pc.name as category_name,
                   b.business_name as vendor_name, b.is_verified as vendor_verified,
                   ROUND(((p.mrp - p.price) / p.mrp * 100), 2) as discount_percent
            FROM products p
            JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN businesses b ON p.vendor_id = b.user_id
            WHERE p.id IN (${placeholders}) AND p.is_active = 1
        `).all(...product_ids);

        if (products.length < 2) {
            return res.status(404).json({ error: 'Not enough products found for comparison' });
        }

        // Calculate comparison insights
        const comparison = {
            products,
            insights: {
                price_comparison: {
                    lowest: Math.min(...products.map(p => p.price)),
                    highest: Math.max(...products.map(p => p.price)),
                    average: products.reduce((sum, p) => sum + p.price, 0) / products.length
                },
                rating_comparison: {
                    best: Math.max(...products.map(p => p.rating)),
                    lowest: Math.min(...products.map(p => p.rating)),
                    average: products.reduce((sum, p) => sum + p.rating, 0) / products.length
                },
                discount_comparison: {
                    best: Math.max(...products.map(p => p.discount_percent)),
                    average: products.reduce((sum, p) => sum + p.discount_percent, 0) / products.length
                },
                verified_sellers: products.filter(p => p.vendor_verified).length,
                total_reviews: products.reduce((sum, p) => sum + p.review_count, 0),
                in_stock: products.filter(p => p.stock > 0).length
            },
            recommendation: null
        };

        // Determine best overall choice
        const scored = products.map(p => ({
            ...p,
            value_score: (p.rating * 0.3) + (p.discount_percent * 0.2) + (p.vendor_verified * 20) + (p.review_count * 0.1)
        }));
        const best = scored.sort((a, b) => b.value_score - a.value_score)[0];
        
        comparison.recommendation = {
            product_id: best.id,
            product_name: best.name,
            reason: `Best value with ${best.rating}★ rating, ${best.discount_percent}% discount, and ${best.review_count} reviews`
        };

        res.json(comparison);
    } catch (err) {
        console.error('Compare products error:', err);
        res.status(500).json({ error: 'Failed to compare products' });
    }
});

// Get AI-powered recommendations based on user history
router.get('/recommendations', authenticate, (req, res) => {
    try {
        const { type = 'all' } = req.query; // 'all', 'services', 'products'

        // Get user's order history (limited to recent purchases)
        const userOrders = db.prepare(`
            SELECT oi.item_type, oi.item_id, COUNT(*) as purchase_count
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY oi.item_type, oi.item_id
            ORDER BY purchase_count DESC
            LIMIT 50
        `).all(req.user.id);

        const recommendations = {
            personalized: [],
            trending: [],
            new_arrivals: []
        };

        // Get trending services
        if (type === 'all' || type === 'services') {
            const trendingServices = db.prepare(`
                SELECT s.*, sc.name as category_name, 
                       b.business_name as vendor_name, b.is_verified as vendor_verified
                FROM services s
                JOIN service_categories sc ON s.category_id = sc.id
                LEFT JOIN businesses b ON s.vendor_id = b.user_id
                WHERE s.is_active = 1
                ORDER BY (s.rating * s.review_count) DESC
                LIMIT 5
            `).all();
            recommendations.trending.push(...trendingServices.map(s => ({ ...s, type: 'service' })));
        }

        // Get trending products
        if (type === 'all' || type === 'products') {
            const trendingProducts = db.prepare(`
                SELECT p.*, pc.name as category_name,
                       b.business_name as vendor_name, b.is_verified as vendor_verified
                FROM products p
                JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN businesses b ON p.vendor_id = b.user_id
                WHERE p.is_active = 1
                ORDER BY (p.rating * p.review_count) DESC
                LIMIT 5
            `).all();
            recommendations.trending.push(...trendingProducts.map(p => ({ ...p, type: 'product' })));
        }

        res.json({
            recommendations,
            user_insights: {
                total_orders: userOrders.length,
                preferred_categories: userOrders.slice(0, 3)
            }
        });
    } catch (err) {
        console.error('Get recommendations error:', err);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

// Advanced analytics for a specific service/product
router.get('/analytics/:type/:id', (req, res) => {
    try {
        const { type, id } = req.params;

        if (!['service', 'product'].includes(type)) {
            return res.status(400).json({ error: 'Type must be either "service" or "product"' });
        }

        let item, reviews, relatedItems;

        if (type === 'service') {
            item = db.prepare(`
                SELECT s.*, sc.name as category_name,
                       b.business_name as vendor_name, b.is_verified as vendor_verified,
                       b.rating as vendor_rating
                FROM services s
                JOIN service_categories sc ON s.category_id = sc.id
                LEFT JOIN businesses b ON s.vendor_id = b.user_id
                WHERE s.id = ? AND s.is_active = 1
            `).get(id);

            if (!item) {
                return res.status(404).json({ error: 'Service not found' });
            }

            reviews = db.prepare(`
                SELECT rating, comment, created_at
                FROM reviews
                WHERE review_type = 'service' AND item_id = ?
                ORDER BY created_at DESC
                LIMIT 100
            `).all(id);

            relatedItems = db.prepare(`
                SELECT id, name, price, rating, review_count
                FROM services
                WHERE category_id = ? AND id != ? AND is_active = 1
                ORDER BY rating DESC
                LIMIT 5
            `).all(item.category_id, id);
        } else {
            item = db.prepare(`
                SELECT p.*, pc.name as category_name,
                       b.business_name as vendor_name, b.is_verified as vendor_verified,
                       ROUND(((p.mrp - p.price) / p.mrp * 100), 2) as discount_percent
                FROM products p
                JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN businesses b ON p.vendor_id = b.user_id
                WHERE p.id = ? AND p.is_active = 1
            `).get(id);

            if (!item) {
                return res.status(404).json({ error: 'Product not found' });
            }

            reviews = db.prepare(`
                SELECT rating, comment, created_at
                FROM reviews
                WHERE review_type = 'product' AND item_id = ?
                ORDER BY created_at DESC
                LIMIT 100
            `).all(id);

            relatedItems = db.prepare(`
                SELECT id, name, price, rating, review_count
                FROM products
                WHERE category_id = ? AND id != ? AND is_active = 1
                ORDER BY rating DESC
                LIMIT 5
            `).all(item.category_id, id);
        }

        // Calculate analytics
        const analytics = {
            item,
            performance: {
                rating_distribution: {
                    5: reviews.filter(r => r.rating === 5).length,
                    4: reviews.filter(r => r.rating === 4).length,
                    3: reviews.filter(r => r.rating === 3).length,
                    2: reviews.filter(r => r.rating === 2).length,
                    1: reviews.filter(r => r.rating === 1).length
                },
                avg_rating: item.rating,
                total_reviews: reviews.length,
                verified_vendor: item.vendor_verified
            },
            competitive_analysis: {
                price_position: null, // Will calculate if we have related items
                rating_position: null,
                related_items: relatedItems
            },
            sentiment_summary: {
                positive: reviews.filter(r => r.rating >= 4).length,
                neutral: reviews.filter(r => r.rating === 3).length,
                negative: reviews.filter(r => r.rating <= 2).length
            }
        };

        // Calculate competitive position
        if (relatedItems.length > 0) {
            const prices = relatedItems.map(i => i.price).concat(item.price);
            const ratings = relatedItems.map(i => i.rating).concat(item.rating);
            
            analytics.competitive_analysis.price_position = 
                prices.filter(p => p < item.price).length + 1; // Position from lowest
            analytics.competitive_analysis.rating_position = 
                ratings.filter(r => r > item.rating).length + 1; // Position from highest
        }

        res.json(analytics);
    } catch (err) {
        console.error('Get analytics error:', err);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

module.exports = router;
