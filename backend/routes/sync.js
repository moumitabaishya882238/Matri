const express = require('express');
const router = express.Router();
const DailyHealthLog = require('../models/DailyHealthLog');

// Require valid session
const requireLogin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized: Please log in with Google.' });
    }
    next();
};

// @route   POST /sync/batch
// @desc    Sync multiple pending offline logs from the React Native app
router.post('/batch', requireLogin, async (req, res) => {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs)) {
        return res.status(400).json({ error: 'Array of pending logs is required' });
    }

    try {
        const bulkOperations = logs.map(log => {
            const updatePayload = {
                motherId: req.user._id,
                date: log.date || new Date(),
                systolicBP: log.bp_systolic,
                diastolicBP: log.bp_diastolic,
                bleedingLevel: log.bleeding,
                fever: log.fever === 'yes',
                pain: log.pain,
                sleepHours: log.sleep_hours,
                moodScore: log.mood_score,
                moodCategory: log.mood_category,
                localId: log.localId,
                syncStatus: 'synced'
            };

            // Remove undefined or null attributes so we don't overwrite valid partials with nulls
            Object.keys(updatePayload).forEach(key => {
                if (updatePayload[key] === undefined) {
                    delete updatePayload[key];
                }
            });

            return {
                updateOne: {
                    // Match uniquely by the UUID generated on the client's phone to prevent duplicate rows on network retries
                    filter: { motherId: req.user._id, localId: log.localId },
                    update: { $set: updatePayload },
                    upsert: true
                }
            };
        });

        if (bulkOperations.length > 0) {
            await DailyHealthLog.bulkWrite(bulkOperations);
        }

        res.json({ success: true, message: `Successfully synchronized ${logs.length} offline records.` });

    } catch (error) {
        console.error("Batch Synchronization Error:", error);
        res.status(500).json({ error: 'Batch remote synchronization failed', details: error.message });
    }
});

module.exports = router;
