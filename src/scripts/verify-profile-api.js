const http = require('http');
const db = require('../config/db');
require('dotenv').config();

const API_PORT = 3000;
const API_HOST = 'localhost';
let user1Token, user1Id, user2Token, user2Id;

async function request(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : '';
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        console.error('Response Body:', responseData);
                        reject(new Error(`Status ${res.statusCode}: ${parsed.message || 'See body above'}`));
                    }
                } catch (e) {
                    console.error('Response Body (Raw):', responseData);
                    reject(new Error(`Failed to parse response: ${responseData}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (data) {
            req.write(data);
        }
        req.end();
    });
}

async function verifyProfileAPI() {
    try {
        console.log('--- Starting Profile API Verification (HTTP) ---');

        // 1. Setup Users
        const suffix = Date.now();
        console.log('Creating Test Users...');

        // User 1
        const user1 = await request('/auth/register', 'POST', {
            username: `prof_user1_${suffix}`,
            email: `prof1_${suffix}@test.com`,
            password: 'password123'
        });
        user1Token = user1.token;
        user1Id = user1.user.id;
        console.log('User 1 Created:', user1Id);

        // User 2
        const user2 = await request('/auth/register', 'POST', {
            username: `prof_user2_${suffix}`,
            email: `prof2_${suffix}@test.com`,
            password: 'password123'
        });
        user2Token = user2.token;
        user2Id = user2.user.id;
        console.log('User 2 Created:', user2Id);

        // 2. Update Profile
        console.log('Updating Profile (User 1)...');
        await request('/profile/update', 'PUT', {
            bio: 'I love gaming!',
            city: 'Istanbul',
            social_links: { discord: 'user1#1234' }
        }, user1Token);

        // 3. Add Interests
        console.log('Adding Interests (User 1)...');
        await request('/profile/interests', 'POST', {
            category: 'virtual',
            name: 'League of Legends',
            metadata: ['Mid', 'Support']
        }, user1Token);

        // 4. Add Comment
        console.log('User 2 commenting on User 1...');
        await request('/profile/comments', 'POST', {
            profile_username: `prof_user1_${suffix}`,
            content: 'Great teammate! Recommended.'
        }, user2Token);

        // 5. Get Profile
        console.log('Fetching User 1 Profile...');
        const profile = await request(`/profile/prof_user1_${suffix}`, 'GET');

        console.log('--- Profile Data Check ---');
        console.log('Bio:', profile.user.bio);
        const interests = profile.interests;
        const comments = profile.comments;

        if (profile.user.bio !== 'I love gaming!') throw new Error('Bio mismatch');
        if (interests[0].name !== 'League of Legends') throw new Error('Interest mismatch');
        if (comments[0].content !== 'Great teammate! Recommended.') throw new Error('Comment mismatch');

        console.log('--- Verification PASSED ---');
        process.exit(0);

    } catch (error) {
        console.error('--- Verification FAILED ---');
        console.error(error.message);
        process.exit(1);
    }
}

setTimeout(verifyProfileAPI, 2000);
