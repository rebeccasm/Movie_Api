const http = require('http'),
    fs = require('fs'),
    url = require('url'),
    path = require('path');	// Add the path module

http.createServer((request, response) => {
    let addr = request.url,
        q = new URL(addr, 'http://' + request.headers.host),
        filePath = '';

    // Log the request
    fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Added to log.');
        }
    });

    // Parse request.url to check if it contains "documentation"
    if (q.pathname.includes('documentation')) {
        filePath = path.join(__dirname, '/documentation.html');
    } else {
        filePath = ('index.html');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            throw err;
        }
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write(data);
        response.end();
    });
}).listen(8080);

console.log('Server running at http://localhost:8080/');