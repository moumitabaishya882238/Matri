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
        // 1. Process via Gemini to extract structured JSON
        const extractedData = await processChatMessage(message);

        // 2. Validate and map extracted data to DB schema format
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Find if a log already exists for today to update it, otherwise create new
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

        // Merge extracted data carefully
        if (extractedData.bp_systolic !== null) todayLog.systolicBP = extractedData.bp_systolic;
        if (extractedData.bp_diastolic !== null) todayLog.diastolicBP = extractedData.bp_diastolic;
        if (extractedData.bleeding !== null) todayLog.bleedingLevel = extractedData.bleeding;
        if (extractedData.fever !== null) todayLog.fever = (extractedData.fever === 'yes');
        if (extractedData.pain !== null) todayLog.pain = extractedData.pain;
        if (extractedData.sleep_hours !== null) todayLog.sleepHours = extractedData.sleep_hours;

        // Save to database
        await todayLog.save();

        // 3. Draft a response message back to the user
        // (In future phases, the AI will generate the natural language response too. 
        // Here we will do a basic manual acknowledgement or follow-up)

        let botReply = '';

        const missingFields = [];
        if (todayLog.systolicBP === null || todayLog.diastolicBP === null) missingFields.push('Blood Pressure');
        if (todayLog.bleedingLevel === null) missingFields.push('Bleeding Level');
        if (todayLog.fever === null) missingFields.push('Fever Status');
        if (todayLog.pain === null) missingFields.push('Pain Level');
        if (todayLog.sleepHours === null) missingFields.push('Sleep Hours');

        if (missingFields.length === 0) {
            botReply = "Thank you! I have recorded all your health updates for today.";
        } else {
            botReply = `Got it! I recorded the details you mentioned. Could you also tell me about: ${missingFields.join(', ')}?`;
        }

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

module.exports = router;
