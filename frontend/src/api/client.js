import axios from 'axios';
import { Platform } from 'react-native';

// Ensure this works for Android emulator (10.0.2.2) and iOS/Web (localhost). 
const baseURL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

const client = axios.create({
    baseURL,
    withCredentials: true // For session cookies
});

export default client;
