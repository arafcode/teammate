
const fs = require('fs');

try {
    const data = fs.readFileSync('debug_output.txt', 'utf8'); // or 'utf16le' if needed
    // If it's utf16le, fs.readFileSync with utf8 will produce garbage. 
    // Let's try to detect BOM or just read as buffer and convert.
    let content = data;
    if (data.charCodeAt(0) === 0xFFFD) { // Replacement char
        content = fs.readFileSync('debug_output.txt', 'utf16le');
    }
    console.log(content);
} catch (e) {
    // try utf16le directly
    try {
        const data = fs.readFileSync('debug_output.txt', 'utf16le');
        console.log(data);
    } catch (e2) {
        console.error(e2);
    }
}
