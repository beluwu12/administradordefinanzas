// Automatically detect the host. If running on localhost, use localhost. 
// If running on local network IP (e.g. 192.168.x.x), use that IP.
const hostname = window.location.hostname;
const API_URL = `http://${hostname}:3000/api`;

export default API_URL;
