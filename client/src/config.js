const PROD_URL = 'https://greenmark-iota.vercel.app';
const LOCAL_URL = `http://${window.location.hostname}:5000`;

export const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168')
    ? LOCAL_URL
    : PROD_URL;

export const API_URL = `${BASE_URL}/api`;
