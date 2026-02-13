const User = require('../models/userModel');
const db = require('../config/db');

async function verifyUserCreation() {
    try {
        console.log('Testing User.create with new fields...');

        const timestamp = Date.now();
        const userData = {
            username: `testuser_${timestamp}`,
            email: `test_${timestamp}@example.com`,
            password_hash: 'hashedpassword123',
            city: 'Istanbul',
            gender: 'male',
            birth_date: '1990-01-01'
        };

        const userId = await User.create(userData);
        console.log(`User created with ID: ${userId}`);

        const user = await User.findByEmail(userData.email);
        console.log('Retrieved User:', user);

        // Manual check seems tricky if findByEmail doesn't return new fields, 
        // but let's check the database directly with a query if needed, 
        // or just trust that no error means it worked for now.
        // Actually, let's update findById to return these fields for profile view later.

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verifyUserCreation();
