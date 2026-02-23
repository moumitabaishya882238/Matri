const express = require('express');
const router = express.Router();
const DailyHealthLog = require('../models/DailyHealthLog');
const Mother = require('../models/Mother');
const { calculateDailyRisk } = require('../utils/riskCalculator');

// Mock middleware (from chat.js)
const requireLogin = (req, res, next) => {
    if (!req.user) {
        req.user = { _id: "650c1f1e1c9d440000a1b2c3" };
    }
    next();
};

// @route   GET /mother/dashboard
// @desc    Get aggregated health logs and the current computed risk for the Home Dashboard
router.get('/dashboard', requireLogin, async (req, res) => {
    try {
        const motherId = req.user._id;

        // Fetch logs for the past 7 days, sorted oldest to newest (for charts)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentLogs = await DailyHealthLog.find({
            motherId: motherId,
            date: { $gte: sevenDaysAgo }
        }).sort({ date: 1 }); // 1 for ascending (oldest first)

        // Find today's specific log
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayLog = await DailyHealthLog.findOne({
            motherId: motherId,
            date: { $gte: startOfDay }
        });

        const motherProfile = await Mother.findById(motherId).select('name postpartumDay');

        // Calculate latest risk based on today (or yesterday if she hasn't logged today yet)
        const latestAvailableLog = todayLog || (recentLogs.length > 0 ? recentLogs[recentLogs.length - 1] : null);
        const currentRisk = latestAvailableLog ? calculateDailyRisk(latestAvailableLog) : 'Green';

        // Also update the mother's overarching currentRiskColor in the DB
        if (motherProfile) {
            motherProfile.currentRiskColor = currentRisk;
            await motherProfile.save();
        }

        res.json({
            mother: motherProfile,
            currentRisk: currentRisk,
            latestLog: latestAvailableLog,
            historicalLogs: recentLogs
        });

    } catch (error) {
        console.error("Dashboard endpoint error:", error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = router;
