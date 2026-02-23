const mongoose = require('mongoose');
const DailyHealthLog = require('./models/DailyHealthLog');
require('dotenv').config();

const MOCK_MOTHER_ID = '650c1f1e1c9d440000a1b2c3';

async function triggerDistressMode() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Update today's log to simulate a bad mood
        const result = await DailyHealthLog.updateOne(
            { motherId: MOCK_MOTHER_ID, date: { $gte: startOfDay } },
            { $set: { moodScore: 3, moodCategory: 'Anxious' } },
            { upsert: true }
        );

        console.log('Distress mode triggered! Today\'s mood score set to 3/10.');

    } catch (error) {
        console.error('Error triggering distress:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

triggerDistressMode();
