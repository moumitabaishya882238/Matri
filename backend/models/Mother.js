const mongoose = require('mongoose');

const motherSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    hospitalId: {
        type: String,
        default: null
    },
    deliveryDate: {
        type: Date,
        default: null
    },
    postpartumDay: {
        type: Number,
        default: 0
    },
    currentRiskColor: {
        type: String,
        enum: ['Green', 'Orange', 'Red'],
        default: 'Green'
    },
    lastSync: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Mother', motherSchema);
