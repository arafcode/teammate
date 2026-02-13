const http = require('http');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

function request(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- API Verification Tests ---');

    // 1. Health Check
    console.log('\n[TEST 1] Health Check');
    const health = await request('GET', '/health');
    console.log('Status:', health.status, 'Response:', health.body);

    // 2. Register
    console.log('\n[TEST 2] Register User');
    const uniqueName = 'user_' + Math.floor(Math.random() * 10000);
    const register = await request('POST', '/auth/register', {
        username: uniqueName,
        email: `${uniqueName}@example.com`,
        password: 'password123'
    });
    console.log('Status:', register.status, 'Response:', register.body);

    if (register.status === 201) {
        authToken = register.body.token;
    } else {
        // Try login if user exists
        console.log('User might exist, trying login...');
        const login = await request('POST', '/auth/login', {
            email: `${uniqueName}@example.com`,
            password: 'password123'
        });
        if (login.status === 200) authToken = login.body.token;
    }

    if (!authToken) {
        console.error('Authentication failed, skipping protected tests.');
        return;
    }

    // 3. Create Listing
    console.log('\n[TEST 3] Create Listing');
    const listing = await request('POST', '/listings', {
        category_slug: 'virtual',
        title: 'Test Listing for LoL',
        description: 'Need a support player for ranked.',
        activity_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 86400000).toISOString(),
        max_participants: 1
    }, { 'Authorization': `Bearer ${authToken}` });
    console.log('Status:', listing.status, 'Response:', listing.body);

    // 4. Get Listings
    console.log('\n[TEST 4] Get All Listings');
    const listings = await request('GET', '/listings');
    console.log('Status:', listings.status);
    if (listings.status === 200 && Array.isArray(listings.body)) {
        console.log(`Retrieved ${listings.body.length} listings.`);
        if (listings.body.length > 0) {
            console.log('First listing:', listings.body[0].title);
        }
    } else {
        console.log('Response:', listings.body);
    }
}

runTests().catch(console.error);
