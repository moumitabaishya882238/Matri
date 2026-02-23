const express = require('express');
const router = express.Router();
const { processChatMessage } = require('../services/geminiService');
const DailyHealthLog = require('../models/DailyHealthLog');
const { calculateDailyRisk } = require('../utils/riskCalculator');
const multer = require('multer');
const fs = require('fs');

// Setup multer for temporary audio storage
const upload = multer({ dest: 'uploads/' });

// Simple mock middleware since we don't have real frontend session hooked yet in phase tests
// In production, we'd use passport ensureLogin here.
const requireLogin = (req, res, next) => {
    // Mock user for testing if session dies
    if (!req.user) {
        req.user = { _id: "650c1f1e1c9d440000a1b2c3" }; // Mock Object ID
    }
    next();
};

// @route   POST /chat
// @desc    Receive chat message, extract data via Gemini, and log to DB
router.post('/', requireLogin, async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message text is required' });
    }

    try {
        // 1. Find if a log already exists for today to update it, otherwise create new
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        let todayLog = await DailyHealthLog.findOne({
            motherId: req.user._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!todayLog) {
            todayLog = new DailyHealthLog({
                motherId: req.user._id,
                date: new Date()
            });
        }

        // 2a. Fetch Yesterday's log for Context Memory
        const startOfYesterday = new Date(startOfDay);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(endOfDay);
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);

        const yesterdayLog = await DailyHealthLog.findOne({
            motherId: req.user._id,
            date: { $gte: startOfYesterday, $lte: endOfYesterday }
        });

        const yesterdayState = yesterdayLog ? {
            bp_systolic: yesterdayLog.systolicBP || null,
            bp_diastolic: yesterdayLog.diastolicBP || null,
            bleeding: yesterdayLog.bleedingLevel || null,
            fever: yesterdayLog.fever !== null && yesterdayLog.fever !== undefined ? (yesterdayLog.fever ? "yes" : "no") : null,
            pain: yesterdayLog.pain || null,
            sleep_hours: yesterdayLog.sleepHours || null
        } : {};

        // 2b. Prepare current state for AI Context
        const currentState = {
            bp_systolic: todayLog.systolicBP || null,
            bp_diastolic: todayLog.diastolicBP || null,
            bleeding: todayLog.bleedingLevel || null,
            fever: todayLog.fever !== null && todayLog.fever !== undefined ? (todayLog.fever ? "yes" : "no") : null,
            pain: todayLog.pain || null,
            sleep_hours: todayLog.sleepHours || null
        };

        // 3. Process via Gemini with memory context
        const aiResponse = await processChatMessage(message, JSON.stringify(currentState), JSON.stringify(yesterdayState));
        const extractedData = aiResponse.extracted_data || {};
        const emotionalState = aiResponse.emotional_state || {};
        const botReply = aiResponse.bot_reply || "I'm having a little trouble understanding. Could you tell me how you are feeling again?";
        const transcription = aiResponse.user_transcription || message;

        // 4. Merge new extracted data carefully
        if (extractedData.bp_systolic !== null && extractedData.bp_systolic !== undefined) todayLog.systolicBP = extractedData.bp_systolic;
        if (extractedData.bp_diastolic !== null && extractedData.bp_diastolic !== undefined) todayLog.diastolicBP = extractedData.bp_diastolic;
        if (extractedData.bleeding !== null && extractedData.bleeding !== undefined) todayLog.bleedingLevel = extractedData.bleeding;
        if (extractedData.fever !== null && extractedData.fever !== undefined) todayLog.fever = (extractedData.fever === 'yes');
        if (extractedData.pain !== null && extractedData.pain !== undefined) todayLog.pain = extractedData.pain;
        if (extractedData.sleep_hours !== null && extractedData.sleep_hours !== undefined) todayLog.sleepHours = extractedData.sleep_hours;

        if (emotionalState.mood_score !== undefined) todayLog.moodScore = emotionalState.mood_score;
        if (emotionalState.mood_category) todayLog.moodCategory = emotionalState.mood_category;

        // 5. Save to database
        await todayLog.save();

        // 6. Calculate risk immediately to flag emergencies
        const currentRisk = calculateDailyRisk(todayLog);
        const isEmergency = (currentRisk === 'Red');

        res.json({
            reply: botReply,
            transcription,
            extractedData,
            emotionalState,
            currentLog: todayLog,
            isEmergency
        });

    } catch (error) {
        console.error("Chat endpoint error:", error);
        res.status(500).json({ error: 'Failed to process chat message', details: error.message });
    }
});

