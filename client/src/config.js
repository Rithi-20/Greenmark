const LOCAL_URL = `http://${window.location.hostname}:5000`;

// Dynamically determine the production URL
// If hosted on different domains, this needs to be the BACKEND server URL
const PROD_URL = window.location.hostname === 'localhost'
    ? LOCAL_URL
    : window.location.origin; // Default to current origin for monorepo deployments

export const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168')
    ? LOCAL_URL
    : PROD_URL;

export const API_URL = `${BASE_URL}/api`;
