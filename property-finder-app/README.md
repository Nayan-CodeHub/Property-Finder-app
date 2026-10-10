# Property Finder

Property Finder is a responsive real-estate discovery app for people looking for a home and owners who want to list one. Users can search homes with filters or a plain-language request, compare estimated prices, save favorites, view property details and contact sellers. Signed-in owners can publish listings, update details and prices, and add a photo gallery.

This repository contains the web app, its API server, and an Android app shell. The React web app is packaged for Android with Capacitor; it is not a separate React Native implementation.

## Creator

Created by **Nayan Gharat**.

- Email: [nayangharat886@gmail.com](mailto:nayangharat886@gmail.com)
- LinkedIn: [Nayan Gharat](https://www.linkedin.com/in/nayan-gharat-86207a357/)

## What the app does

### For home seekers

- Browse property cards with location, price, type, area, bedrooms, furnishing and amenities.
- Filter listings by criteria such as location, property type, price, size and furnishing.
- Describe a search in plain English, for example: `2 BHK furnished apartment under ₹50 lakh in Downtown`.
- See ranked matches and the criteria/reasons used to rank them.
- Open property details, browse available photos, review amenities and specifications, and email the seller.
- Save and revisit favorite homes with an account.
- Get a formula-based and machine-learning price estimate for a property's size, location and furnishing.

### For property owners

- Register or sign in to create a listing.
- Add property details, amenities, asking price and up to five JPG, PNG or WebP images (5 MB decoded image data total).
- Review and remove photos before publishing.
- View and edit their own listings, including the asking price and photos.
- Buyers can see seller contact details on listings that have an associated account.

### Accounts and mobile use

- Edit the display name and manage saved properties.
- Install the web app as a Progressive Web App (PWA) in supported browsers.
- Use the Capacitor Android app, which packages the same web interface.
- The service worker caches the app shell for offline startup; account and API responses are not cached.

## A short explanation you can use

> “Property Finder is a real-estate search app built with React and Node.js. It helps users find homes using filters or a natural-language search, compare price estimates, and save properties. Sellers can publish a listing with multiple photos and later update its price or details. The app has a responsive web interface and an Android version built with Capacitor.”

**Hinglish version:**

> “Property Finder ek real-estate search app hai. Isme users filters ya normal language mein apni requirement likhkar ghar dhoondh sakte hain, price estimate dekh sakte hain aur pasand ke ghar save kar sakte hain. Property owners apni listing photos ke saath publish karte hain aur baad mein price aur details edit kar sakte hain. App React aur Node.js se bana hai, aur iska Android version Capacitor se package kiya gaya hai.”

### Suggested demo flow

1. Open Discover and show the filters and plain-language search.
2. Enter a search request and point out the ranked results and match reasons.
3. Open a property to show its details and photo gallery.
4. Open Saved to demonstrate account-based favorites.
5. Open My Listings, choose **Edit listing**, and show the price and photo controls.
6. Do not press **Save changes** during a demo unless you intend to change the listing.
7. Optionally show the price predictor and explain that its result is an estimate.

## How it is built

```text
Browser / Android WebView
          │
          │ HTTPS/HTTP JSON requests
          ▼
React 18 + Vite frontend
          │
          │ REST API (/api/...)
          ▼
Node.js + Express backend
     ┌────┴──────────────┐
     │                   │
sql.js / SQLite       TensorFlow.js
listings, accounts,   price-prediction
favorites, photos     model (in memory)
     │
     └── Optional MongoDB Atlas
         account data + SQLite snapshots in GridFS
```

### Frontend

- **React 18** renders the search, account, listing and property-detail screens.
- **Vite** runs the local development server and creates the production web bundle in `dist/`.
- **CSS** provides the responsive desktop and mobile layout.
- The frontend calls the Express API using `fetch`. `VITE_API_URL` can point the app at a shared/deployed API.
- The PWA manifest, app icon and service worker are in `public/`.

### Backend and data

- **Node.js and Express** provide the JSON API, authentication and listing operations.
- **sql.js** provides the SQLite database. The server exports changes to `server/data/properties.db` by default; `PROPERTY_DATABASE_PATH` can select another path.
- Listings, owner IDs, favorites, account records (when running locally without MongoDB), and uploaded image data are stored in the SQLite database.
- A database with no property rows is initialized with six sample properties. Existing databases are kept and updated with additive schema migrations.
- When `MONGODB_URI` is configured, account records are stored in MongoDB and the SQLite database snapshot is stored in MongoDB GridFS. This supports persistence on hosts with temporary filesystems, such as a free Render service.
- In local development without MongoDB, the SQLite file is the local source of persisted data. Local data and a deployed database are separate unless the frontend is configured to use the deployed API.

### Search and price estimates

- Natural-language search is parsed by backend JavaScript rules. It recognizes supported criteria such as bedroom count, budget, furnishing, property type, location, amenities and keywords.
- Listings receive an explainable match score based on recognized criteria; results are ranked by score and then price. This is a rule-based matcher, not a large-language-model conversation or a promise that a home is suitable.
- The formula estimator uses area, a base price per square foot, a location multiplier and a furnishing bonus.
- A TensorFlow.js dense neural network is trained on available listings when the server starts. The prediction endpoint returns the formula estimate, ML estimate (when available), an average and a confidence label.
- The ML model is held in server memory and retrained at startup. Its output depends on available listing data. The sample dataset is small, so predictions are for demonstration and should not be treated as professional valuations.

### Authentication and privacy

- Passwords are stored as salted hashes using Node.js `scrypt`; plaintext passwords are not stored.
- Authenticated API requests use bearer session tokens. When MongoDB is configured, session records have an expiry; without MongoDB, sessions are held in the running server process.
- The service worker excludes API and authenticated requests from its cache and removes sensitive cached API/auth entries during activation.
- Keep `.env` and `.env.local` private. Never commit database credentials, real user data or uploaded listing data.

## Technology stack

| Area | Technology |
| --- | --- |
| Web UI | React 18, JavaScript, CSS |
| Development/build | Vite |
| API | Node.js, Express, REST/JSON |
| Relational data | SQLite through sql.js |
| Optional hosted persistence | MongoDB Node.js driver and GridFS |
| Price model | TensorFlow.js |
| Installable web app | Web App Manifest, Service Worker |
| Android packaging | Capacitor 8, Android Gradle project |

## Run locally

### Requirements

- Node.js (Node 22 or newer is recommended for the Capacitor 8 toolchain) and npm.
- Android Studio and Android SDK only if you want to build or run the Android app.
- MongoDB Atlas is optional for local development; it is required for the documented production setup that persists data across temporary-host restarts.

### Install and start

From the `property-finder-app` directory:

```powershell
npm install
npm run client
```

Open [http://localhost:3000](http://localhost:3000). The `client` script starts Vite on port `3000` and the API server on port `5000`. `npm run dev` is an alias for the same combined command.

To run the processes separately, use two terminals:

```powershell
npm run server
npm run frontend
```

The first server start creates the local SQLite database and its sample listings if the database is empty.

### Environment configuration

Copy `.env.example` to `.env` for backend settings. The connection URI is a secret; do not add its real value to Git or share it in screenshots.

```dotenv
MONGODB_URI=
MONGODB_DATABASE=property_finder
# PROPERTY_DATABASE_PATH=
```

To make the local web app use a deployed API instead of the local server, create `.env.local`:

```dotenv
VITE_API_URL=https://your-api-host.example/api
```

Restart Vite after changing frontend environment variables. Variables beginning with `VITE_` are bundled into frontend code and must not contain secrets. Without `VITE_API_URL`, the app uses its local API configuration.

## Build and run Android

Build the web production bundle and copy it into the Capacitor Android project:

```powershell
npm run mobile:build
```

Open the Android project in Android Studio:

```powershell
npm run android:open
```

Run on a configured emulator/device:

```powershell
npm run android:run
```

To build a debug APK from the Android project:

```powershell
Set-Location android
.\gradlew.bat assembleDebug
```

The normal debug APK output is `android/app/build/outputs/apk/debug/app-debug.apk`. If building on a phone or a different computer, configure `VITE_API_URL` to a reachable deployed backend before `mobile:build`; `localhost` on the phone refers to the phone, not the development computer. Reinstall the APK after rebuilding to see bundled frontend changes.

## REST API overview

All routes are under `/api`. Authenticated routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Purpose | Authentication |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Create an account | No |
| `POST` | `/auth/login` | Sign in | No |
| `GET` | `/auth/me` | Validate the current session | Yes |
| `GET` | `/account` | Load profile and favorite IDs | Yes |
| `PUT` | `/account/profile` | Update profile name | Yes |
| `PUT` | `/account/favorites` | Replace saved property IDs | Yes |
| `GET` | `/properties` | List and filter properties | No |
| `GET` | `/properties/:id` | Get property details and photos | No |
| `POST` | `/properties` | Create a property listing | Yes |
| `PUT` | `/properties/:id` | Update a listing owned by the user | Yes |
| `GET` | `/my-properties` | List the signed-in user's listings | Yes |
| `POST` | `/recommendations` | Parse a text query and rank listings | No |
| `POST` | `/predict-price` | Return formula and ML estimates | No |
| `POST` | `/train-model` | Train the price model on current listings | No |
| `GET` | `/locations` | Return known listing locations | No |

Property create/update validates listing fields and photo data. An update returns `403` if the signed-in user does not own the listing. Photos are limited to five JPEG, PNG or WebP data URLs and 5 MiB of decoded image data in total.

## Project structure

```text
property-finder-app/
├── android/                 # Capacitor Android project
├── docs/                    # Additional project documentation
├── public/                  # PWA manifest, service worker and icon
├── server/
│   ├── data/                # Local SQLite database (generated)
│   └── server.js            # Express API, persistence and ML model
├── src/
│   ├── App.jsx              # React screens and app behavior
│   ├── App.css              # UI styling and responsive layout
│   └── main.jsx             # React entry point and service-worker setup
├── .env.example             # Safe environment-variable template
├── capacitor.config.json    # Capacitor app configuration
├── package.json             # Dependencies and npm scripts
└── vite.config.js           # Vite development-server configuration
```

## Deployment notes

- The backend uses the `PORT` environment variable supplied by its host (default `5000` for local development).
- For a host with temporary disk storage, configure `MONGODB_URI` before starting the backend. The server refuses production startup without it.
- Set `MONGODB_DATABASE` if the default `property_finder` database name is not desired.
- Point the web build or Android build to the deployed API using `VITE_API_URL`.
- The first request to a free or sleeping backend may take longer while the service starts.
- Never include real `.env` files, secrets, private user data or local database files in a public repository.

## Current scope and limitations

- Search parsing and ranking use explicit JavaScript rules, not an LLM.
- Price outputs are estimates from a simple formula and a small-data neural network; they are not appraisals or financial advice.
- The trained model is in memory and is not persisted as a model artifact.
- Without MongoDB, account and listing persistence is local to the configured SQLite database; that data is not automatically shared with another device.
- PWA offline support is for the app shell. Search, account, listing and other API features need a reachable backend.
- Photo upload supports embedded JPG, PNG and WebP files within the documented limits; it is not a cloud image-hosting service.

## Validation

Useful checks from the project directory:

```powershell
npm run build
node --check server/server.js
```

For Android, run `npm run mobile:build` and then build the Android Gradle project.
