# 🏠 Property Finder - AI-Powered Real Estate App

An intelligent property search and discovery platform with **ML-based price prediction** that helps users find their perfect home based on requirements.

## ✨ Features

### 🔍 Smart Property Search
- Filter properties by **BHK (Bedrooms)**, **Price**, **Location**, and **Furnishing Status**
- Real-time search results with instant filtering
- Support for multiple locations with dynamic location loading
- Describe needs in plain English, e.g. “2 BHK furnished apartment under ₹50 lakh in Downtown”
- Listings are ranked with a match percentage and visible reasons based on the details provided

### 🏡 Buy and Sell Properties
- Signed-in users can publish and edit their property listings, including their asking price and property details
- A listing can include up to five JPG, PNG, or WebP photos; buyers can browse them in the property details gallery
- Listings are saved to the local property database and appear in Discover search results for all users; Discover refreshes while open
- Sellers can view their own listings; buyers can email a seller from the property details
- Listing photos must be JPG, PNG, or WebP, with a maximum of five photos and 5 MB total
- Saved homes are stored per signed-in account; account credentials, profile names, and saved homes use MongoDB when configured

### 💰 Dual Price Prediction Models
The app uses **two complementary prediction methods**:

#### 1. **Formula-Based Prediction** (Fast & Interpretable)
```
Price = Size × Base Price per sq ft × Location Multiplier × Furnished Bonus
```
- **Base Price**: ₹200/sq ft
- **Location Multipliers**: Downtown (1.5x), Suburbs (1.0x), Outskirts (0.7x)
- **Furnished Bonus**: 1.2x if furnished, 1.0x if unfurnished

#### 2. **Machine Learning Model** (Accurate & Adaptive)
- **Architecture**: Neural Network with 4 layers
  - Input Layer: 4 features (BHK, Size, Location, Furnished)
  - Hidden Layers: 64 → 32 → 16 neurons with Dropout
  - Output Layer: Single price prediction
- **Training**: 100 epochs with Adam optimizer
- **Accuracy**: Continuously improves as more properties are added
- **Framework**: TensorFlow.js for browser-based ML

### 📊 Price Prediction Features
- **Real-time Prediction**: Instantly predict prices for custom property specifications
- **Confidence Scoring**: Get confidence levels (Medium/High)
- **Dual Output**: Compare formula-based vs ML predictions
- **Average Price**: Get average of both models for balanced estimate
- **Model Training**: Server automatically trains on all properties for accuracy

### 📱 Installable App (PWA)
- Install Property Finder from a supported browser as a standalone app
- App icon and mobile home-screen metadata included
- App shell is cached for faster repeat visits and offline loading

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Framework
- **Vite** - Build tool & dev server
- **CSS3** - Modern styling

### Backend
- **Node.js + Express** - Server framework
- **TensorFlow.js** - Machine learning in Node.js
- **MongoDB** - Account credentials, profile names, and saved homes (when configured)
- **SQLite** - Property listings and sample property data (`server/data/properties.db`)
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **code editor** (VS Code recommended)
- A **web browser** (Chrome, Firefox, Safari, Edge)

## 🚀 Installation & Setup

### Step 1: Clone/Download the Project
```bash
# Navigate to project directory
cd property-finder-app
```

### Step 2: Install Dependencies
```bash
npm install
```

This installs the frontend, backend, SQLite, and MongoDB dependencies. The local property database is created and populated with sample listings the first time the server starts.

### Configure MongoDB account storage

1. Copy `.env.example` to `.env` in the project folder.
2. In MongoDB Atlas, create a database user, allow your current IP in Network Access, and choose **Connect → Drivers**.
3. Put the Atlas connection string in `MONGODB_URI` in `.env`, replacing `USERNAME`, `PASSWORD`, and `CLUSTER_HOST` with your values. URI-encode special characters in the database password.
4. Keep `MONGODB_DATABASE=property_finder` or set it to your preferred database name.
5. Restart the backend with `npm run server` (or restart `npm run dev`).

