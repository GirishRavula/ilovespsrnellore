const db = require('./database');
const bcrypt = require('bcryptjs');
const config = require('../config');

console.log('🌱 Seeding database...\n');

// Clear existing data
db.exec(`
    DELETE FROM cart;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM reviews;
    DELETE FROM services;
    DELETE FROM products;
    DELETE FROM businesses;
    DELETE FROM users;
    DELETE FROM service_categories;
    DELETE FROM product_categories;
`);

// Seed admin user
const adminPassword = bcrypt.hashSync('admin123', config.BCRYPT_ROUNDS);
db.prepare(`
    INSERT INTO users (name, email, phone, password, role) 
    VALUES (?, ?, ?, ?, ?)
`).run('Admin', 'admin@ilovespsrnellore.com', '9876543210', adminPassword, 'admin');

// Seed demo vendor
const vendorPassword = bcrypt.hashSync('vendor123', config.BCRYPT_ROUNDS);
const vendorResult = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, address, city) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
`).run('Ravi Kumar', 'ravi@nelloreservices.com', '9876543211', vendorPassword, 'vendor', 'Stonehousepet', 'Nellore');

// Seed demo customer
const customerPassword = bcrypt.hashSync('customer123', config.BCRYPT_ROUNDS);
db.prepare(`
    INSERT INTO users (name, email, phone, password, role, address, city) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
`).run('Priya Sharma', 'priya@gmail.com', '9876543212', customerPassword, 'customer', 'Magunta Layout', 'Nellore');

// Seed vendor business profile
db.prepare(`
    INSERT INTO businesses (user_id, business_name, business_type, description, address, area, pincode, phone, whatsapp, is_verified, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
    vendorResult.lastInsertRowid,
    'Nellore Home Services',
    'both',
    'Your trusted partner for home services and local products in Nellore',
    '123, Main Road',
    'Stonehousepet',
    '524002',
    '9876543211',
    '9876543211',
    1,
    4.8
);

// Seed service categories
const serviceCategories = [
    { name: 'Home Services', slug: 'home-services', icon: 'fa-solid fa-plug-circle-bolt', description: 'Electrician, plumber, AC repair, carpentry' },
    { name: 'Personal Care', slug: 'personal-care', icon: 'fa-solid fa-spa', description: 'Salon at home, wellness, grooming' },
    { name: 'Business Support', slug: 'business-support', icon: 'fa-solid fa-briefcase', description: 'Digital marketing, accounting, legal' },
    { name: 'Safety & Security', slug: 'safety-security', icon: 'fa-solid fa-house-lock', description: 'CCTV, smart locks, fire safety' },
    { name: 'Cleaning', slug: 'cleaning', icon: 'fa-solid fa-broom', description: 'Home cleaning, deep cleaning, sanitization' },
    { name: 'Pest Control', slug: 'pest-control', icon: 'fa-solid fa-bug-slash', description: 'Termite, cockroach, mosquito control' }
];

const insertServiceCategory = db.prepare(`
    INSERT INTO service_categories (name, slug, icon, description) VALUES (?, ?, ?, ?)
`);

serviceCategories.forEach(cat => {
    insertServiceCategory.run(cat.name, cat.slug, cat.icon, cat.description);
});

