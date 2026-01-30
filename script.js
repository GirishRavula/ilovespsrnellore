document.addEventListener('DOMContentLoaded', () => {
    // Mobile nav toggle
    const toggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // Animate stats on scroll
    const stats = document.querySelectorAll('.stat');
    const animateStat = (el) => {
        const target = parseFloat(el.dataset.count);
        const isDecimal = target % 1 !== 0;
        let current = 0;
        const step = Math.ceil(target / 60);
        const tick = () => {
            current += step;
            if (current >= target) {
                el.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString();
            } else {
                el.textContent = isDecimal ? current.toFixed(1) : current.toLocaleString();
                requestAnimationFrame(tick);
            }
        };
        tick();
    };
    const observer = new IntersectionObserver((entries, ob) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateStat(entry.target);
                ob.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    stats.forEach((stat) => observer.observe(stat));

    // Deep Research Feature - Tab Switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.research-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });

    // Deep Research - Services
    const researchServicesBtn = document.getElementById('research-services-btn');
    if (researchServicesBtn) {
        researchServicesBtn.addEventListener('click', async () => {
            const query = document.getElementById('service-query').value;
            const budget = document.getElementById('service-budget').value;
            const location = document.getElementById('service-location').value;

            if (!query) {
                alert('Please enter a search query');
                return;
            }

            const resultsDiv = document.getElementById('services-results');
            resultsDiv.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Researching services...</span></div>';

            try {
                const response = await fetch('/api/research/services', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, budget, location })
                });

                const data = await response.json();
                displayServicesResults(data, resultsDiv);
            } catch (error) {
                resultsDiv.innerHTML = '<div class="error-message">Failed to perform research. Please try again.</div>';
            }
        });
    }

    // Deep Research - Products
    const researchProductsBtn = document.getElementById('research-products-btn');
    if (researchProductsBtn) {
        researchProductsBtn.addEventListener('click', async () => {
            const query = document.getElementById('product-query').value;
            const minPrice = document.getElementById('product-min-price').value;
            const maxPrice = document.getElementById('product-max-price').value;
            const minRating = document.getElementById('product-min-rating').value;

            if (!query) {
                alert('Please enter a search query');
                return;
            }

            const resultsDiv = document.getElementById('products-results');
            resultsDiv.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Researching products...</span></div>';

            try {
                const response = await fetch('/api/research/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        query, 
                        min_price: minPrice, 
                        max_price: maxPrice, 
                        min_rating: minRating 
                    })
                });

                const data = await response.json();
                displayProductsResults(data, resultsDiv);
            } catch (error) {
                resultsDiv.innerHTML = '<div class="error-message">Failed to perform research. Please try again.</div>';
            }
        });
    }

    // Compare Feature
    const compareBtn = document.getElementById('compare-btn');
    if (compareBtn) {
        compareBtn.addEventListener('click', async () => {
            const type = document.getElementById('compare-type').value;
            const idsInput = document.getElementById('compare-ids').value;
            const ids = idsInput.split(',').map(id => id.trim()).filter(id => id);

            if (ids.length < 2) {
                alert('Please enter at least 2 IDs to compare');
                return;
            }

            if (ids.length > 5) {
                alert('Maximum 5 items can be compared at once');
                return;
            }

            const resultsDiv = document.getElementById('compare-results');
            resultsDiv.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Comparing...</span></div>';

            try {
                const endpoint = type === 'services' ? '/api/research/compare/services' : '/api/research/compare/products';
                const bodyKey = type === 'services' ? 'service_ids' : 'product_ids';
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [bodyKey]: ids })
                });

                const data = await response.json();
                displayComparisonResults(data, type, resultsDiv);
            } catch (error) {
                resultsDiv.innerHTML = '<div class="error-message">Failed to compare. Please check the IDs and try again.</div>';
            }
        });
    }

    // Helper function to display services results
    function displayServicesResults(data, container) {
        if (!data.services || data.services.length === 0) {
            container.innerHTML = '<div class="error-message">No services found matching your criteria.</div>';
            return;
        }

        let html = '<div class="results-header">';
        html += `<h3><i class="fa-solid fa-chart-line"></i> Research Results for "${data.query}"</h3>`;
        html += '<div class="insights-grid">';
        html += `<div class="insight-card"><div class="label">Total Found</div><div class="value">${data.insights.total_found}</div></div>`;
        html += `<div class="insight-card"><div class="label">Avg Price</div><div class="value">₹${data.insights.avg_price.toFixed(0)}</div></div>`;
        html += `<div class="insight-card"><div class="label">Avg Rating</div><div class="value">${data.insights.avg_rating.toFixed(1)}★</div></div>`;
        html += `<div class="insight-card"><div class="label">Verified Vendors</div><div class="value">${data.insights.verified_vendors}</div></div>`;
        html += '</div></div>';

        if (data.insights.recommendations && data.insights.recommendations.length > 0) {
            html += '<div class="recommendations-section"><h4>AI-Powered Recommendations</h4>';
            data.insights.recommendations.forEach(rec => {
                if (rec.services && rec.services.length > 0) {
                    html += `<div class="recommendation-group"><h5><i class="fa-solid fa-star"></i> ${rec.title}</h5>`;
                    html += '<div class="items-grid">';
                    rec.services.forEach(service => {
                        html += `<div class="result-item">`;
                        html += `<h4>${service.name}</h4>`;
                        html += `<div class="category">${service.category_name}</div>`;
                        html += `<div class="price">₹${service.price}</div>`;
                        html += `<div class="rating">★ ${service.rating} (${service.review_count} reviews)</div>`;
                        html += `<div class="vendor">${service.vendor_name} ${service.vendor_verified ? '<span class="verified-badge">✓ Verified</span>' : ''}</div>`;
                        html += `</div>`;
                    });
                    html += '</div></div>';
                }
            });
            html += '</div>';
        }

        container.innerHTML = html;
    }

    // Helper function to display products results
    function displayProductsResults(data, container) {
        if (!data.products || data.products.length === 0) {
            container.innerHTML = '<div class="error-message">No products found matching your criteria.</div>';
            return;
        }

        let html = '<div class="results-header">';
        html += `<h3><i class="fa-solid fa-chart-line"></i> Research Results for "${data.query}"</h3>`;
        html += '<div class="insights-grid">';
        html += `<div class="insight-card"><div class="label">Total Found</div><div class="value">${data.insights.total_found}</div></div>`;
        html += `<div class="insight-card"><div class="label">Price Range</div><div class="value">₹${data.insights.price_range.min}-${data.insights.price_range.max}</div></div>`;
        html += `<div class="insight-card"><div class="label">Avg Rating</div><div class="value">${data.insights.avg_rating.toFixed(1)}★</div></div>`;
        html += `<div class="insight-card"><div class="label">Avg Discount</div><div class="value">${data.insights.avg_discount.toFixed(1)}%</div></div>`;
        html += '</div></div>';

        if (data.insights.recommendations && data.insights.recommendations.length > 0) {
            html += '<div class="recommendations-section"><h4>AI-Powered Recommendations</h4>';
            data.insights.recommendations.forEach(rec => {
                if (rec.products && rec.products.length > 0) {
                    html += `<div class="recommendation-group"><h5><i class="fa-solid fa-star"></i> ${rec.title}</h5>`;
                    html += '<div class="items-grid">';
                    rec.products.forEach(product => {
                        html += `<div class="result-item">`;
                        html += `<h4>${product.name}</h4>`;
                        html += `<div class="category">${product.category_name}</div>`;
                        html += `<div class="price">₹${product.price} ${product.discount_percent > 0 ? `<small style="text-decoration:line-through;color:var(--muted)">₹${product.mrp}</small>` : ''}</div>`;
                        html += `<div class="rating">★ ${product.rating} (${product.review_count} reviews)</div>`;
                        html += `<div class="vendor">${product.vendor_name} ${product.vendor_verified ? '<span class="verified-badge">✓ Verified</span>' : ''}</div>`;
                        html += `</div>`;
                    });
                    html += '</div></div>';
                }
            });
            html += '</div>';
        }

        container.innerHTML = html;
    }

    // Helper function to display comparison results
    function displayComparisonResults(data, type, container) {
        const items = type === 'services' ? data.services : data.products;
        
        if (!items || items.length < 2) {
            container.innerHTML = '<div class="error-message">Not enough items found for comparison.</div>';
            return;
        }

        let html = '<div class="results-header">';
        html += `<h3><i class="fa-solid fa-balance-scale"></i> Comparison Results</h3>`;
        html += '<div class="insights-grid">';
        html += `<div class="insight-card"><div class="label">Compared Items</div><div class="value">${items.length}</div></div>`;
        html += `<div class="insight-card"><div class="label">Price Range</div><div class="value">₹${data.insights.price_comparison.lowest}-${data.insights.price_comparison.highest}</div></div>`;
        html += `<div class="insight-card"><div class="label">Best Rating</div><div class="value">${data.insights.rating_comparison.best}★</div></div>`;
        html += `<div class="insight-card"><div class="label">Total Reviews</div><div class="value">${data.insights.total_reviews}</div></div>`;
        html += '</div></div>';

        if (data.recommendation) {
            html += '<div class="recommendation-banner">';
            html += '<h4><i class="fa-solid fa-trophy"></i> AI Recommendation</h4>';
            html += `<p><strong>${data.recommendation.service_name || data.recommendation.product_name}</strong> - ${data.recommendation.reason}</p>`;
            html += '</div>';
        }

        html += '<div class="comparison-table"><table>';
        html += '<tr><th>Name</th><th>Price</th><th>Rating</th><th>Reviews</th><th>Vendor</th></tr>';
        items.forEach(item => {
            const isBest = data.recommendation && (item.id === data.recommendation.service_id || item.id === data.recommendation.product_id);
            html += `<tr ${isBest ? 'class="best-choice"' : ''}>`;
            html += `<td><strong>${item.name}</strong>${isBest ? ' <span style="color:var(--accent)">★ Best Choice</span>' : ''}</td>`;
            html += `<td>₹${item.price}</td>`;
            html += `<td>${item.rating}★</td>`;
            html += `<td>${item.review_count}</td>`;
            html += `<td>${item.vendor_name}${item.vendor_verified ? ' ✓' : ''}</td>`;
            html += '</tr>';
        });
        html += '</table></div>';

        container.innerHTML = html;
    }

    console.log('🌟 iLoveSPSR Nellore loaded with Deep Research AI');
});