Do not share or commit `.env`; it is ignored by Git. When `MONGODB_URI` is set, account records (including password hashes), profile names, and saved home IDs are stored in MongoDB. Existing local accounts and saved homes are copied to MongoDB the first time the backend connects. Locally, property listings and uploaded listing images use the SQLite database at
`server/data/properties.db`. On the free Render setup below, SQLite snapshots are
persisted to MongoDB GridFS because Render's filesystem is temporary.

Without `MONGODB_URI`, the app retains its SQLite-only account storage for local development.

### Deploy the backend to Render

The repository includes a free Render Blueprint for the Node.js backend. It uses
`property-finder-app` as the service root. Free Render filesystems are temporary, so
the backend requires MongoDB and stores SQLite application snapshots in MongoDB
GridFS; listings, uploaded images, and the local SQL state survive service restarts.
Create a free MongoDB Atlas database and configure `MONGODB_URI` in Render before
deploying. Do not set `PORT` manually; Render provides it at runtime.

1. Create a free MongoDB Atlas cluster and database user. Allow Render connections
   in Atlas Network Access (for example, `0.0.0.0/0`), and keep the database password
   private.
2. Push the repository to GitHub without committing `.env`.
3. In Render, create a Blueprint and select this repository. In the service's
   Environment settings, set `MONGODB_URI` to the Atlas connection string and save.
   `MONGODB_DATABASE` defaults to `property_finder`.
4. After deployment, check the assigned service URL ending in
   `/api/locations` for a JSON response. The free Render service can spin down when
   idle, so the first request after inactivity may take about a minute.
5. To have the local website and Android app use the same accounts and listings,
   create `.env.local` in `property-finder-app` and set `VITE_API_URL` to the
   deployed API URL, such as:

   ```dotenv
   VITE_API_URL=https://your-service.onrender.com/api
   ```

   Restart Vite after changing this value. Without it, the local website uses the
   local backend and its separate SQLite data.
6. Build the Android app with the deployed backend URL:

   ```powershell
   $env:VITE_API_URL = "https://property-finder-api.onrender.com/api"
   npm run mobile:build
   ```

   Replace the URL if Render assigns a different service hostname. Install the new
   APK after the build; an already-installed APK keeps using its previous API URL.
   Free Render instances have usage limits and are intended for testing/hobby use.

### Step 3: Start the App
```bash
# Either command starts both the backend and frontend
npm run client
# or
npm run dev
```

This command runs:
- **Backend Server**: http://localhost:5000
- **Frontend App**: http://localhost:3000

### Install as an App

After deploying the frontend over HTTPS, open it in Chrome or Edge and use the install icon in the address bar or browser menu. On mobile, use **Add to Home screen**. The app opens in its own standalone window after installation.

### Build the Android App

The project also includes a Capacitor Android shell:

```bash
npm run mobile:build   # Build the web app and sync Android assets
npm run android:open   # Open the native project in Android Studio
npm run android:run    # Run on an Android emulator or device
```

Android Studio, the Android SDK, and `ANDROID_HOME` are required to produce an APK. For a physical device, configure the frontend API URL to point to a deployed backend; `localhost` inside a phone refers to the phone itself.

## 📖 Project Structure

```
property-finder-app/
├── server/
│   └── server.js          # Express backend with API endpoints
├── src/
│   ├── App.jsx            # Main React component
│   ├── App.css            # Styling
│   └── main.jsx           # React entry point
├── public/
│   ├── manifest.webmanifest # Installable app metadata
│   ├── service-worker.js    # App shell caching
│   └── icon.svg             # App icon
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies
└── README.md             # This file
```

## 🔌 API Endpoints

### POST `/api/recommendations`
Rank current listings against a plain-language property request. The recommendation score is explainable matching against fields in each listing; it is not a guarantee of suitability or a generated AI response.

