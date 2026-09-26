# 📚 API Reference Guide

Complete API documentation for the Property Finder backend.

## Base URL
```
http://localhost:5000/api
```

---

## 🏠 Properties Endpoints

### List All Properties
Get all properties with optional filtering.

```http
GET /properties
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `bhk` | number | Filter by bedrooms | `?bhk=2` |
| `maxPrice` | number | Maximum price in ₹ | `?maxPrice=500000` |
| `location` | string | Filter by location name | `?location=Downtown` |
| `furnished` | boolean | Furnished status | `?furnished=true` |

**Example Requests:**
```bash
# Get all 2BHK properties
GET /properties?bhk=2

# Get properties under ₹500,000
GET /properties?maxPrice=500000

# Get furnished properties in Downtown
GET /properties?location=Downtown&furnished=true

# Combine multiple filters
GET /properties?bhk=2&maxPrice=500000&location=Downtown
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Modern 2BHK Apartment",
    "location": "Downtown",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "bhk": 2,
    "size": 900,
    "furnished": true,
    "actualPrice": 450000,
    "amenities": ["Pool", "Gym", "Parking", "Security"]
  },
  {
    "id": 2,
    "name": "Cozy 2BHK Flat",
    "location": "Suburbs",
    "latitude": 28.5244,
    "longitude": 77.1855,
    "bhk": 2,
    "size": 750,
    "furnished": false,
    "actualPrice": 280000,
    "amenities": ["Parking", "Security"]
  }
]
```

---

### Get Single Property
Get details of a specific property by ID.

```http
GET /properties/:id
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Property ID |

**Example Request:**
```bash
GET /properties/1
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Modern 2BHK Apartment",
  "location": "Downtown",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "bhk": 2,
  "size": 900,
  "furnished": true,
  "actualPrice": 450000,
  "amenities": ["Pool", "Gym", "Parking", "Security"]
}
```

**Error Response (404):**
```json
{
  "error": "Property not found"
}
```

---

### Create New Property
Add a new property to the database.

```http
POST /properties
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Luxury 3BHK Apartment",
  "location": "Downtown",
  "latitude": 28.6200,
  "longitude": 77.2100,
  "bhk": 3,
  "size": 1200,
  "furnished": true,
  "actualPrice": 650000,
  "amenities": ["Pool", "Gym", "Parking", "Security", "Garden"]
}
```

**Success Response (200):**
```json
{
  "id": 7,
  "name": "Luxury 3BHK Apartment",
  "location": "Downtown",
  "latitude": 28.6200,
  "longitude": 77.2100,
  "bhk": 3,
  "size": 1200,
  "furnished": true,
  "actualPrice": 650000,
  "amenities": ["Pool", "Gym", "Parking", "Security", "Garden"]
}
```

---

## 💰 Price Prediction Endpoints

### Predict Property Price
Get price predictions using both formula and ML models.

```http
POST /predict-price
Content-Type: application/json
```

**Request Body:**
```json
{
  "bhk": 2,
  "size": 900,
  "location": "Downtown",
  "furnished": true
}
```

**Request Fields:**
| Field | Type | Required | Range |
|-------|------|----------|-------|
| `bhk` | number | ✅ Yes | 1-5 |
| `size` | number | ✅ Yes | 600-2000 (sq ft) |
| `location` | string | ✅ Yes | "Downtown", "Suburbs", "Outskirts" |
| `furnished` | boolean | ✅ Yes | true/false |

**Success Response (200):**
```json
{
  "formulaPrice": 450000,
  "mlPrice": 465000,
  "averagePrice": 457500,
  "confidence": "high"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `formulaPrice` | number | Quick estimate using algorithm |
| `mlPrice` | number | ML model prediction (null if not trained) |
| `averagePrice` | number | Average of both predictions |
| `confidence` | string | "medium" or "high" |

**Error Response (400):**
```json
{
  "error": "Missing required fields"
}
```

---

### Price Prediction Examples

**Example 1: Budget 2BHK in Suburbs**
```bash
POST /predict-price
{
  "bhk": 2,
  "size": 650,
  "location": "Suburbs",
  "furnished": false
}
```
Response:
```json
{
  "formulaPrice": 195000,
  "mlPrice": 210000,
  "averagePrice": 202500,
  "confidence": "high"
}
```

**Example 2: Luxury 2BHK Downtown**
```bash
POST /predict-price
{
  "bhk": 2,
  "size": 1500,
  "location": "Downtown",
  "furnished": true
}
```
Response:
```json
{
  "formulaPrice": 675000,
  "mlPrice": 695000,
  "averagePrice": 685000,
  "confidence": "high"
}
```

---

## 🧠 Machine Learning Endpoints

### Train Model
Manually trigger ML model training on all properties.

```http
POST /train-model
```

**Request Body:**
(Empty - uses all existing properties)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Model trained successfully"
}
```

