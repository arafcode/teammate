
const User = require('./src/models/userModel');
const db = require('./src/config/db');

async function testUserCreate() {
    try {
        const username = 'TestDirect_' + Date.now();
        const email = 'testdirect' + Date.now() + '@example.com';
        const password_hash = 'hash123';

        console.log('Creating user directly via Model...');
        const id = await User.create({
            username,
            email,
            password_hash,
            // undefined optional fields
        });
        console.log('User created successfully. ID:', id);
        process.exit(0);
    } catch (e) {
        console.error('User creation failed:', e);
        process.exit(1);
    }
}

testUserCreate();