**Request Body:**
```json
{
  "query": "2 BHK furnished apartment under ₹50 lakh in Downtown"
}
```

The response includes recognized criteria and listings ranked by `matchScore` (0–100), with `matchReasons` for the score.

### GET `/api/properties`
Get all properties with optional filters.

**Query Parameters:**
- `bhk` (number): Filter by number of bedrooms
- `maxPrice` (number): Filter by maximum price
- `location` (string): Filter by location
- `furnished` (boolean): Filter by furnishing status

**Example:**
```
GET /api/properties?bhk=2&maxPrice=500000&location=Downtown
```

### POST `/api/predict-price`
Predict property price using both models.

**Request Body:**
```json
{
  "bhk": 2,
  "size": 900,
  "location": "Downtown",
  "furnished": true
}
```

**Response:**
```json
{
  "formulaPrice": 450000,
  "mlPrice": 465000,
  "averagePrice": 457500,
  "confidence": "high"
}
```

### POST `/api/train-model`
Manually train the ML model (runs automatically on startup).

**Response:**
```json
{
  "success": true,
  "message": "Model trained successfully"
}
```

### GET `/api/locations`
Get list of all available locations.

### GET `/api/properties/:id`
Get details of a specific property.

### Account endpoints

The following endpoints require `Authorization: Bearer <token>`:

- `GET /api/account` - Load account profile and saved property IDs
- `PUT /api/account/profile` - Save the account name
- `PUT /api/account/favorites` - Save the account's property IDs as `{ "propertyIds": [1, 2] }`

### POST `/api/properties`
Add a new property to the SQLite database. Required JSON fields: `name`, `location`, `latitude`, `longitude`, `bhk`, `size`, `furnished`, `actualPrice`, and `amenities` (an array of strings). The database is stored at `server/data/properties.db` and seeded with the six sample properties only when first created. Back up this file to preserve local property data.

## 💡 How the ML Model Works

### Data Flow
1. **Training Phase** (Server Startup):
   - Model reads all existing properties
   - Extracts features: BHK, Size, Location multiplier, Furnished status
   - Learns relationship between features and actual prices
   - Saves weights in memory

2. **Prediction Phase** (User Request):
   - User inputs property specifications
   - Model uses learned weights to predict price
   - Returns prediction with confidence score

### Model Architecture
```
Input [BHK, Size, Location, Furnished]
     ↓
Dense(64) + ReLU + Dropout(0.2)
     ↓
Dense(32) + ReLU + Dropout(0.2)
     ↓
Dense(16) + ReLU
     ↓
Dense(1) - Linear Output (Price)
```

### Improving Accuracy
- **Add More Properties**: Model learns better with more training data
- **Diversify Locations**: Include properties from different areas
- **Vary Sizes**: Include small, medium, and large properties
- **Mix Furnished Status**: Include both furnished and unfurnished options

## 🎯 Usage Guide

### 1. Search for Properties
1. Click the **Search Filters** panel on the left
2. Adjust filters:
   - **BHK**: Select number of bedrooms
   - **Max Price**: Slide to set maximum budget
   - **Location**: Choose from dropdown
   - **Furnished**: Select preference
3. Click **Search** button
4. Browse matching properties in the results list

### 2. View Property Details
- Click any **property card** in the list for details
- Cards highlight when selected
- View all amenities and specifications

### 3. Predict Property Price
1. Go to **Price Predictor** section
2. Enter specifications:
   - BHK (number of bedrooms)
   - Size (square feet)
   - Location
   - Furnished status
3. Click **Predict Price**
4. View predictions:
   - **Formula-based**: Quick estimate using algorithm
   - **ML-based**: Advanced prediction from trained model
   - **Average**: Combined estimate for best accuracy

## 🧠 Sample Data

The app comes with 6 sample properties:

