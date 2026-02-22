const express = require('express');
const router = express.Router();
const Mother = require('../models/Mother');

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'You must log in!' });
    }
    next();
};

// @route   PUT /mother/setup
// @desc    Update initial information (hospital ID, delivery date)
router.put('/setup', requireLogin, async (req, res) => {
    const { hospitalId, deliveryDate } = req.body;

    try {
        const mother = await Mother.findById(req.user._id);

        if (!mother) {
            return res.status(404).json({ error: 'Mother not found' });
        }

        mother.hospitalId = hospitalId || mother.hospitalId;
        if (deliveryDate) {
            mother.deliveryDate = new Date(deliveryDate);

            // Calculate postpartum day
            const today = new Date();
            const diffTime = Math.abs(today - mother.deliveryDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            mother.postpartumDay = diffDays;
        }

        await mother.save();
        res.json(mother);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /mother/info
// @desc    Get mother dashboard info
router.get('/info', requireLogin, async (req, res) => {
    try {
        const mother = await Mother.findById(req.user._id);

        // Update postpartum day if delivery date exists
        if (mother.deliveryDate) {
            const today = new Date();
            const diffTime = Math.abs(today - mother.deliveryDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            mother.postpartumDay = diffDays;
            await mother.save();
        }

        res.json(mother);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
