// API URL Configuration
// In production: Use the Azure backend URL
// In development: Auto-detect localhost/network IP
// In Android emulator: Use 10.0.2.2 to access host machine

import { Capacitor } from '@capacitor/core';

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

// Check if we're running in a native app (Android/iOS)
const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

// Check if we're in production (Azure Container Apps or custom domain)
const isProduction = hostname.includes('azurecontainerapps.io') ||
    hostname.includes('orangeflower') ||
    hostname.includes('gestorfinanciero.emprende.ve') ||
    hostname.includes('emprende.ve') ||
    (!hostname.includes('localhost') && !hostname.startsWith('192.168') && !isNative);

// Determine API URL based on environment
let API_URL;

if (isProduction) {
    // Production: Azure backend
    API_URL = 'https://finanzas-backend.orangeflower-43ff1781.eastus.azurecontainerapps.io/api';
} else if (isNative && platform === 'android') {
    // Android emulator: 10.0.2.2 points to host machine's localhost
    API_URL = 'http://10.0.2.2:3000/api';
} else if (isNative && platform === 'ios') {
    // iOS simulator: localhost works directly
    API_URL = 'http://localhost:3000/api';
} else {
    // Web development: use current hostname
    API_URL = `http://${hostname}:3000/api`;
}

console.log(`[Config] Platform: ${platform}, isNative: ${isNative}, API_URL: ${API_URL}`);

export default API_URL;