| Name | Location | BHK | Size | Price | Furnished |
|------|----------|-----|------|-------|-----------|
| Modern 2BHK Apartment | Downtown | 2 | 900 | ₹450,000 | Yes |
| Cozy 2BHK Flat | Suburbs | 2 | 750 | ₹280,000 | No |
| Spacious 2BHK Villa | Downtown | 2 | 1200 | ₹550,000 | Yes |
| Budget 2BHK Apartment | Suburbs | 2 | 600 | ₹200,000 | No |
| Luxury 2BHK Penthouse | Downtown | 2 | 1500 | ₹750,000 | Yes |
| Semi-Furnished 2BHK | Suburbs | 2 | 850 | ₹320,000 | No |

## 🔧 Customization

### Adding More Properties
Edit `server.js` and add to the `properties` array:
```javascript
{
  id: 7,
  name: "Your Property Name",
  location: "Location Name",
  latitude: 28.xxxx,
  longitude: 77.xxxx,
  bhk: 2,
  size: 900,
  furnished: true,
  actualPrice: 450000,
  amenities: ["Pool", "Gym", "Parking"]
}
```

### Changing Location Multipliers
Edit `locationMultipliers` in `server.js`:
```javascript
const locationMultipliers = {
  "Downtown": 1.5,
  "Suburbs": 1.0,
  "Outskirts": 0.7
};
```

### Adjusting Base Price
Edit in `formulaBasedPrice` function:
```javascript
const basePrice = 200; // Change this value (price per sq ft)
```

### Modifying ML Model
Edit the model architecture in `trainModel` function:
```javascript
mlModel = tf.sequential({
  layers: [
    tf.layers.dense({ units: 128, activation: 'relu', inputShape: [4] }), // Change units
    // Customize layers here
  ]
});
```

## 📈 Performance Tips

### For Better Predictions
1. **Train with More Data**: Add 20-30 properties for better accuracy
2. **Balance Dataset**: Include properties of all sizes and prices
3. **Geographic Diversity**: Add properties from different areas
4. **Price Accuracy**: Ensure historical prices are accurate

### For Faster App
1. **Production Build**: Use `npm run build`
2. **Deploy Frontend**: Host on Vercel, Netlify
3. **Deploy Backend**: Use Heroku, AWS, DigitalOcean
4. **Database**: Switch to MongoDB for scalability

## 🚢 Deployment

### Frontend (Vercel Example)
```bash
npm run build
# Deploy the dist/ folder to Vercel
```

### Backend (Heroku Example)
```bash
# Install Heroku CLI
heroku login
heroku create your-app-name
heroku config:set CORS_ORIGIN=https://your-frontend.com
git push heroku main
```

## 🐛 Troubleshooting

### Port 5000 already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### CORS errors
Ensure backend is running on port 5000 and API_BASE in App.jsx is correct:
```javascript
const API_BASE = 'http://localhost:5000/api';
```

### ML Model not training
- Ensure properties have valid data
- Check browser console for TensorFlow.js errors
- Try refreshing the page

## 📚 Learning Resources

- **React**: https://react.dev
- **Express**: https://expressjs.com
- **TensorFlow.js**: https://www.tensorflow.org/js
- **Vite**: https://vitejs.dev

## 📝 Future Enhancements

- [ ] User authentication & saved properties
- [ ] Advanced ML models (Random Forest, XGBoost)
- [ ] Image uploads for properties
- [ ] Reviews & ratings system
- [ ] Chat with sellers
- [ ] Virtual tours using 360° images
- [ ] Mortgage calculator
- [ ] Neighborhood analytics
- [ ] Price trend graphs
- [ ] Mobile app (React Native)

## 📄 License

This project is open source and available for educational and commercial use.

## 🤝 Contributing

Feel free to fork, modify, and enhance this project!

## ❓ Need Help?

1. Check the troubleshooting section above
2. Review the API endpoints documentation
3. Check browser console for error messages
4. Ensure both servers are running on correct ports

---

**Happy property hunting! 🏠🎉**

Created with ❤️ for real estate seekers and developers.
