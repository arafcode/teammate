
const User = require('./src/models/userModel');
const db = require('./src/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar';

async function testControllerLogic() {
    try {
        const email = 'testfull' + Date.now() + '@example.com';
        const password = 'password123';
        const username = 'TestFull_' + Date.now();

        console.log('1. Checking existing user...');
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            console.error('User exists (unexpected)');
            process.exit(1);
        }

        console.log('2. Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        console.log('3. Creating user...');
        const userId = await User.create({
            username,
            email,
            password_hash,
            city: undefined,
            gender: undefined,
            birth_date: undefined
        });
        console.log('User created, ID:', userId);

        console.log('4. Signing JWT...');
        const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
        console.log('Token generated:', token ? 'YES' : 'NO');

        console.log('SUCCESS: Full flow passed.');
        process.exit(0);

    } catch (e) {
        console.error('FAILURE at step:', e);
        process.exit(1);
    }
}

testControllerLogic();
