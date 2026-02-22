# MATRI: AI Postpartum Care Companion System

MATRI is an AI-powered companion app designed to support mothers during the critical first 40 days postpartum. It uses conversational AI to extract health parameters (blood pressure, bleeding, sleep, pain, fever) from unstructured natural language and securely logs it for potential hospital monitoring.

Currently, the project is structured into two main parts:
1. **Frontend**: React Native Mobile App
2. **Backend**: Node.js/Express Server with a Python AI extraction service (powered by Google Gemini 2.5 Flash).

---

## 🍴 Forking & Installation Guide

If you are forking or cloning this repository to run it on your own machine, follow these steps to set up your local development environment.

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v18+ recommended)
- **Python** (v3.8+ recommended)
- **Git**
- **MongoDB** (You need a free MongoDB Atlas cluster or a local instance)
- **Android Studio / Xcode** (For running the React Native mobile emulator)

### 1. Clone Your Fork
First, clone the repository to your local machine:
```bash
git clone https://github.com/YOUR_USERNAME/Matri.git
cd Matri
```

### 2. Backend Setup (`/backend`)
The backend manages the database connections and talks to the Google Gemini AI.

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Install Python dependencies required for the AI extraction:
   ```bash
   pip install google-generativeai python-dotenv
   ```
4. **Environment Variables**: Create a `.env` file inside the `backend/` folder and add the following keys:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string_here
   SESSION_SECRET=your_random_session_secret
   FRONTEND_URL=http://localhost:5173
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Note: You can get a free Gemini API key from Google AI Studio).*

---

## 🚀 Running the App (After Installation)

You will need **exactly two separate terminal windows** open side-by-side to run both the backend and frontend simultaneously.

### Terminal 1: The Backend (Node.js & Python)
The backend manages the database connections and talks to the Google Gemini AI.

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Start the backend server:
   ```bash
   node server.js
   ```
   *Success Indicator:* You should see `Server running on port 5000` and `MongoDB Connected`. Leave this terminal running.

### Terminal 2: The Frontend (React Native)
The frontend is the React Native mobile application interface.

1. Open a **new** terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Start the React Native Metro bundler:
   ```bash
   npm start
   ```
3. **Running the App:** 
   - Once Metro starts, you will see a QR code or menu.
   - Press `a` in the terminal to launch on an **Android Emulator**.
   - Press `i` to launch on an **iOS Simulator** (Mac only).
   - Alternatively, you can scan the QR code using the Expo Go app.

---

## 🛠️ Project Structure Overview

### Backend (`/backend`)
- **`server.js`**: Main entry point for the REST API.
- **`services/geminiService.js`**: Node adapter that spawns the Python AI processor.
- **`gemini_extractor.py`**: A Python script that securely prompts Google's `gemini-2.5-flash` model to translate unstructured chat messages into strict JSON health data.
- **`routes/chat.js`**: The `POST /chat` endpoint that receives messages, invokes Python, stores data in MongoDB, and triggers follow-up questions.

### Frontend (`/frontend`)
- **`AppNavigator.js`**: Handles screen routing using React Navigation Bottom Tabs.
- **`HomeScreen.js`**: The main dashboard showing the mother's current postpartum day and health risk status.
- **`ChatScreen.js`**: The text interface where the mother talks to MATRI to report daily symptoms seamlessly.

## 🤝 Contributing
Feel free to open issues or submit pull requests for any bugs or enhancements!
