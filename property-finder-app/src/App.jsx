import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
const SESSION_KEY = 'property-finder-session';
const defaultFilters = { bhk: 'all', minPrice: '', maxPrice: '', minSize: '', location: 'all', propertyType: 'all', amenity: 'all', furnished: 'all', sort: 'price-low' };

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

function AccountView({ view, session, favorites, properties, myProperties, onSignOut, onSessionChange, onSelectProperty, onEditProperty, onCreateListing }) {
  if (view === 'saved') {
    const savedProperties = properties.filter(property => favorites.includes(property.id));
    return <section className="account-view"><span className="auth-kicker">Your collection</span><h2>Saved homes</h2><p className="account-lede">Keep the places you want to come back to close at hand.</p>{savedProperties.length ? <div className="saved-property-grid">{savedProperties.map(property => <article className="saved-property" key={property.id}><img src={property.imageUrl} alt={property.name} /><div><strong>{property.name}</strong><span>{property.location} · {property.bhk} BHK</span></div></article>)}</div> : <div className="saved-empty"><span className="empty-icon">♡</span><h3>Your shortlist is empty</h3><p>Tap the heart on any property to save it here.</p></div>}</section>;
  }
  if (view === 'settings') {
    return (
      <section className="account-view">
        <span className="auth-kicker">Preferences</span>
        <h2>Settings</h2>
        <p className="account-lede">Make Property Finder feel right for you.</p>
        <div className="settings-list">
          <div><div><strong>Email updates</strong><span>Receive new homes that match your taste</span></div><input type="checkbox" defaultChecked /></div>
          <div><div><strong>Price display</strong><span>Show prices in Indian rupees</span></div><select defaultValue="inr"><option value="inr">INR · ₹</option></select></div>
          <div><div><strong>Appearance</strong><span>Keep the interface light and focused</span></div><span className="setting-pill">Light</span></div>
        </div>
        <section className="about-app" aria-labelledby="about-app-title">
          <span className="auth-kicker">Made with care</span>
          <h3 id="about-app-title">About this app</h3>
          <p>Property Finder was created by <strong>Nayan Gharat</strong> to make finding and listing homes simpler.</p>
          <div className="creator-links">
            <a href="mailto:nayangharat886@gmail.com">nayangharat886@gmail.com</a>
            <a href="https://www.linkedin.com/in/nayan-gharat-86207a357/" target="_blank" rel="noopener noreferrer">LinkedIn · Nayan Gharat</a>
          </div>
        </section>
      </section>
    );
  }
  if (view === 'my-listings') {
    return <section className="account-view"><span className="auth-kicker">Your properties</span><h2>My listings</h2><p className="account-lede">Manage the homes you have shared with buyers.</p>{myProperties.length ? <div className="saved-property-grid">{myProperties.map(property => <article className="saved-property" key={property.id}><img src={property.imageUrl} alt={property.name} /><div><strong>{property.name}</strong><span>{property.location} · {property.bhk} BHK · ₹{Number(property.actualPrice).toLocaleString()}</span><span>{property.photos?.length || 1} photo{(property.photos?.length || 1) === 1 ? '' : 's'}</span><div className="listing-actions"><button className="btn btn-secondary" onClick={() => onSelectProperty(property)}>View listing</button><button className="btn btn-secondary" onClick={() => onEditProperty(property)}>Edit listing</button></div></div></article>)}</div> : <div className="saved-empty"><span className="empty-icon">⌂</span><h3>You have not listed a property yet</h3><p>Create a listing so home seekers can discover and contact you.</p><button className="btn btn-primary listing-submit" onClick={onCreateListing}>List a property</button></div>}</section>;
  }
  return <ProfileView session={session} favorites={favorites} properties={properties} onSignOut={onSignOut} onSessionChange={onSessionChange} />;
}

