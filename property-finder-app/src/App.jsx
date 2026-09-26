import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import './App.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
const FAVORITES_KEY = 'property-finder-favorites';
const SESSION_KEY = 'property-finder-session';
const defaultFilters = { bhk: 'all', minPrice: '', maxPrice: 1000000, minSize: '', location: 'all', propertyType: 'all', amenity: 'all', furnished: 'all', sort: 'price-low' };

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function AuthScreen({ mode, onModeChange, onAuthenticated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password || (mode === 'register' && !form.name.trim())) {
      setError(mode === 'register' ? 'Enter your name, email, and password to continue.' : 'Enter your email and password to continue.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to continue');
      const authenticatedSession = { ...result.user, token: result.token };
      localStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedSession));
      onAuthenticated(authenticatedSession);
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch' ? 'The server is unavailable. Start the backend and try again.' : requestError.message);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand"><span className="brand-mark">⌂</span><span>Havenly</span></div>
        <div className="auth-story">
          <span className="auth-kicker">A better way home</span>
          <h1>Find a place that feels like yours.</h1>
          <p>Search thoughtfully selected homes, understand the market, and move with confidence.</p>
        </div>
        <div className="auth-stat"><strong>6,400+</strong><span>homes discovered this month</span></div>
      </div>
      <section className="auth-panel">
        <div className="auth-panel-top"><span>Property Finder</span><span className="secure-note">Private & secure</span></div>
        <div className="auth-form-wrap">
          <span className="auth-kicker">{mode === 'login' ? 'Welcome back' : 'Start exploring'}</span>
          <h2>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Your next address is waiting.' : 'Save homes and get a smarter view of the market.'}</p>
          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && <label>Full name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" /></label>}
            <label>Email address<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
            <label>Password<input type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="At least 6 characters" /></label>
            {error && <p className="form-error">{error}</p>}
            <button className="btn auth-submit" type="submit">{mode === 'login' ? 'Continue to dashboard' : 'Create free account'} <span>→</span></button>
          </form>
          <p className="auth-switch">{mode === 'login' ? 'New to Havenly?' : 'Already have an account?'} <button onClick={() => { setError(''); onModeChange(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        </div>
        <span className="auth-footer">By continuing, you agree to our terms and privacy policy.</span>
      </section>
    </main>
  );
}

function AccountView({ view, session, favorites, properties, onSignOut, onSessionChange }) {
  if (view === 'saved') {
    const savedProperties = properties.filter(property => favorites.includes(property.id));
    return <section className="account-view"><span className="auth-kicker">Your collection</span><h2>Saved homes</h2><p className="account-lede">Keep the places you want to come back to close at hand.</p>{savedProperties.length ? <div className="saved-property-grid">{savedProperties.map(property => <article className="saved-property" key={property.id}><img src={property.imageUrl} alt={property.name} /><div><strong>{property.name}</strong><span>{property.location} · {property.bhk} BHK</span></div></article>)}</div> : <div className="saved-empty"><span className="empty-icon">♡</span><h3>Your shortlist is empty</h3><p>Tap the heart on any property to save it here.</p></div>}</section>;
  }
  if (view === 'settings') {
    return <section className="account-view"><span className="auth-kicker">Preferences</span><h2>Settings</h2><p className="account-lede">Make Property Finder feel right for you.</p><div className="settings-list"><div><div><strong>Email updates</strong><span>Receive new homes that match your taste</span></div><input type="checkbox" defaultChecked /></div><div><div><strong>Price display</strong><span>Show prices in Indian rupees</span></div><select defaultValue="inr"><option value="inr">INR · ₹</option></select></div><div><div><strong>Appearance</strong><span>Keep the interface light and focused</span></div><span className="setting-pill">Light</span></div></div></section>;
  }
  return <ProfileView session={session} favorites={favorites} properties={properties} onSignOut={onSignOut} onSessionChange={onSessionChange} />;
}

function ProfileView({ session, favorites, properties, onSignOut, onSessionChange }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(session.name);
  const saveProfile = event => {
    event.preventDefault();
    const updatedSession = { ...session, name: name.trim() || session.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    onSessionChange(updatedSession);
    setEditing(false);
  };

  return <section className="account-view"><span className="auth-kicker">Your account</span><h2>Profile</h2><p className="account-lede">Manage your details and make your search more personal.</p><div className="profile-card"><div className="profile-avatar">{session.name?.charAt(0).toUpperCase()}</div>{editing ? <form className="profile-edit-form" onSubmit={saveProfile}><label>Full name<input value={name} onChange={event => setName(event.target.value)} autoFocus /></label><div><button className="btn btn-primary" type="submit">Save changes</button><button className="cancel-edit" type="button" onClick={() => setEditing(false)}>Cancel</button></div></form> : <><div><h3>{session.name}</h3><p>{session.email}</p><span className="member-since">Member since today</span></div><button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit profile</button></>}</div><div className="profile-stats"><div><strong>{favorites.length}</strong><span>saved homes</span></div><div><strong>0</strong><span>active alerts</span></div><div><strong>{properties.length}</strong><span>market listings</span></div></div><button className="sign-out" onClick={onSignOut}>Sign out of this device</button></section>;
}

export default function App() {
  const [session, setSession] = useState(() => {
    const savedSession = readStorage(SESSION_KEY, null);
    return savedSession?.token ? savedSession : null;
  });
  const [authMode, setAuthMode] = useState('login');
  const [activeView, setActiveView] = useState('discover');
  const [showMap, setShowMap] = useState(false);
  const [properties, setProperties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
  const [modelTrained, setModelTrained] = useState(false);
  const [predictor, setPredictor] = useState({ bhk: 2, size: 900, location: 'Downtown', furnished: true });
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    fetchLocations();
    fetchProperties();
    trainModel();
  }, []);

  useEffect(() => localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)), [favorites]);

  useEffect(() => {
    if (!session?.token) return;
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(response => {
        if (!response.ok) {
          localStorage.removeItem(SESSION_KEY);
          setSession(null);
        }
      })
      .catch(() => {});
  }, [session?.token]);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE}/locations`);
      setLocations(await response.json());
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== 'all') query.append(key, value);
      });
      const response = await fetch(`${API_BASE}/properties?${query}`);
      if (!response.ok) throw new Error('Unable to load properties');
      setProperties(await response.json());
    } catch (error) {
      setLoadError('We could not load the homes right now.');
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    try {
      const response = await fetch(`${API_BASE}/train-model`, { method: 'POST' });
      setModelTrained(response.ok);
    } catch (error) {
      console.error('Error training model:', error);
    }
  };

  const predictPrice = async () => {
    try {
      const response = await fetch(`${API_BASE}/predict-price`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(predictor) });
      setPrediction(await response.json());
    } catch (error) {
      console.error('Error predicting price:', error);
    }
  };

  const formatPrice = price => `₹${Number(price).toLocaleString()}`;
  const updateFilter = (field, value) => setFilters(current => ({ ...current, [field]: value }));
  const toggleFavorite = id => setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const updatePredictor = (field, value) => setPredictor(current => ({ ...current, [field]: value }));

  if (!session) return <AuthScreen mode={authMode} onModeChange={setAuthMode} onAuthenticated={setSession} />;

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand"><span className="brand-mark">⌂</span><div><h1>Havenly</h1><p>Your thoughtful property search</p></div></div>
        <nav className="dashboard-nav"><button className={activeView === 'discover' ? 'active' : ''} onClick={() => setActiveView('discover')}>Discover</button><button className={activeView === 'saved' ? 'active' : ''} onClick={() => setActiveView('saved')}>Saved <span>{favorites.length}</span></button><button className={activeView === 'profile' ? 'active' : ''} onClick={() => setActiveView('profile')}>Profile</button><button className={activeView === 'settings' ? 'active' : ''} onClick={() => setActiveView('settings')}>Settings</button></nav>
        <div className="header-actions"><span className="badge">{modelTrained ? '● Market ready' : '○ Preparing market'}</span><button className="header-avatar" onClick={() => setActiveView('profile')}>{session.name?.charAt(0).toUpperCase()}</button></div>
      </header>
      {activeView !== 'discover' ? <main className="account-main"><AccountView view={activeView} session={session} favorites={favorites} properties={properties} onSessionChange={setSession} onSignOut={() => { localStorage.removeItem(SESSION_KEY); setSession(null); }} /></main> : <div className="container">
        <aside className="sidebar">
          <section className="filters-section">
            <h3>🔍 Search Properties</h3>
            <div className="filter-grid">
              <div className="filter-group"><label>BHK</label><select value={filters.bhk} onChange={event => updateFilter('bhk', event.target.value)}><option value="all">Any</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} BHK</option>)}</select></div>
              <div className="filter-group"><label>Property type</label><select value={filters.propertyType} onChange={event => updateFilter('propertyType', event.target.value)}><option value="all">Any type</option><option value="Apartment">Apartment</option><option value="Villa">Villa</option><option value="Penthouse">Penthouse</option></select></div>
            </div>
            <div className="filter-grid"><div className="filter-group"><label>Minimum price</label><input type="number" placeholder="₹ minimum" value={filters.minPrice} onChange={event => updateFilter('minPrice', event.target.value)} /></div><div className="filter-group"><label>Maximum price</label><input type="number" placeholder="₹ maximum" value={filters.maxPrice} onChange={event => updateFilter('maxPrice', event.target.value)} /></div></div>
            <div className="filter-grid"><div className="filter-group"><label>Minimum area</label><input type="number" placeholder="sq ft" value={filters.minSize} onChange={event => updateFilter('minSize', event.target.value)} /></div><div className="filter-group"><label>Location</label><select value={filters.location} onChange={event => updateFilter('location', event.target.value)}><option value="all">All locations</option>{locations.map(location => <option key={location} value={location}>{location}</option>)}</select></div></div>
            <div className="filter-grid"><div className="filter-group"><label>Amenity</label><select value={filters.amenity} onChange={event => updateFilter('amenity', event.target.value)}><option value="all">Any amenity</option><option value="Parking">Parking</option><option value="Gym">Gym</option><option value="Pool">Pool</option><option value="Security">Security</option><option value="Garden">Garden</option></select></div><div className="filter-group"><label>Furnished</label><select value={filters.furnished} onChange={event => updateFilter('furnished', event.target.value)}><option value="all">Any</option><option value="true">Furnished</option><option value="false">Unfurnished</option></select></div></div>
            <div className="filter-group"><label>Sort by</label><select value={filters.sort} onChange={event => updateFilter('sort', event.target.value)}><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="size-high">Largest area first</option></select></div>
            <button className="btn btn-primary" onClick={fetchProperties} disabled={loading}>{loading ? 'Searching...' : 'Apply filters'}</button>
          </section>
          <section className="predictor-section">
            <h3>💰 Price Predictor</h3>
            <div className="filter-grid"><div className="filter-group"><label>BHK</label><input type="number" min="1" max="5" value={predictor.bhk} onChange={event => updatePredictor('bhk', Number(event.target.value))} /></div><div className="filter-group"><label>Size (sq ft)</label><input type="number" value={predictor.size} onChange={event => updatePredictor('size', Number(event.target.value))} /></div></div>
            <div className="filter-group"><label>Location</label><select value={predictor.location} onChange={event => updatePredictor('location', event.target.value)}>{locations.map(location => <option key={location} value={location}>{location}</option>)}</select></div>
            <label className="checkbox-label"><input type="checkbox" checked={predictor.furnished} onChange={event => updatePredictor('furnished', event.target.checked)} /> Furnished</label>
            <button className="btn btn-secondary" onClick={predictPrice}>Predict price</button>
            {prediction && <div className="prediction-result"><h4>Estimated market price</h4><div className="result-row"><span>Formula estimate</span><strong>{formatPrice(prediction.formulaPrice)}</strong></div>{prediction.mlPrice && <div className="result-row"><span>ML estimate</span><strong>{formatPrice(prediction.mlPrice)}</strong></div>}<div className="result-row avg"><span>Suggested midpoint</span><strong>{formatPrice(prediction.averagePrice)}</strong></div><span className="confidence">Confidence: {prediction.confidence}</span></div>}
          </section>
        </aside>
        <main className="main">
          {showMap && <div className="map-container"><MapContainer center={[28.6139, 77.2090]} zoom={12} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />{properties.map(property => <Marker key={property.id} position={[property.latitude, property.longitude]} onClick={() => setSelectedProperty(property)}><Popup><div className="popup"><h4>{property.name}</h4><p><strong>{formatPrice(property.actualPrice)}</strong></p><p>{property.bhk} BHK · {property.size} sq ft</p><p>{property.location} · {property.propertyType}</p></div></Popup></Marker>)}</MapContainer></div>}
          <div className={`properties-list ${showMap ? 'with-map' : 'full-results'}`}><div className="list-heading"><div><span className="section-kicker">Curated for you</span><h3>{properties.length ? 'Recommended homes' : 'No homes found'}</h3></div><div className="list-actions"><button className="map-toggle" onClick={() => setShowMap(current => !current)}>{showMap ? 'Hide map' : 'Open map'}</button><span>{favorites.length} saved</span></div></div>{loadError ? <div className="empty-state"><h3>{loadError}</h3><button className="btn btn-secondary" onClick={fetchProperties}>Try again</button></div> : <div className="cards-grid">{loading ? [1, 2, 3].map(index => <div className="property-skeleton" key={index} />) : properties.map(property => <article className={`property-card ${selectedProperty?.id === property.id ? 'active' : ''}`} key={property.id} onClick={() => setSelectedProperty(property)}><div className="card-image-wrap"><img className="card-image" src={property.imageUrl} alt={property.name} /><button className={`favorite-button ${favorites.includes(property.id) ? 'saved' : ''}`} onClick={event => { event.stopPropagation(); toggleFavorite(property.id); }} aria-label="Save property">{favorites.includes(property.id) ? '♥' : '♡'}</button></div><div className="card-content"><div className="card-header"><h4>{property.name}</h4><span className="price">{formatPrice(property.actualPrice)}</span></div><p className="property-meta">{property.propertyType} · {property.bhk} BHK · {property.bathrooms} bath · {property.size} sq ft</p><p className="property-location">📍 {property.location}</p><div className="amenities">{property.amenities.slice(0, 4).map(amenity => <span key={amenity} className="amenity-tag">{amenity}</span>)}</div><button className="btn btn-small" onClick={event => { event.stopPropagation(); setSelectedProperty(property); }}>View details →</button></div></article>)}</div>}{!loading && !loadError && properties.length === 0 && <div className="empty-state"><h3>No properties match these filters</h3><p>Try widening your budget or removing an amenity filter.</p></div>}</div>
        </main>
      </div>}
      {selectedProperty && <div className="modal-backdrop" onClick={() => setSelectedProperty(null)}><section className="property-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedProperty(null)} aria-label="Close details">×</button><img className="modal-image" src={selectedProperty.imageUrl} alt={selectedProperty.name} /><div className="modal-content"><div className="modal-title"><div><span className="eyebrow">{selectedProperty.propertyType} · {selectedProperty.location}</span><h2>{selectedProperty.name}</h2></div><button className={`favorite-button large ${favorites.includes(selectedProperty.id) ? 'saved' : ''}`} onClick={() => toggleFavorite(selectedProperty.id)}>{favorites.includes(selectedProperty.id) ? '♥' : '♡'}</button></div><strong className="modal-price">{formatPrice(selectedProperty.actualPrice)}</strong><p className="modal-description">{selectedProperty.description}</p><div className="detail-grid"><span><b>{selectedProperty.bhk}</b> bedrooms</span><span><b>{selectedProperty.bathrooms}</b> bathrooms</span><span><b>{selectedProperty.size}</b> sq ft</span><span><b>{selectedProperty.yearBuilt}</b> built</span><span><b>{formatPrice(selectedProperty.monthlyRent)}</b> estimated rent</span><span><b>{formatPrice(Math.round(selectedProperty.actualPrice / selectedProperty.size))}</b> per sq ft</span></div><div className="amenities modal-amenities">{selectedProperty.amenities.map(amenity => <span key={amenity} className="amenity-tag">{amenity}</span>)}</div><button className="btn btn-primary">Contact owner</button></div></section></div>}
    </div>
  );
}
