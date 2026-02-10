const LOCAL_URL = `http://${window.location.hostname}:5000`;

// Dynamically determine the production URL
// Use environment variable if provided (Standard for Vercel/Vite)
const ENV_API_URL = import.meta.env.VITE_API_URL;

// For Vercel Rewrites, we use relative paths in production
const PROD_URL = '';

export const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168')
    ? LOCAL_URL
    : PROD_URL;

export const API_URL = `${BASE_URL}/api`;

console.log('🌐 Greenmark API Configuration:', {
    API_URL,
    hostname: window.location.hostname,
    isLocal: window.location.hostname === 'localhost'
});
