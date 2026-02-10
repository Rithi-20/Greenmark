const LOCAL_URL = `http://${window.location.hostname}:5000`;

// Use environment variable from Vercel if available, otherwise fallback to the known backend
const ENV_API_URL = import.meta.env.VITE_API_URL;
const KNOWN_BACKEND = 'https://greenmark-iota.vercel.app';

const PROD_URL = window.location.hostname === 'localhost'
    ? LOCAL_URL
    : (ENV_API_URL || KNOWN_BACKEND);

export const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168')
    ? LOCAL_URL
    : PROD_URL;

export const API_URL = `${BASE_URL}/api`;

console.log('🌐 Greenmark API Configuration:', {
    API_URL,
    hostname: window.location.hostname,
    isLocal: window.location.hostname === 'localhost'
});
