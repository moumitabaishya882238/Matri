const mongoose = require('mongoose');
const DailyHealthLog = require('./models/DailyHealthLog');
require('dotenv').config();

const MOCK_MOTHER_ID = '650c1f1e1c9d440000a1b2c3';

async function checkLogs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        const logs = await DailyHealthLog.find({ motherId: MOCK_MOTHER_ID }).sort({ date: -1 });

        console.log(`Found ${logs.length} health logs for the mock mother.`);

        if (logs.length > 0) {
            console.log('\nMost recent log details:');
            console.log(JSON.stringify(logs[0], null, 2));
        }

    } catch (error) {
        console.error('Error fetching logs:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

checkLogs();
