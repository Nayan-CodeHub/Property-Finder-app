# ⚡ Quick Start Guide

Get the Property Finder app running in **5 minutes**!

## Prerequisites
- Node.js (v16+) installed - [Download](https://nodejs.org/)
- 5 minutes of your time

## Steps

### 1. Install Dependencies (2 minutes)
```bash
npm install
```

### 2. Start the App (1 minute)
```bash
npm run dev
```

### 3. Open in Browser (instantly)
```
http://localhost:3000
```

✅ **Done!** Your property finder app is running!

---

## What You Can Do Now

### 🔍 Search Properties
1. Left sidebar → Adjust filters (BHK, Price, Location, Furnished)
2. Click **Search** button
3. See properties on map and in list

### 💰 Predict Prices
1. Left sidebar → Scroll to **Price Predictor**
2. Enter: BHK, Size, Location, Furnished status
3. Click **Predict Price**
4. Get instant predictions from two models!

### 📍 Explore Map
1. Click markers on map to see property details
2. Click property cards to highlight on map
3. Zoom/pan to explore different areas

---

## Common Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start both servers (frontend + backend) |
| `npm run server` | Start backend only (port 5000) |
| `npm run client` | Start frontend only (port 3000) |
| `npm run build` | Build for production |

---

## Ports

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## Sample Properties Included

The app comes with 6 sample properties in Downtown and Suburbs areas. Try predicting prices for different combinations!

---

## Next Steps

1. **Read README.md** for detailed documentation
2. **Customize sample data** by editing `server.js`
3. **Deploy** to production using guides in README.md
4. **Add more features** from the Future Enhancements list

---

## Troubleshooting

**Port already in use?**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**Dependencies not installing?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Still need help?** Check README.md troubleshooting section.

---

**Enjoy your Property Finder app! 🏠**
