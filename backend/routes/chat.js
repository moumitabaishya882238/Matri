const express = require('express');
const router = express.Router();
const { processChatMessage } = require('../services/geminiService');
const DailyHealthLog = require('../models/DailyHealthLog');

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

        // 2. Prepare current state for AI Context
        const currentState = {
            bp_systolic: todayLog.systolicBP || null,
            bp_diastolic: todayLog.diastolicBP || null,
            bleeding: todayLog.bleedingLevel || null,
            fever: todayLog.fever !== null && todayLog.fever !== undefined ? (todayLog.fever ? "yes" : "no") : null,
            pain: todayLog.pain || null,
            sleep_hours: todayLog.sleepHours || null
        };

        // 3. Process via Gemini with memory context
        const aiResponse = await processChatMessage(message, JSON.stringify(currentState));
        const extractedData = aiResponse.extracted_data || {};
        const botReply = aiResponse.bot_reply || "I'm having a little trouble understanding. Could you tell me how you are feeling again?";

        // 4. Merge new extracted data carefully
        if (extractedData.bp_systolic !== null && extractedData.bp_systolic !== undefined) todayLog.systolicBP = extractedData.bp_systolic;
        if (extractedData.bp_diastolic !== null && extractedData.bp_diastolic !== undefined) todayLog.diastolicBP = extractedData.bp_diastolic;
        if (extractedData.bleeding !== null && extractedData.bleeding !== undefined) todayLog.bleedingLevel = extractedData.bleeding;
        if (extractedData.fever !== null && extractedData.fever !== undefined) todayLog.fever = (extractedData.fever === 'yes');
        if (extractedData.pain !== null && extractedData.pain !== undefined) todayLog.pain = extractedData.pain;
        if (extractedData.sleep_hours !== null && extractedData.sleep_hours !== undefined) todayLog.sleepHours = extractedData.sleep_hours;

        // 5. Save to database
        await todayLog.save();

        res.json({
            reply: botReply,
            extractedData,
            currentLog: todayLog
        });

    } catch (error) {
        console.error("Chat endpoint error:", error);
        res.status(500).json({ error: 'Failed to process chat message', details: error.message });
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
