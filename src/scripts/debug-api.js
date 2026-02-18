
const http = require('http');

function inspectApi() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/listings',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            try {
                const listings = JSON.parse(body);
                if (listings.length > 0) {
                    const l = listings[0];
                    console.log('CREATED_AT_RAW: "' + l.created_at + '"');
                    console.log('EXPIRY_DATE_RAW: "' + l.expiry_date + '"');
                } else {
                    console.log('No listings found.');
                }
            } catch (e) {
                console.error('Parse error:', e);
            }
        });
    });
    req.end();
}

inspectApi();