// Seed services
const services = [
    { category: 1, name: 'Electrician', slug: 'electrician', description: 'Wiring, switches, fan installation, repairs', price: 199, duration: 60 },
    { category: 1, name: 'Plumber', slug: 'plumber', description: 'Pipe repair, tap installation, drainage', price: 149, duration: 45 },
    { category: 1, name: 'AC Service', slug: 'ac-service', description: 'AC repair, gas refill, installation', price: 499, duration: 90 },
    { category: 1, name: 'Carpenter', slug: 'carpenter', description: 'Furniture repair, assembly, custom work', price: 299, duration: 120 },
    { category: 1, name: 'Appliance Repair', slug: 'appliance-repair', description: 'Washing machine, refrigerator, TV repair', price: 349, duration: 60 },
    { category: 2, name: 'Salon at Home - Women', slug: 'salon-women', description: 'Haircut, facial, waxing, threading', price: 599, duration: 90 },
    { category: 2, name: 'Salon at Home - Men', slug: 'salon-men', description: 'Haircut, shave, facial, grooming', price: 299, duration: 45 },
    { category: 2, name: 'Massage Therapy', slug: 'massage', description: 'Relaxing massage, pain relief therapy', price: 799, duration: 60 },
    { category: 3, name: 'Digital Marketing', slug: 'digital-marketing', description: 'Social media, SEO, ads management', price: 4999, duration: null },
    { category: 3, name: 'Accounting Services', slug: 'accounting', description: 'GST filing, bookkeeping, tax planning', price: 1999, duration: null },
    { category: 4, name: 'CCTV Installation', slug: 'cctv', description: '2/4/8 camera setup with monitoring', price: 2999, duration: 180 },
    { category: 4, name: 'Smart Lock Installation', slug: 'smart-lock', description: 'Digital door locks with app control', price: 1499, duration: 60 },
    { category: 5, name: 'Home Deep Cleaning', slug: 'deep-cleaning', description: '2BHK/3BHK complete cleaning', price: 1499, duration: 240 },
    { category: 5, name: 'Bathroom Cleaning', slug: 'bathroom-cleaning', description: 'Scrubbing, sanitization, shine', price: 399, duration: 60 },
    { category: 6, name: 'General Pest Control', slug: 'general-pest', description: 'Cockroach, ant, spider control', price: 799, duration: 60 },
    { category: 6, name: 'Termite Treatment', slug: 'termite', description: 'Complete termite protection', price: 2499, duration: 180 }
];

