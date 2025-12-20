// API URL Configuration
// In production: Use the Azure backend URL
// In development: Auto-detect localhost/network IP

const hostname = window.location.hostname;

// Check if we're in production (Azure Container Apps or custom domain)
const isProduction = hostname.includes('azurecontainerapps.io') ||
    hostname.includes('orangeflower') ||
    hostname.includes('gestorfinanciero.emprende.ve') ||
    hostname.includes('emprende.ve') ||
    !hostname.includes('localhost') && !hostname.startsWith('192.168');

const API_URL = isProduction
    ? 'https://finanzas-backend.orangeflower-43ff1781.eastus.azurecontainerapps.io/api'
    : `http://${hostname}:3000/api`;

export default API_URL;

