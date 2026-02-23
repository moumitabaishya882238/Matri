export const calculateDailyRisk = (log) => {
    let risk = 'Green'; // Default

    // Physical Risk Logic
    if (log.bp_systolic >= 140 || log.bp_diastolic >= 90 || log.fever === 'yes' || log.bleeding === 'heavy') {
        risk = 'Red';
    } else if (log.bp_systolic >= 130 || log.bp_diastolic >= 85 || log.bleeding === 'moderate' || log.pain >= 7) {
        if (risk !== 'Red') risk = 'Orange';
    }

    // Emotional Risk Logic
    if (log.mood_score <= 3) {
        if (risk !== 'Red') risk = 'Orange';
    }

    return risk;
};
