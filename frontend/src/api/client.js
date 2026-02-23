import axios from 'axios';
import { Platform } from 'react-native';

// Ensure this points to your LIVE Render backend URL
const baseURL = 'https://matri-backend-ncrj.onrender.com';

const client = axios.create({
    baseURL,
    withCredentials: true // For session cookies
});

export default client;
