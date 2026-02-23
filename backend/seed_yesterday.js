const mongoose = require('mongoose');
require('dotenv').config();
const DailyHealthLog = require('./models/DailyHealthLog');

const testMotherId = "650c1f1e1c9d440000a1b2c3"; // The mock ID used in chat.js

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    // 1. Clear out ANY logs for this test mother to start fresh
    await DailyHealthLog.deleteMany({ motherId: testMotherId });

    // 2. Create a log for YESTERDAY with severe symptoms
    const startOfYesterday = new Date();
    startOfYesterday.setHours(0, 0, 0, 0);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // Set it to noon yesterday
    const testDate = new Date(startOfYesterday);
    testDate.setHours(12);

    const yesterdayLog = new DailyHealthLog({
        motherId: testMotherId,
        date: testDate,
        systolicBP: 120,
        diastolicBP: 80,
        bleedingLevel: "heavy", // High Risk!
        fever: false,
        pain: "severe", // High Risk!
        sleepHours: 5,
        moodScore: 3,
        moodCategory: "In Pain"
    });

    await yesterdayLog.save();
    console.log("✅ Seeded severe yesterday log:", yesterdayLog);

    process.exit(0);
});