**Error Response (500):**
```json
{
  "error": "Model training failed: [error details]"
}
```

**Notes:**
- Called automatically on server startup
- Retrains every time new properties are added
- Takes ~500ms with 6 properties
- Scales with dataset size

---

## 📍 Location Endpoints

### Get All Available Locations
Get list of all unique locations in the database.

```http
GET /locations
```

**Success Response (200):**
```json
[
  "Downtown",
  "Suburbs",
  "Outskirts"
]
```

**Example Usage in Frontend:**
```javascript
const response = await fetch('http://localhost:5000/api/locations');
const locations = await response.json();
// Use in dropdown: locations.map(loc => <option>{loc}</option>)
```

---

## 📊 Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Property found and returned |
| 400 | Bad Request | Missing required fields |
| 404 | Not Found | Property ID doesn't exist |
| 500 | Server Error | Model training failed |

---

## 🔗 Complete cURL Examples

### Get all 2BHK properties under ₹500k in Downtown
```bash
curl -X GET "http://localhost:5000/api/properties?bhk=2&maxPrice=500000&location=Downtown" \
  -H "Content-Type: application/json"
```

### Get specific property
```bash
curl -X GET "http://localhost:5000/api/properties/1" \
  -H "Content-Type: application/json"
```

### Predict price
```bash
curl -X POST "http://localhost:5000/api/predict-price" \
  -H "Content-Type: application/json" \
  -d '{
    "bhk": 2,
    "size": 900,
    "location": "Downtown",
    "furnished": true
  }'
```

### Add new property
```bash
curl -X POST "http://localhost:5000/api/properties" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Apartment",
    "location": "Downtown",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "bhk": 2,
    "size": 900,
    "furnished": true,
    "actualPrice": 450000,
    "amenities": ["Pool", "Gym"]
  }'
```

### Train model
```bash
curl -X POST "http://localhost:5000/api/train-model" \
  -H "Content-Type: application/json"
```

### Get locations
```bash
curl -X GET "http://localhost:5000/api/locations" \
  -H "Content-Type: application/json"
```

---

## 🧪 Testing with Postman

### Import Collection
1. Open Postman
2. Click "Import"
3. Copy this JSON and paste:

```json
{
  "info": {
    "name": "Property Finder API",
    "version": "1.0"
  },
  "item": [
    {
      "name": "Get All Properties",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:5000/api/properties",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "properties"]
        }
      }
    },
    {
      "name": "Predict Price",
      "request": {
        "method": "POST",
        "url": {
          "raw": "http://localhost:5000/api/predict-price",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "predict-price"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\"bhk\":2,\"size\":900,\"location\":\"Downtown\",\"furnished\":true}"
        }
      }
    },
    {
      "name": "Get Locations",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:5000/api/locations",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "locations"]
        }
      }
    },
    {
      "name": "Train Model",
      "request": {
        "method": "POST",
        "url": {
          "raw": "http://localhost:5000/api/train-model",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "train-model"]
        }
      }
    }
  ]
}
```

---

## 🔄 JavaScript Fetch Examples

### Get properties with filters
```javascript
async function getProperties(filters) {
  const query = new URLSearchParams(filters);
  const res = await fetch(`http://localhost:5000/api/properties?${query}`);
  return res.json();
}

// Usage
getProperties({ bhk: 2, maxPrice: 500000, location: 'Downtown' });
```

### Predict price
```javascript
async function predictPrice(bhk, size, location, furnished) {
  const res = await fetch('http://localhost:5000/api/predict-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bhk, size, location, furnished })
  });
  return res.json();
}

// Usage
predictPrice(2, 900, 'Downtown', true);
```

### Train model
```javascript
async function trainModel() {
  const res = await fetch('http://localhost:5000/api/train-model', {
    method: 'POST'
  });
  return res.json();
}

// Usage
trainModel();
```

---

## ⚠️ Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Connection refused | Server not running | Run `npm run server` |
| CORS error | Wrong origin | Check `CORS_ORIGIN` in server |
| 404 Not Found | Invalid property ID | Check property ID exists |
| 400 Bad Request | Missing fields | Include all required fields |
| Model not trained | Training failed | Check server logs, retry POST /train-model |

---

## 📈 Rate Limiting

Currently, there is **no rate limiting**. For production:
- Add rate limiting middleware
- Use Redis for request tracking
- Implement per-user quotas

---

## 🔐 Security Considerations

For production deployment:
- [ ] Add API authentication (JWT)
- [ ] Validate input parameters
- [ ] Use HTTPS only
- [ ] Add request logging
- [ ] Implement API key management
- [ ] Add CORS headers explicitly

---

## 📝 Changelog

### v1.0.0
- Initial API release
- 5 endpoints
- 6 sample properties
- Formula + ML price prediction

---

**Last Updated**: September 2024
**Maintainer**: Property Finder Team