const insertService = db.prepare(`
    INSERT INTO services (category_id, vendor_id, name, slug, description, price, duration_mins, rating, review_count) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

services.forEach(svc => {
    insertService.run(svc.category, 2, svc.name, svc.slug, svc.description, svc.price, svc.duration, (Math.random() * 1 + 4).toFixed(1), Math.floor(Math.random() * 200 + 20));
});

// Seed product categories
const productCategories = [
    { name: 'Groceries', slug: 'groceries', icon: 'fa-solid fa-basket-shopping', description: 'Rice, pulses, oils, daily essentials' },
    { name: 'Fashion', slug: 'fashion', icon: 'fa-solid fa-shirt', description: 'Clothing, accessories, footwear' },
    { name: 'Electronics', slug: 'electronics', icon: 'fa-solid fa-mobile-screen', description: 'Mobiles, laptops, accessories' },
    { name: 'Organic', slug: 'organic', icon: 'fa-solid fa-seedling', description: 'Organic food, natural products' },
    { name: 'Gifts', slug: 'gifts', icon: 'fa-solid fa-gift', description: 'Gift items, sweets, hampers' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: 'fa-solid fa-kitchen-set', description: 'Utensils, appliances, decor' }
];

const insertProductCategory = db.prepare(`
    INSERT INTO product_categories (name, slug, icon, description) VALUES (?, ?, ?, ?)
`);

productCategories.forEach(cat => {
    insertProductCategory.run(cat.name, cat.slug, cat.icon, cat.description);
});

// Seed products
const products = [
    { category: 1, name: 'Nellore Masuri Rice', slug: 'nellore-masuri-rice', description: 'Premium quality Masuri rice, direct from Nellore farms. Known for its aroma and taste.', price: 399, mrp: 450, stock: 100, unit: '5kg', featured: 1 },
    { category: 1, name: 'Sona Masoori Rice', slug: 'sona-masoori-rice', description: 'Light weight, aromatic rice perfect for daily cooking', price: 349, mrp: 399, stock: 150, unit: '5kg', featured: 0 },
    { category: 1, name: 'Coastal Spice Pack', slug: 'coastal-spice-pack', description: 'Authentic Nellore spice blend for fish curry, biryani, and more', price: 249, mrp: 299, stock: 200, unit: 'pack', featured: 1 },
    { category: 1, name: 'Cold Pressed Coconut Oil', slug: 'coconut-oil', description: 'Pure cold pressed coconut oil from coastal Nellore', price: 299, mrp: 350, stock: 80, unit: '1L', featured: 0 },
    { category: 1, name: 'Nellore Pickles Combo', slug: 'pickles-combo', description: 'Mango, lemon, and mixed vegetable pickles', price: 399, mrp: 499, stock: 60, unit: '3 jars', featured: 1 },
    { category: 2, name: 'Handloom Cotton Saree', slug: 'handloom-saree', description: 'Traditional handloom saree with modern designs, soft cotton', price: 1499, mrp: 1999, stock: 30, unit: 'piece', featured: 1 },
    { category: 2, name: 'Cotton Kurta Set - Men', slug: 'kurta-set-men', description: 'Comfortable cotton kurta with pajama, perfect for summer', price: 899, mrp: 1199, stock: 50, unit: 'set', featured: 0 },
    { category: 2, name: 'Kids Ethnic Wear', slug: 'kids-ethnic', description: 'Traditional dress for kids, festivals & occasions', price: 599, mrp: 799, stock: 40, unit: 'piece', featured: 0 },
    { category: 3, name: 'Wireless Earbuds', slug: 'wireless-earbuds', description: 'Bluetooth 5.0, noise cancellation, 24hr battery', price: 1299, mrp: 1999, stock: 25, unit: 'piece', featured: 1 },
    { category: 3, name: 'Phone Case - Premium', slug: 'phone-case', description: 'Shockproof case with card holder, multiple colors', price: 299, mrp: 499, stock: 100, unit: 'piece', featured: 0 },
    { category: 4, name: 'Organic Honey', slug: 'organic-honey', description: 'Pure forest honey from Eastern Ghats, no additives', price: 449, mrp: 549, stock: 45, unit: '500g', featured: 1 },
    { category: 4, name: 'Organic Jaggery', slug: 'organic-jaggery', description: 'Chemical-free jaggery, traditional process', price: 199, mrp: 249, stock: 70, unit: '1kg', featured: 0 },
    { category: 5, name: 'Nellore Sweet Box', slug: 'sweet-box', description: 'Assorted traditional sweets from famous Nellore shops', price: 599, mrp: 699, stock: 30, unit: 'box', featured: 1 },
    { category: 5, name: 'Gift Hamper - Premium', slug: 'gift-hamper', description: 'Dry fruits, sweets, and local specialties', price: 1299, mrp: 1599, stock: 20, unit: 'hamper', featured: 1 },
    { category: 6, name: 'Steel Lunch Box Set', slug: 'lunch-box', description: 'Stainless steel 3-tier lunch box, leak proof', price: 549, mrp: 699, stock: 40, unit: 'set', featured: 0 },
    { category: 6, name: 'Copper Water Bottle', slug: 'copper-bottle', description: 'Pure copper bottle, health benefits, 1L capacity', price: 699, mrp: 899, stock: 35, unit: 'piece', featured: 0 }
];

const insertProduct = db.prepare(`
    INSERT INTO products (category_id, vendor_id, name, slug, description, price, mrp, stock, unit, is_featured, rating, review_count) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

products.forEach(prod => {
    insertProduct.run(prod.category, 2, prod.name, prod.slug, prod.description, prod.price, prod.mrp, prod.stock, prod.unit, prod.featured, (Math.random() * 1 + 4).toFixed(1), Math.floor(Math.random() * 150 + 10));
});

console.log('✅ Database seeded successfully!\n');
console.log('📊 Summary:');
console.log(`   - Users: 3 (admin, vendor, customer)`);
console.log(`   - Service Categories: ${serviceCategories.length}`);
console.log(`   - Services: ${services.length}`);
console.log(`   - Product Categories: ${productCategories.length}`);
console.log(`   - Products: ${products.length}`);
console.log('\n🔐 Demo credentials:');
console.log('   Admin: admin@ilovespsrnellore.com / admin123');
console.log('   Vendor: ravi@nelloreservices.com / vendor123');
console.log('   Customer: priya@gmail.com / customer123\n');
