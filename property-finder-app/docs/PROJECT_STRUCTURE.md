# 📁 Project Structure & File Guide

Complete breakdown of all files in the Property Finder application.

## 📂 Directory Tree

```
property-finder-app/
├── 📄 server/
│   └── server.js                 # Express backend with APIs & ML
│
├── 📄 src/
│   ├── App.jsx                   # Main React component
│   ├── App.css                   # Styling & layout
│   └── main.jsx                  # React entry point
│
├── 📄 Application Files
│   └── index.html                # HTML template
│
├── 📄 Configuration Files
│   ├── package.json              # Dependencies & scripts
│   ├── vite.config.js            # Vite build configuration
│   ├── .gitignore                # Git ignore rules
│   └── .env.example              # Environment variables template
│
├── 📄 docs/
    ├── QUICKSTART.md             # 5-minute setup guide
    ├── TECHNICAL.md              # Architecture & ML details
    ├── API_REFERENCE.md          # API endpoints documentation
    └── PROJECT_STRUCTURE.md      # This file
│
└── README.md                     # Main documentation (START HERE!)
```

---

## 🔍 File Descriptions

### Core Application Files

#### `server.js` (Backend - 350 lines)
**Purpose**: Express.js backend server with APIs and ML pipeline

**Key Features**:
- 6 sample properties with mock data
- RESTful API endpoints
- TensorFlow.js ML model training
- Dual price prediction (formula + neural network)
- Location-based multipliers
- Property filtering logic

**Key Functions**:
- `formulaBasedPrice()` - Quick price estimation
- `trainModel()` - Train neural network
- `mlBasedPrice()` - ML-based prediction
- Express routes for CRUD operations

**Dependencies**:
- Express.js, CORS, TensorFlow.js, Node.js filesystem

---

#### `App.jsx` (Frontend - 280 lines)
**Purpose**: Main React component with UI logic

**Key Features**:
- Search filters (BHK, price, location, furnished)
- Property search results and cards
- Property list with cards
- Price predictor calculator
- Real-time API integration
- Model training trigger

**Key Components**:
- Filter panel
- Main content area
- Property cards grid
- Price prediction form
- Results display

**Dependencies**:
- React, Fetch API

---

#### `App.css` (Styling - 450 lines)
**Purpose**: Complete styling for responsive design

**Sections**:
- Header styling (gradient background)
- Sidebar layout (filters & predictor)
- Main content area (property results)
- Property cards (grid layout)
- Responsive design (mobile-friendly)
- Color scheme and typography

---

#### `main.jsx` (React Entry - 10 lines)
**Purpose**: Bootstrap React application

**Code**:
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

#### `index.html` (HTML Template - 20 lines)
**Purpose**: HTML entry point for the application

**Key Elements**:
- Root div for React
- Script to load Vite + main.jsx
- Viewport and meta tags

---

### Configuration Files

#### `package.json` (Dependencies - 40 lines)
**Purpose**: Define project metadata and dependencies

**Scripts**:
```json
{
  "dev": "npm run both servers",
  "server": "npm start backend",
  "client": "npm start frontend",
  "build": "vite build"
}
```

**Dependencies**:
- React 18.2.0
- Express 4.18.2
- TensorFlow.js 4.11.0
- Vite 4.4.9

---

#### `vite.config.js` (Vite Config - 12 lines)
**Purpose**: Configure Vite build tool

**Settings**:
- React plugin
- Dev server port: 3000
- Build output: dist/

---

#### `.gitignore` (Git Config - 30 lines)
**Purpose**: Exclude files from version control

**Ignored**:
- node_modules/
- dist/ (build files)
- .env files
- IDE configs (.vscode, .idea)
- System files (.DS_Store)

---

#### `.env.example` (Environment Template - 30 lines)
**Purpose**: Template for environment variables

**Variables**:
```
PORT=5000
VITE_API_URL=http://localhost:5000/api
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/property-finder
MAP_CENTER_LAT=28.6139
MAP_CENTER_LNG=77.2090
```

---

### Documentation Files

#### `README.md` (Main Docs - 500+ lines)
**Purpose**: Comprehensive project documentation

**Sections**:
1. ✨ Features overview
2. 🛠️ Tech stack
3. 📋 Prerequisites
4. 🚀 Installation & setup
5. 📖 Project structure
6. 🔌 API endpoints
7. 🧠 ML model explanation
8. 📚 Learning resources
9. 📈 Future enhancements

**Start here!**

---

#### `QUICKSTART.md` (Quick Guide - 80 lines)
**Purpose**: Get running in 5 minutes

**Covers**:
- Prerequisites (Node.js)
- 3-step installation
- Port information
- Basic commands
- Troubleshooting

**Perfect for**: First-time users

---

#### `TECHNICAL.md` (Deep Dive - 600+ lines)
**Purpose**: Architecture and technical details