// @route   POST /chat/voice
// @desc    Receive audio message, transcribe, extract mood & data via Gemini, and log to DB
router.post('/voice', requireLogin, upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
    }

    try {
        const audioPath = req.file.path;

        // 1. Find if a log already exists
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        let todayLog = await DailyHealthLog.findOne({
            motherId: req.user._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!todayLog) {
            todayLog = new DailyHealthLog({
                motherId: req.user._id,
                date: new Date()
            });
        }

        // 2a. Fetch Yesterday's log for Context Memory
        const startOfYesterday = new Date(startOfDay);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(endOfDay);
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);

        const yesterdayLog = await DailyHealthLog.findOne({
            motherId: req.user._id,
            date: { $gte: startOfYesterday, $lte: endOfYesterday }
        });

        const yesterdayState = yesterdayLog ? {
            bp_systolic: yesterdayLog.systolicBP || null,
            bp_diastolic: yesterdayLog.diastolicBP || null,
            bleeding: yesterdayLog.bleedingLevel || null,
            fever: yesterdayLog.fever !== null && yesterdayLog.fever !== undefined ? (yesterdayLog.fever ? "yes" : "no") : null,
            pain: yesterdayLog.pain || null,
            sleep_hours: yesterdayLog.sleepHours || null
        } : {};

        // 2b. Prepare current state
        const currentState = {
            bp_systolic: todayLog.systolicBP || null,
            bp_diastolic: todayLog.diastolicBP || null,
            bleeding: todayLog.bleedingLevel || null,
            fever: todayLog.fever !== null && todayLog.fever !== undefined ? (todayLog.fever ? "yes" : "no") : null,
            pain: todayLog.pain || null,
            sleep_hours: todayLog.sleepHours || null
        };

        // 3. Process audio file via Gemini
        const aiResponse = await processChatMessage(audioPath, JSON.stringify(currentState), JSON.stringify(yesterdayState));

        // Clean up temp audio file
        fs.unlinkSync(audioPath);

        const extractedData = aiResponse.extracted_data || {};
        const emotionalState = aiResponse.emotional_state || {};
        const botReply = aiResponse.bot_reply || "I'm having a little trouble understanding. Could you tell me how you are feeling again?";
        const transcription = aiResponse.user_transcription || "Audio captured";

        // 4. Merge new extracted data
        if (extractedData.bp_systolic !== null && extractedData.bp_systolic !== undefined) todayLog.systolicBP = extractedData.bp_systolic;
        if (extractedData.bp_diastolic !== null && extractedData.bp_diastolic !== undefined) todayLog.diastolicBP = extractedData.bp_diastolic;
        if (extractedData.bleeding !== null && extractedData.bleeding !== undefined) todayLog.bleedingLevel = extractedData.bleeding;
        if (extractedData.fever !== null && extractedData.fever !== undefined) todayLog.fever = (extractedData.fever === 'yes');
        if (extractedData.pain !== null && extractedData.pain !== undefined) todayLog.pain = extractedData.pain;
        if (extractedData.sleep_hours !== null && extractedData.sleep_hours !== undefined) todayLog.sleepHours = extractedData.sleep_hours;

        if (emotionalState.mood_score !== undefined) todayLog.moodScore = emotionalState.mood_score;
        if (emotionalState.mood_category) todayLog.moodCategory = emotionalState.mood_category;

        // 5. Save to database
        await todayLog.save();

        // 6. Calculate risk immediately to flag emergencies
        const currentRisk = calculateDailyRisk(todayLog);
        const isEmergency = (currentRisk === 'Red');

        res.json({
            reply: botReply,
            transcription,
            extractedData,
            emotionalState,
            currentLog: todayLog,
            isEmergency
        });

    } catch (error) {
        console.error("Voice chat endpoint error:", error);
        // Clean up file if error happened
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to process voice message', details: error.message });
    }
});

// @route   POST /chat/reset
// @desc    Clear today's health log so the mother can start over
router.post('/reset', requireLogin, async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const result = await DailyHealthLog.deleteOne({
            motherId: req.user._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (result.deletedCount > 0) {
            res.json({ success: true, message: "Today's log has been completely cleared." });
        } else {
            res.json({ success: true, message: "No log existed for today to clear." });
        }
    } catch (error) {
        console.error("Chat reset error:", error);
        res.status(500).json({ error: 'Failed to reset chat log' });
    }
});

module.exports = router;
