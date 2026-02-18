const http = require('http');

http.get('http://localhost:3000/api/listings', (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('API Status Code:', resp.statusCode);
            console.log('Number of listings:', json.length);
            if (json.length > 0) {
                console.log('First listing sample:', JSON.stringify(json[0], null, 2));
            } else {
                console.log('Response Body:', data);
            }
        } catch (e) {
            console.log('Error parsing JSON:', e.message);
            console.log('Raw Data:', data);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