**Sections**:
1. System architecture diagram
2. Price prediction models (formula + ML)
3. ML training pipeline
4. API design patterns
5. Frontend components
6. Database schema
7. Performance metrics
8. Scaling strategies

**Perfect for**: Developers, engineers, architects

---

#### `API_REFERENCE.md` (API Docs - 400+ lines)
**Purpose**: Complete API documentation

**Covers**:
- All 7 endpoints with examples
- Request/response formats
- Query parameters
- Error codes
- cURL examples
- Postman collection
- JavaScript fetch examples

**Perfect for**: API integration, testing

---

#### `PROJECT_STRUCTURE.md` (This File)
**Purpose**: Overview of all project files

**Includes**:
- Directory tree
- File descriptions
- Line counts
- Key features of each file
- Quick reference guide

---

## 📊 Statistics

| Metric | Count |
|--------|-------|
| Total Files | 11 |
| Code Files | 6 |
| Config Files | 4 |
| Doc Files | 5 |
| Total Lines of Code | ~1500 |
| Backend Lines | ~350 |
| Frontend Lines | ~280 |
| Styling Lines | ~450 |
| Documentation Lines | ~1500+ |

---

## 🚀 Quick Reference

### To Start Development
```bash
npm install          # Install dependencies
npm run dev         # Start both servers
# Open http://localhost:3000
```

### To Understand the Project
1. Read `README.md` (overview)
2. Read `QUICKSTART.md` (setup)
3. Explore `server/server.js` (backend logic)
4. Explore `src/App.jsx` (frontend UI)
5. Check `TECHNICAL.md` (deep dive)

### To Integrate APIs
1. Use `API_REFERENCE.md`
2. Check cURL/Fetch examples
3. Test with Postman
4. Integrate into your app

### To Deploy
1. Read deployment section in `README.md`
2. Build: `npm run build`
3. Deploy frontend to Vercel/Netlify
4. Deploy backend to Heroku/AWS

---

## 🔄 Data Flow

```
User Input (Frontend)
    ↓
React State Updates (App.jsx)
    ↓
API Request to Backend (fetch)
    ↓
Express Route Handler (server.js)
    ↓
Data Processing/ML Prediction
    ↓
JSON Response
    ↓
React State Update
    ↓
UI Re-render (App.jsx, CSS styling)
    ↓
Visual Output (Map, Cards, Predictions)
```

---

## 🧠 Machine Learning Flow

```
Property Data (server.js)
    ↓
Feature Extraction
    ↓
Tensor Creation (TensorFlow.js)
    ↓
Model Training (100 epochs)
    ↓
Model in Memory
    ↓
Prediction Request (User Input)
    ↓
Feature Preparation
    ↓
Model.predict()
    ↓
Price Prediction
    ↓
Return to Frontend
    ↓
Display Results (App.jsx)
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/properties` | List properties |
| GET | `/api/properties/:id` | Get single property |
| POST | `/api/properties` | Create property |
| POST | `/api/predict-price` | Predict price |
| POST | `/api/train-model` | Train ML model |
| GET | `/api/locations` | Get locations |

---

## 📝 File Dependencies

### Backend Dependencies
```
server.js
├── express (web framework)
├── cors (cross-origin)
├── @tensorflow/tfjs (machine learning)
├── fs (file system)
└── path (path utilities)
```

### Frontend Dependencies
```
App.jsx
├── React (UI framework)
├── CSS (App.css)
└── Fetch API (HTTP requests)
```

### Build Dependencies
```
package.json
├── vite (build tool)
├── @vitejs/plugin-react (React support)
└── concurrently (run multiple commands)
```

---

## 🎯 Development Workflow

1. **Edit Code**
   - Modify `server.js` for backend changes
   - Modify `App.jsx` for frontend changes
   - Modify `App.css` for styling

2. **Hot Reload**
   - Frontend: Vite auto-reloads on save
   - Backend: Restart with `npm run server`

3. **Test**
   - Open http://localhost:3000
   - Use browser DevTools
   - Check API with Postman

4. **Build**
   - Run `npm run build`
   - Output in `dist/` folder

5. **Deploy**
   - Deploy `dist/` to static host
   - Deploy `server.js` to Node host

---

## 📚 Next Steps

1. **Setup**: Follow `QUICKSTART.md` (5 min)
2. **Explore**: Open the app and test features
3. **Understand**: Read `TECHNICAL.md` 
4. **Customize**: Edit sample properties in `server.js`
5. **Extend**: Add new features based on Future Enhancements

---

## 🆘 File Issues?

- **Missing files**: Check all files were created
- **Import errors**: Verify paths in imports match file names
- **Build errors**: Clear `node_modules`, run `npm install`
- **Runtime errors**: Check Node.js version (v16+)

---

**Happy coding! 🚀**

For detailed information, see the specific documentation files or the README.md.