function ProfileView({ session, favorites, properties, onSignOut, onSessionChange }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(session.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setName(session.name), [session.name]);

  const saveProfile = async event => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/account/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ name: name.trim() })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save profile changes.');
      const updatedSession = { ...result.user, token: session.token };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
      onSessionChange(updatedSession);
      setEditing(false);
    } catch (saveError) {
      setError(saveError.message === 'Failed to fetch' ? 'The server is unavailable. Please try again.' : saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return <section className="account-view"><span className="auth-kicker">Your account</span><h2>Profile</h2><p className="account-lede">Manage your details and make your search more personal.</p><div className="profile-card"><div className="profile-avatar">{session.name?.charAt(0).toUpperCase()}</div>{editing ? <form className="profile-edit-form" onSubmit={saveProfile}><label>Full name<input required maxLength="80" value={name} onChange={event => setName(event.target.value)} autoFocus /></label>{error && <p className="form-error" role="alert">{error}</p>}<div><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button><button className="cancel-edit" type="button" disabled={saving} onClick={() => { setName(session.name); setEditing(false); setError(''); }}>Cancel</button></div></form> : <><div><h3>{session.name}</h3><p>{session.email}</p><span className="member-since">Member since today</span></div><button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit profile</button></>}</div><div className="profile-stats"><div><strong>{favorites.length}</strong><span>saved homes</span></div><div><strong>0</strong><span>active alerts</span></div><div><strong>{properties.length}</strong><span>market listings</span></div></div><button className="sign-out" onClick={onSignOut}>Sign out of this device</button></section>;
}

function SellPropertyForm({ session, property, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    name: property?.name || '', location: property?.location || '', propertyType: property?.propertyType || 'Apartment',
    bhk: String(property?.bhk || 2), bathrooms: String(property?.bathrooms || 1),
    size: property?.size ? String(property.size) : '', actualPrice: property?.actualPrice ? String(property.actualPrice) : '',
    yearBuilt: property?.yearBuilt ? String(property.yearBuilt) : '', furnished: property?.furnished || false,
    amenities: property?.amenities?.join(', ') || '', description: property?.description || ''
  }));
  const [photos, setPhotos] = useState(() => property?.photos?.length ? property.photos : (property?.imageUrl ? [property.imageUrl] : []));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(property);

  const updateField = (field, value) => setForm(current => ({ ...current, [field]: value }));

  const selectPhotos = async event => {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    setError('');
    if (!files.length) return;
    const currentBytes = photos.reduce((total, photo) => {
      if (!photo.startsWith('data:image/')) return total;
      return total + Math.floor((photo.split(',')[1] || '').length * 3 / 4);
    }, 0);
    if (photos.length + files.length > 5 ||
        files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0) ||
        currentBytes + files.reduce((total, file) => total + file.size, 0) > 5 * 1024 * 1024) {
      setError('Choose up to 5 JPG, PNG, or WebP photos with no more than 5 MB total.');
      return;
    }
    try {
      const loadedPhotos = await Promise.all(files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error(`Could not read ${file.name}. Please choose it again.`));
        reader.readAsDataURL(file);
      })));
      setPhotos(current => [...current, ...loadedPhotos]);
    } catch (photoError) {
      setError(photoError.message);
    }
  };

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (!photos.length) {
      setError('Add a property photo before publishing your listing.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/properties${isEditing ? `/${property.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({
          ...form,
          bhk: Number(form.bhk),
          bathrooms: Number(form.bathrooms),
          size: Number(form.size),
          actualPrice: Number(form.actualPrice),
          yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : null,
          amenities: form.amenities.split(',').map(amenity => amenity.trim()).filter(Boolean),
          photos,
          imageUrl: photos[0]
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Unable to ${isEditing ? 'update' : 'publish'} your listing.`);
      onSaved(result);
    } catch (submitError) {
      setError(submitError.message === 'Failed to fetch' ? 'The server is unavailable. Please try again.' : submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="account-view sell-view">
      <span className="auth-kicker">{isEditing ? 'Update your listing' : 'For property owners'}</span>
      <h2>{isEditing ? 'Edit property' : 'List your property'}</h2>
      <p className="account-lede">Share your home with people looking for a place just like yours. Buyers can contact you directly by email.</p>
      <form className="listing-form" onSubmit={submit}>
        <label className="listing-field listing-field-wide">Property title
          <input required maxLength="120" value={form.name} onChange={event => updateField('name', event.target.value)} placeholder="e.g. Bright 2-bedroom apartment" />
        </label>
        <div className="listing-fields">
          <label className="listing-field">Location / neighborhood
            <input required maxLength="120" value={form.location} onChange={event => updateField('location', event.target.value)} placeholder="e.g. Downtown" />
          </label>
          <label className="listing-field">Property type
            <select value={form.propertyType} onChange={event => updateField('propertyType', event.target.value)}>
              <option>Apartment</option><option>Villa</option><option>Penthouse</option>
            </select>
          </label>
          <label className="listing-field">Bedrooms (BHK)
            <input required type="number" min="1" max="20" value={form.bhk} onChange={event => updateField('bhk', event.target.value)} />
          </label>
          <label className="listing-field">Bathrooms
            <input required type="number" min="1" max="30" value={form.bathrooms} onChange={event => updateField('bathrooms', event.target.value)} />
          </label>
          <label className="listing-field">Area (sq ft)
            <input required type="number" min="1" value={form.size} onChange={event => updateField('size', event.target.value)} />
          </label>
          <label className="listing-field">Asking price (₹)
            <input required type="number" min="1" value={form.actualPrice} onChange={event => updateField('actualPrice', event.target.value)} />
          </label>
          <label className="listing-field">Year built (optional)
            <input type="number" min="1800" max={new Date().getFullYear() + 2} value={form.yearBuilt} onChange={event => updateField('yearBuilt', event.target.value)} />
          </label>
          <label className="listing-field">Amenities (comma-separated)
            <input value={form.amenities} onChange={event => updateField('amenities', event.target.value)} placeholder="Parking, Garden, Security" />
          </label>
        </div>
        <label className="listing-checkbox"><input type="checkbox" checked={form.furnished} onChange={event => updateField('furnished', event.target.checked)} /> This property is furnished</label>
        <label className="listing-field listing-field-wide">Description
          <textarea maxLength="3000" rows="4" value={form.description} onChange={event => updateField('description', event.target.value)} placeholder="Tell buyers what makes this home special." />
        </label>
        <label className="listing-field listing-field-wide">Property photos (JPG, PNG, or WebP; up to 5 photos, 5 MB total)
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectPhotos} />
        </label>
        {photos.length > 0 && <div className="listing-photo-grid">{photos.map((photo, index) => <div className="listing-photo-item" key={`${index}-${photo.slice(-24)}`}><img className="listing-photo-preview" src={photo} alt={`Property photo ${index + 1}`} /><button className="photo-remove" type="button" onClick={() => setPhotos(current => current.filter((_, photoIndex) => photoIndex !== index))} aria-label={`Remove photo ${index + 1}`}>Remove</button></div>)}</div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="listing-form-actions">
          <button className="btn btn-primary listing-submit" type="submit" disabled={saving}>{saving ? (isEditing ? 'Saving changes...' : 'Publishing listing...') : (isEditing ? 'Save changes' : 'Publish property')}</button>
          {isEditing && <button className="btn btn-secondary" type="button" disabled={saving} onClick={onCancel}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}

function PropertyDetailsModal({ property, session, accountReady, favorites, favoritesBusy, onClose, onToggleFavorite, onEdit }) {
  const photos = property.photos?.length ? property.photos : [property.imageUrl];
  const [activePhoto, setActivePhoto] = useState(0);
  const isOwner = session && Number(property.ownerId) === Number(session.id);

  useEffect(() => setActivePhoto(0), [property.id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="property-modal" onClick={event => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close details">×</button>
        <div className="property-gallery">
          <img className="modal-image" src={photos[activePhoto] || property.imageUrl} alt={`${property.name}, photo ${activePhoto + 1}`} />
          {photos.length > 1 && <div className="gallery-thumbnails" aria-label="Property photos">{photos.map((photo, index) => <button className={`gallery-thumbnail ${index === activePhoto ? 'active' : ''}`} key={`${index}-${photo.slice(-20)}`} onClick={() => setActivePhoto(index)} aria-label={`Show photo ${index + 1}`} aria-pressed={index === activePhoto}><img src={photo} alt="" /></button>)}</div>}
        </div>
        <div className="modal-content">
          <div className="modal-title">
            <div><span className="eyebrow">{property.propertyType} · {property.location}</span><h2>{property.name}</h2></div>
            <button className={`favorite-button large ${favorites.includes(property.id) ? 'saved' : ''}`} disabled={!session || !accountReady || favoritesBusy} onClick={() => onToggleFavorite(property.id)} aria-label={favorites.includes(property.id) ? 'Remove from saved homes' : 'Save property'}>{favorites.includes(property.id) ? '♥' : '♡'}</button>
          </div>
          <strong className="modal-price">{`₹${Number(property.actualPrice).toLocaleString()}`}</strong>
          <p className="modal-description">{property.description}</p>
          <div className="detail-grid">
            <span><b>{property.bhk}</b> bedrooms</span><span><b>{property.bathrooms}</b> bathrooms</span>
            <span><b>{property.size}</b> sq ft</span><span><b>{property.yearBuilt || 'Not specified'}</b> built</span>
            <span><b>{property.monthlyRent ? `₹${Number(property.monthlyRent).toLocaleString()}` : 'Not specified'}</b> estimated rent</span>
            <span><b>{`₹${Math.round(property.actualPrice / property.size).toLocaleString()}`}</b> per sq ft</span>
          </div>
          <div className="amenities modal-amenities">{property.amenities.map(amenity => <span key={amenity} className="amenity-tag">{amenity}</span>)}</div>
          <div className="seller-contact">
            <span>{property.sellerEmail ? `Listed by ${property.sellerName}` : 'Seller contact details are not available for this listing.'}</span>
            <div className="listing-actions">
              {isOwner && <button className="btn btn-secondary" onClick={() => onEdit(property)}>Edit listing</button>}
              {property.sellerEmail && <a className="btn btn-primary" href={`mailto:${property.sellerEmail}?subject=${encodeURIComponent(`Property enquiry: ${property.name}`)}`}>Email seller</a>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    const savedSession = readStorage(SESSION_KEY, null);
    return savedSession?.token ? savedSession : null;
  });
  const activeSessionToken = useRef(session?.token || null);
  const [authMode, setAuthMode] = useState('login');
  const [activeView, setActiveView] = useState('discover');
  const [properties, setProperties] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [myPropertiesError, setMyPropertiesError] = useState('');
  const [editingProperty, setEditingProperty] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const [naturalSearchText, setNaturalSearchText] = useState('');
  const [recommendationCriteria, setRecommendationCriteria] = useState(null);
  const recommendationQueryRef = useRef('');
  const [favorites, setFavorites] = useState([]);
  const [accountReady, setAccountReady] = useState(false);
  const [favoritesBusy, setFavoritesBusy] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountReload, setAccountReload] = useState(0);
  const [modelTrained, setModelTrained] = useState(false);
  const [predictor, setPredictor] = useState({ bhk: 2, size: 900, location: 'Downtown', furnished: true });
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    fetchLocations();
    trainModel();
  }, []);

  useEffect(() => {
    setMyProperties([]);
    setMyPropertiesError('');
    if (activeView !== 'my-listings' || !session?.token) return;
    fetch(`${API_BASE}/my-properties`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load your listings.');
        setMyProperties(result);
      })
      .catch(error => {
        setMyPropertiesError(error.message);
        console.error('Error fetching your property listings:', error);
      });
  }, [activeView, session?.token]);

  useEffect(() => {
    if (!session?.token) {
      setAccountReady(false);
      return;
    }

    let active = true;
    const loadAccount = async () => {
      setAccountReady(false);
      setAccountError('');
      let loaded = false;
      try {
        const response = await fetch(`${API_BASE}/account`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        const result = await response.json();
        if (!active) return;
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem(SESSION_KEY);
            clearCachedAuthData();
            activeSessionToken.current = null;
            setSession(null);
            return;
          }
          throw new Error(result.error || 'Unable to load your account data.');
        }

        const accountFavorites = Array.isArray(result.favorites)
          ? result.favorites.filter(id => Number.isSafeInteger(id) && id > 0)
          : [];
        if (!active) return;

        const refreshedSession = { ...result.user, token: session.token };
        setSession(refreshedSession);
        localStorage.setItem(SESSION_KEY, JSON.stringify(refreshedSession));
        setFavorites(accountFavorites);
        loaded = true;
      } catch (error) {
        if (!active) return;
        setAccountError(error.message || 'Unable to load your account data.');
        console.error('Error loading account data:', error);
      } finally {
        if (active) setAccountReady(loaded);
      }
    };

    loadAccount();
    return () => { active = false; };
  }, [session?.token, accountReload]);

  const clearCachedAuthData = async () => {
    if (!('caches' in window)) return;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(async key => {
        try {
          const cache = await caches.open(key);
          const entries = await cache.keys();
          const sensitiveEntries = entries.filter(request => {
            const url = new URL(request.url);
            return url.pathname.startsWith('/api/') || request.headers.has('Authorization');
          });
          await Promise.all(sensitiveEntries.map(request => cache.delete(request)));
        } catch (error) {
          console.error('Failed to remove sensitive cached API/auth entries:', error);
        }
      }));
    } catch (error) {
      console.error('Failed to enumerate caches for auth cleanup:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE}/locations`);
      setLocations(await response.json());
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      if (recommendationQueryRef.current) {
        const response = await fetch(`${API_BASE}/recommendations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: recommendationQueryRef.current })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to recommend homes.');
        setProperties(result.results);
        setRecommendationCriteria(result.criteria);
        return;
      }

      const query = new URLSearchParams();
      Object.entries(filtersRef.current).forEach(([key, value]) => {
        if (value !== '' && value !== 'all') query.append(key, value);
      });
      const response = await fetch(`${API_BASE}/properties?${query}`);
      if (!response.ok) throw new Error('Unable to load properties');
      setProperties(await response.json());
      setRecommendationCriteria(null);
    } catch (error) {
      setLoadError('We could not load the homes right now.');
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByRequirements = event => {
    event.preventDefault();
    recommendationQueryRef.current = naturalSearchText.trim();
    setRecommendationCriteria(null);
    fetchProperties();
  };

  const applyFilters = () => {
    recommendationQueryRef.current = '';
    setRecommendationCriteria(null);
    setNaturalSearchText('');
    fetchProperties();
  };

  useEffect(() => {
    if (activeView !== 'discover') return undefined;

    const refreshVisibleProperties = () => {
      if (document.visibilityState === 'visible') fetchProperties();
    };
    refreshVisibleProperties();
    const refreshInterval = window.setInterval(refreshVisibleProperties, 30000);
    document.addEventListener('visibilitychange', refreshVisibleProperties);

    return () => {
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', refreshVisibleProperties);
    };
  }, [activeView, fetchProperties]);

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
  const toggleFavorite = async id => {
    if (!accountReady || favoritesBusy) return;
    const token = session.token;
    const nextFavorites = favorites.includes(id)
      ? favorites.filter(item => item !== id)
      : [...favorites, id];
    setFavoritesBusy(true);
    setAccountError('');
    try {
      const response = await fetch(`${API_BASE}/account/favorites`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ propertyIds: nextFavorites })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save this home.');
      if (activeSessionToken.current !== token) return;
      setFavorites(result.favorites);
    } catch (error) {
      if (activeSessionToken.current === token) {
        setAccountError(error.message === 'Failed to fetch' ? 'The server is unavailable. Your saved homes were not changed.' : error.message);
      }
      console.error('Error saving favorites:', error);
    } finally {
      if (activeSessionToken.current === token) setFavoritesBusy(false);
    }
  };
  const updatePredictor = (field, value) => setPredictor(current => ({ ...current, [field]: value }));
  const handlePropertyCreated = property => {
    setMyProperties(current => [property, ...current]);
    setActiveView('discover');
    fetchLocations();
    fetchProperties();
  };
  const handlePropertySaved = property => {
    setMyProperties(current => [property, ...current.filter(item => item.id !== property.id)]);
    setProperties(current => current.map(item => item.id === property.id ? { ...item, ...property } : item));
    setEditingProperty(null);
    setSelectedProperty(property);
    setActiveView('discover');
    fetchLocations();
    fetchProperties();
  };
  const beginEditProperty = property => {
    setSelectedProperty(null);
    setEditingProperty(property);
    setActiveView('sell');
  };
  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    clearCachedAuthData();
    activeSessionToken.current = null;
    setSession(null);
    setFavorites([]);
    setAccountReady(false);
    setFavoritesBusy(false);
    setAccountError('');
    setActiveView('discover');
  };

  const handleAuthenticated = authenticatedSession => {
    activeSessionToken.current = authenticatedSession.token;
    setFavorites([]);
    setAccountReady(false);
    setFavoritesBusy(false);
    setAccountError('');
    setSession(authenticatedSession);
  };

  if (!session) return <AuthScreen mode={authMode} onModeChange={setAuthMode} onAuthenticated={handleAuthenticated} />;

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand"><span className="brand-mark">⌂</span><div><h1>Havenly</h1><p>Your thoughtful property search</p></div></div>
        <nav className="dashboard-nav" aria-label="Main navigation">
          <button className={activeView === 'discover' ? 'active' : ''} onClick={() => setActiveView('discover')}><span className="nav-icon" aria-hidden="true">⌂</span><span className="nav-label">Discover</span></button>
          <button className={activeView === 'saved' ? 'active' : ''} onClick={() => setActiveView('saved')}><span className="nav-icon" aria-hidden="true">♡</span><span className="nav-label">Saved{favorites.length > 0 && <span>{favorites.length}</span>}</span></button>
          <button className={activeView === 'sell' ? 'active' : ''} onClick={() => setActiveView('sell')}><span className="nav-icon" aria-hidden="true">＋</span><span className="nav-label">Sell</span></button>
          <button className={activeView === 'my-listings' ? 'active' : ''} onClick={() => setActiveView('my-listings')}><span className="nav-icon" aria-hidden="true">▤</span><span className="nav-label">Listings</span></button>
          <button className={activeView === 'profile' ? 'active' : ''} onClick={() => setActiveView('profile')}><span className="nav-icon" aria-hidden="true">◉</span><span className="nav-label">Profile</span></button>
          <button className={activeView === 'settings' ? 'active' : ''} onClick={() => setActiveView('settings')}><span className="nav-icon" aria-hidden="true">⚙</span><span className="nav-label">Settings</span></button>
        </nav>
        <div className="header-actions"><span className="badge">{modelTrained ? '● Market ready' : '○ Preparing market'}</span><button className="header-avatar" onClick={() => setActiveView('profile')}>{session.name?.charAt(0).toUpperCase()}</button></div>
      </header>
      {accountError && <div className="account-sync-error" role="alert"><span>{accountError}</span><button onClick={() => setAccountReload(value => value + 1)}>Retry</button></div>}
      {activeView !== 'discover' ? <main className="account-main">{activeView === 'sell' ? <SellPropertyForm key={editingProperty?.id || 'new-listing'} session={session} property={editingProperty} onSaved={editingProperty ? handlePropertySaved : handlePropertyCreated} onCancel={() => { setEditingProperty(null); setActiveView('my-listings'); }} /> : <><AccountView view={activeView} session={session} favorites={favorites} properties={properties} myProperties={myProperties} onSelectProperty={setSelectedProperty} onCreateListing={() => { setEditingProperty(null); setActiveView('sell'); }} onEditProperty={beginEditProperty} onSessionChange={setSession} onSignOut={signOut} />{myPropertiesError && activeView === 'my-listings' && <p className="form-error" role="alert">{myPropertiesError}</p>}</>}</main> : <div className="container">
        <aside className="sidebar">
          <section className="filters-section">
            <h3>🔍 Search Properties</h3>
            <form className="natural-search-form" onSubmit={searchByRequirements}>
              <label htmlFor="natural-property-search">Describe your ideal home</label>
              <textarea
                id="natural-property-search"
                rows="3"
                maxLength="500"
                value={naturalSearchText}
                onChange={event => setNaturalSearchText(event.target.value)}
                placeholder="Try: 2 BHK furnished apartment under ₹50 lakh in Downtown"
              />
              <button className="btn btn-primary" type="submit" disabled={loading || !naturalSearchText.trim()}>
                {loading && recommendationQueryRef.current ? 'Finding matches...' : 'Find my matches'}
              </button>
              {recommendationCriteria && <div className="recommendation-note">
                <strong>{recommendationCriteria.hasPreferences ? 'Match scores are based on these details:' : 'No specific filters detected; ranked matches use the listing details.'}</strong>
                <span>{[
                  recommendationCriteria.bhk && `${recommendationCriteria.bhk} BHK`,
                  recommendationCriteria.minPrice && `from ₹${(recommendationCriteria.minPrice / 100000).toLocaleString()} lakh`,
                  recommendationCriteria.maxPrice && `up to ₹${(recommendationCriteria.maxPrice / 100000).toLocaleString()} lakh`,
                  recommendationCriteria.location,
                  recommendationCriteria.propertyType,
                  recommendationCriteria.furnished === true && 'Furnished',
                  recommendationCriteria.furnished === false && 'Unfurnished',
                  ...recommendationCriteria.amenities,
                  ...recommendationCriteria.keywords
                ].filter(Boolean).join(' · ') || 'No preferences detected'}</span>
              </div>}
            </form>
            <div className="filter-grid">
              <div className="filter-group"><label>BHK</label><select value={filters.bhk} onChange={event => updateFilter('bhk', event.target.value)}><option value="all">Any</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} BHK</option>)}</select></div>
              <div className="filter-group"><label>Property type</label><select value={filters.propertyType} onChange={event => updateFilter('propertyType', event.target.value)}><option value="all">Any type</option><option value="Apartment">Apartment</option><option value="Villa">Villa</option><option value="Penthouse">Penthouse</option></select></div>
            </div>
            <div className="filter-grid"><div className="filter-group"><label>Minimum price</label><input type="number" placeholder="₹ minimum" value={filters.minPrice} onChange={event => updateFilter('minPrice', event.target.value)} /></div><div className="filter-group"><label>Maximum price</label><input type="number" placeholder="₹ maximum" value={filters.maxPrice} onChange={event => updateFilter('maxPrice', event.target.value)} /></div></div>
            <div className="filter-grid"><div className="filter-group"><label>Minimum area</label><input type="number" placeholder="sq ft" value={filters.minSize} onChange={event => updateFilter('minSize', event.target.value)} /></div><div className="filter-group"><label>Location</label><select value={filters.location} onChange={event => updateFilter('location', event.target.value)}><option value="all">All locations</option>{locations.map(location => <option key={location} value={location}>{location}</option>)}</select></div></div>
            <div className="filter-grid"><div className="filter-group"><label>Amenity</label><select value={filters.amenity} onChange={event => updateFilter('amenity', event.target.value)}><option value="all">Any amenity</option><option value="Parking">Parking</option><option value="Gym">Gym</option><option value="Pool">Pool</option><option value="Security">Security</option><option value="Garden">Garden</option></select></div><div className="filter-group"><label>Furnished</label><select value={filters.furnished} onChange={event => updateFilter('furnished', event.target.value)}><option value="all">Any</option><option value="true">Furnished</option><option value="false">Unfurnished</option></select></div></div>
            <div className="filter-group"><label>Sort by</label><select value={filters.sort} onChange={event => updateFilter('sort', event.target.value)}><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="size-high">Largest area first</option></select></div>
            <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>{loading ? 'Searching...' : 'Apply filters'}</button>
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
          <div className="properties-list full-results"><div className="list-heading"><div><span className="section-kicker">{recommendationCriteria ? 'Smart match results' : 'Curated for you'}</span><h3>{properties.length ? (recommendationCriteria ? 'Homes ranked for your needs' : 'Recommended homes') : 'No homes found'}</h3></div><div className="list-actions"><span>{favorites.length} saved</span></div></div>{loadError ? <div className="empty-state"><h3>{loadError}</h3><button className="btn btn-secondary" onClick={fetchProperties}>Try again</button></div> : <div className="cards-grid">{loading ? [1, 2, 3].map(index => <div className="property-skeleton" key={index} />) : properties.map(property => <article className={`property-card ${selectedProperty?.id === property.id ? 'active' : ''}`} key={property.id} onClick={() => setSelectedProperty(property)}><div className="card-image-wrap"><img className="card-image" src={property.imageUrl} alt={property.name} /><button className={`favorite-button ${favorites.includes(property.id) ? 'saved' : ''}`} disabled={!accountReady || favoritesBusy} onClick={event => { event.stopPropagation(); toggleFavorite(property.id); }} aria-label="Save property">{favorites.includes(property.id) ? '♥' : '♡'}</button></div><div className="card-content">{recommendationCriteria && <div className="match-score"><strong>{property.matchScore}% match</strong><span>{property.matchReasons?.slice(0, 3).join(' · ') || 'Based on your search'}</span></div>}<div className="card-header"><h4>{property.name}</h4><span className="price">{formatPrice(property.actualPrice)}</span></div><p className="property-meta">{property.propertyType} · {property.bhk} BHK · {property.bathrooms} bath · {property.size} sq ft</p><p className="property-location">📍 {property.location}</p><div className="amenities">{property.amenities.slice(0, 4).map(amenity => <span key={amenity} className="amenity-tag">{amenity}</span>)}</div><button className="btn btn-small" onClick={event => { event.stopPropagation(); setSelectedProperty(property); }}>View details →</button></div></article>)}</div>}{!loading && !loadError && properties.length === 0 && <div className="empty-state"><h3>No properties match these filters</h3><p>Try widening your budget or removing an amenity filter.</p></div>}</div>
        </main>
      </div>}
      {selectedProperty && <PropertyDetailsModal property={selectedProperty} session={session} accountReady={accountReady} favorites={favorites} favoritesBusy={favoritesBusy} onClose={() => setSelectedProperty(null)} onToggleFavorite={toggleFavorite} onEdit={beginEditProperty} />}
    </div>
  );
}
