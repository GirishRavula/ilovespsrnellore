# 🔬 Deep Research Feature Guide

## Overview

The Deep Research feature provides AI-powered intelligent search and analysis capabilities for services and products on the iLoveSPSR Nellore platform. This cloud-native feature helps users make informed decisions with data-driven insights.

## Features

### 1. Smart Service Discovery
Find the perfect service provider with AI-powered insights:
- **Intelligent Search**: Searches across service names, descriptions, and categories
- **Budget Filtering**: Find services within your budget
- **Location Preferences**: Filter by area/locality
- **AI Insights**: 
  - Total services found
  - Average price across results
  - Average rating
  - Number of verified vendors
- **Smart Recommendations**:
  - Top Rated (4.5★ and above)
  - Best Value for Money (best rating/price ratio)
  - Most Reviewed (highest trust score)

### 2. Smart Product Discovery
Discover the best products with advanced filtering:
- **Advanced Search**: Searches across product names, descriptions, and categories
- **Price Range Filtering**: Set minimum and maximum price limits
- **Rating Filtering**: Filter by minimum rating (3.5★, 4.0★, 4.5★)
- **AI Insights**:
  - Total products found
  - Price range (min, max, average)
  - Average rating
  - Average discount percentage
  - Number of verified sellers
- **Smart Recommendations**:
  - Highest Rated Products
  - Best Deals & Discounts
  - Most Popular (trending items)

### 3. Side-by-Side Comparison
Compare multiple services or products:
- **Compare 2-5 items** at once
- **AI-Powered Best Choice Recommendation**
- **Comparative Insights**:
  - Price comparison (lowest, highest, average)
  - Rating comparison
  - Total reviews across items
  - Verified vendor count
- **Visual Comparison Table** with highlighted best choice

### 4. Personalized Recommendations
Get recommendations based on your purchase history:
- **Trending Services** - Most popular services by rating and reviews
- **Trending Products** - Bestselling products
- **User Insights** - Your order history analysis
- **Preferred Categories** - Based on your past purchases

### 5. Advanced Analytics
Deep dive into any service or product:
- **Performance Metrics**:
  - Rating distribution (1-5 stars)
  - Total reviews count
  - Vendor verification status
- **Competitive Analysis**:
  - Price position vs competitors
  - Rating position in category
  - Related items comparison
- **Sentiment Summary**:
  - Positive reviews count (4★+)
  - Neutral reviews count (3★)
  - Negative reviews count (≤2★)

## API Endpoints

### Service Research
```bash
POST /api/research/services
Content-Type: application/json

{
  "query": "electrician",
  "budget": 1000,
  "location": "Magunta Layout"
}
```

**Response:**
```json
{
  "query": "electrician",
  "services": [...],
  "insights": {
    "total_found": 5,
    "avg_price": 250,
    "avg_rating": 4.5,
    "verified_vendors": 4,
    "recommendations": [
      {
        "type": "top_rated",
        "title": "Highest Rated",
        "services": [...]
      }
    ]
  }
}
```

### Product Research
```bash
POST /api/research/products
Content-Type: application/json

{
  "query": "rice",
  "min_price": 100,
  "max_price": 500,
  "min_rating": 4.0
}
```

### Compare Services
```bash
POST /api/research/compare/services
Content-Type: application/json

{
  "service_ids": [1, 2, 3]
}
```

### Compare Products
```bash
POST /api/research/compare/products
Content-Type: application/json

{
  "product_ids": [1, 2, 3, 4]
}
```

### Get Recommendations (Requires Authentication)
```bash
GET /api/research/recommendations?type=all
Authorization: Bearer <your-token>
```

### Get Analytics
```bash
GET /api/research/analytics/service/1
GET /api/research/analytics/product/1
```

## How to Use (UI)

### 1. Navigate to Deep Research
Click "AI Research" in the main navigation menu, or scroll to the Deep Research section.

### 2. Choose Your Research Type
Select one of three tabs:
- **Services** - Research local services
- **Products** - Research products
- **Compare** - Compare multiple items

### 3. Enter Search Criteria
- Type your search query
- Set optional filters (budget, price range, rating)
- Click "Start Deep Research"

### 4. Review AI Insights
The system displays:
- Summary statistics (total found, averages, etc.)
- AI-powered recommendations in categories
- Detailed results with ratings and reviews

### 5. Make Informed Decisions
Use the insights to:
- Find the best value for money
- Choose highly-rated options
- Compare options side-by-side
- Book services or add products to cart

## Relevance Scoring Algorithm

The AI uses a sophisticated scoring system:

### Services Score
```
relevance_score = (rating × 0.4) + (vendor_rating × 0.3) + (review_count × 0.01) + (is_verified × 10)
```

### Products Score
```
relevance_score = (rating × 0.4) + (review_count × 0.01) + (is_verified × 10) + (is_featured × 5)
```

### Best Choice Score (Comparison)
```
overall_score = (rating × 0.4) + (is_verified × 20) + (review_count × 0.1) + ((1 / price) × 100)
```

## Cloud-Native Architecture

The Deep Research feature is fully cloud-native:

✅ **Stateless Design** - No session dependencies
✅ **Horizontal Scalability** - Can handle multiple concurrent requests
✅ **Database Optimization** - Efficient SQLite queries with proper indexing
✅ **Docker Compatible** - Works seamlessly in containerized environments
✅ **API-First** - RESTful endpoints for integration
✅ **Platform Agnostic** - Deploy on any cloud platform

## Performance Optimizations

1. **Pagination** - All endpoints support limiting results
2. **Indexed Queries** - Database queries use proper indexes
3. **Result Caching** - Frontend caches search results
4. **Lazy Loading** - Results load progressively
5. **Query Limits** - Reviews and recommendations have built-in limits

## Security Features

✅ **Input Validation** - All inputs validated before processing
✅ **SQL Injection Protection** - Parameterized queries only
✅ **Authentication** - Recommendations require valid JWT token
✅ **Rate Limiting** - API rate limits apply
✅ **XSS Protection** - Frontend sanitizes all outputs
✅ **No Security Vulnerabilities** - CodeQL verified

## Future Enhancements

Potential improvements for future versions:

1. **Machine Learning** - Train models on user behavior
2. **Natural Language Processing** - Better query understanding
3. **Image Search** - Visual product search
4. **Voice Search** - Voice-activated research
5. **Collaborative Filtering** - "Users who searched for X also liked Y"
6. **Price History** - Track price changes over time
7. **Alerts** - Notify users of price drops or new matches
8. **Export Results** - Download research results as PDF/CSV

## Troubleshooting

### No Results Found
- Try broader search terms
- Remove or adjust filters
- Check for typos in search query

### Slow Response
- Reduce number of comparison items
- Use more specific search terms
- Check network connection

### Comparison Errors
- Ensure all IDs are valid numbers
- Compare only 2-5 items at once
- Use correct endpoint (services vs products)

## Support

For issues or questions:
- 📧 Email: hello@ilovespsrnellore.com
- 📖 Documentation: README.md
- 🐛 Report bugs: Create an issue on GitHub

---

**Made with ❤️ for SPSR Nellore, Andhra Pradesh 🇮🇳**
