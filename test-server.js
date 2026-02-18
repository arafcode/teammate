
const express = require('express');
const authRoutes = require('./src/routes/authRoutes');
const listingRoutes = require('./src/routes/listingRoutes');
const http = require('http');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

const PORT = 3003; // Using 3003 to be safe

// Promisified http request
function makeRequest(path, method, data, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);

    try {
        // 1. Register
        const testUser = {
            username: 'TestHttp_' + Date.now(),
            email: 'testhttp' + Date.now() + '@example.com',
            password: 'password123'
        };

        console.log('1. Registering...');
        let res = await makeRequest('/api/auth/register', 'POST', JSON.stringify(testUser));

        if (res.status !== 201) throw new Error(`Registration failed: ${res.status} ${JSON.stringify(res.body)}`);
        const token = res.body.token;
        console.log('   Registered.');

        // 2. Create Listing
        const listingData = {
            title: 'Date Test ' + new Date().toISOString(),
            description: 'Testing date fix',
            category_slug: 'virtual',
            subcategory: 'Diğer',
            activity_date: new Date().toISOString(),
            duration: 60,
            max_participants: 5
        };

        console.log('2. Creating Listing...');
        res = await makeRequest('/api/listings', 'POST', JSON.stringify(listingData), token);

        if (res.status !== 201) throw new Error(`Listing creation failed: ${res.status} ${JSON.stringify(res.body)}`);
        const listingId = res.body.listingId;
        console.log('   Listing created. ID:', listingId);

        // 3. Verify
        console.log('3. Fetching Listings...');
        res = await makeRequest('/api/listings', 'GET');
        const listings = res.body;

        const found = listings.find(l => l.id === listingId);
        if (!found) throw new Error('Listing not found');

        console.log('   Listing Expiry:', found.expiry_date);

        const expiry = new Date(found.expiry_date);
        const now = new Date();
        const diffMinutes = (expiry - now) / 60000;

        console.log(`   Time until expiry: ${diffMinutes.toFixed(2)} minutes`);

        if (diffMinutes > 50 && diffMinutes < 70) {
            console.log('[SUCCESS] Expiry is correct (approx 60 mins).');
        } else {
            console.log('[FAIL] Expiry time is incorrect.');
        }

    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        server.close();
        process.exit(0);
    }
});
