const mongoose = require('mongoose');
require('dotenv').config();
const DailyHealthLog = require('./models/DailyHealthLog');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await DailyHealthLog.find({});
    console.log("ALL LOGS:", logs.length);
    console.log("TODAY LOGS:", await DailyHealthLog.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay } }));
    process.exit(0);
});
