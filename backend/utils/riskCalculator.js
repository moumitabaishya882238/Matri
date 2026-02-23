// Phase 6/9: Automated Intelligent Risk Scoring Logic
const calculateDailyRisk = (log) => {
    let risk = 'Green'; // Default

    // Physical Risk Logic
    if (log.systolicBP >= 140 || log.diastolicBP >= 90 || log.fever || log.bleedingLevel === 'heavy') {
        risk = 'Red';
    } else if (log.systolicBP >= 130 || log.diastolicBP >= 85 || log.bleedingLevel === 'moderate' || log.pain === 'severe') {
        if (risk !== 'Red') risk = 'Orange';
    }

    // Emotional Risk Logic (Simplified pattern-based)
    if (log.moodScore <= 3 || log.moodCategory === 'Depressed' || log.moodCategory === 'Anxious') {
        if (risk !== 'Red') risk = 'Orange';
    }

    return risk;
};

module.exports = { calculateDailyRisk };
