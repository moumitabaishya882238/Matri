const mongoose = require('mongoose');
const Mother = require('./models/Mother');
require('dotenv').config();

const MOCK_MOTHER_ID = '650c1f1e1c9d440000a1b2c3';

async function seedMockMother() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        const existingMother = await Mother.findById(MOCK_MOTHER_ID);

        if (existingMother) {
            console.log('Mock mother already exists in the database.');
        } else {
            console.log('Creating mock mother...');
            const newMother = new Mother({
                _id: MOCK_MOTHER_ID,
                googleId: 'mock-google-id-123',
                email: 'mockmother@example.com',
                name: 'Mock Mother',
                hospitalId: 'HOSP-001',
                deliveryDate: new Date(),
                postpartumDay: 1,
                currentRiskColor: 'Green'
            });
            await newMother.save();
            console.log('Successfully created mock mother!');
        }
    } catch (error) {
        console.error('Error seeding mock mother:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seedMockMother();
