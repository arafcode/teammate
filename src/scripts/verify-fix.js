
const http = require('http');

// Configuration
const API_PORT = 3000; // Adjust if different
const API_URL = `http://localhost:${API_PORT}/api`;

// Utils for HTTP requests
const request = (method, path, data = null, token = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: API_PORT,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

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

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
};

async function verifyFix() {
    console.log('--- Starting Verification ---');

    // 1. Register/Login a test user
    const testUser = {
        username: 'VerifyBot_' + Math.floor(Math.random() * 10000),
        email: `verify_${Math.floor(Math.random() * 10000)}@test.com`,
        password: 'password123'
    };

    console.log('Registering test user...', testUser.username);
    const regRes = await request('POST', '/auth/register', testUser);

    let token;
    if (regRes.status === 201) {
        token = regRes.body.token;
        console.log('User registered successfully.');
    } else {
        console.log('Registration failed, trying login (if user exists)...', regRes.status);
        // Fallback login if needed, but random user should work
        return;
    }

    if (!token) {
        console.error('Failed to get token.');
        return;
    }

    // 2. Create a Listing
    const listingData = {
        title: 'Verification Listing ' + new Date().toISOString(),
        description: 'This is a test listing to verify date fixes.',
        category_slug: 'virtual',
        subcategory: 'Diğer',
        activity_date: new Date().toISOString(), // NOW
        duration: 60,
        max_participants: 5
    };

    console.log('Creating listing...', listingData.title);
    const createRes = await request('POST', '/listings', listingData, token);

    if (createRes.status !== 201) {
        console.error('Failed to create listing:', createRes.status, createRes.body);
        return;
    }

    console.log('Listing created.');

    // 3. Fetch Listings and Verify
    console.log('Fetching all listings...');
    const listRes = await request('GET', '/listings');

    if (listRes.status !== 200) {
        console.error('Failed to fetch listings:', listRes.status);
        return;
    }

    const listings = listRes.body;
    const found = listings.find(l => l.title === listingData.title);

    if (found) {
        console.log('\n[SUCCESS] Listing found in the response!');
        console.log('Listing Expiry Date (from DB):', found.expiry_date);

        // Parse as UTC since we enforce timezone: '+00:00'
        const expiryStr = found.expiry_date.replace(' ', 'T') + (found.expiry_date.endsWith('Z') ? '' : 'Z');
        const expiry = new Date(expiryStr);
        const now = new Date();

        console.log('Parsed Expiry (Local):', expiry.toString());
        console.log('Current Time (Local): ', now.toString());

        if (expiry > now) {
            console.log('[SUCCESS] Expiry date is in the future.');
        } else {
            console.error('[FAIL] Expiry date is in the PAST! Fix failed.');
        }
    } else {
        console.error('\n[FAIL] Listing NOT found in the response. It might have been filtered out by the backend query.');
    }
}

verifyFix().catch(console.error);
