const mongoose = require('mongoose');

const dailyHealthLogSchema = new mongoose.Schema({
    motherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mother',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    systolicBP: {
        type: Number,
        default: null
    },
    diastolicBP: {
        type: Number,
        default: null
    },
    bleedingLevel: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'heavy', null],
        default: null
    },
    fever: {
        type: Boolean,
        default: null
    },
    pain: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'severe', null],
        default: null
    },
    sleepHours: {
        type: Number,
        default: null
    },
    moodScore: {
        type: Number,  // 1-10 scale
        default: null
    },
    moodCategory: {
        type: String,
        default: null
    },
    localId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple nulls for older records
    },
    syncStatus: {
        type: String,
        default: 'synced'
    }
}, { timestamps: true });

// Optional: Ensure one log per day per mother for structured tracking
dailyHealthLogSchema.index({ motherId: 1, date: 1 }, { unique: false });

module.exports = mongoose.model('DailyHealthLog', dailyHealthLogSchema);
