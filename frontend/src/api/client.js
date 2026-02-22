import axios from 'axios';

// Ensure this works for Android emulator (10.0.2.2 usually) or iOS (localhost). 
// Since user is testing possibly on web or emulator, localhost is fine for now but might need tweak.
const baseURL = 'http://localhost:5000';

const client = axios.create({
    baseURL,
    withCredentials: true // For session cookies
});

export default client;
