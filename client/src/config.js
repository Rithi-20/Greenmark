const LOCAL_URL = `http://${window.location.hostname}:5000`;

// HARDCODED BACKEND URL TO BYPASS ALL DYNAMIC ISSUES
const BACKEND_URL = "https://greenmark-iota.vercel.app";

const PROD_URL = window.location.hostname === 'localhost'
    ? LOCAL_URL
    : BACKEND_URL;

export const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168')
    ? LOCAL_URL
    : PROD_URL;

export const API_URL = `${BASE_URL}/api`;

console.log('🌐 API LOADED:', API_URL);
