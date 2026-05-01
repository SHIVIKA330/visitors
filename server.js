const http = require('http');
const fs = require('fs');
const os = require('os');

const LOG = 'visitors.log';

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/updateUser') {
    fs.appendFile(LOG, `Visitor at: ${new Date().toISOString()}\n`, err => {
      res.end(err ? 'Error writing log' : 'Visitor logged');
    });

  } else if (method === 'GET' && url === '/saveLog') {
    fs.readFile(LOG, 'utf8', (err, data) => {
      res.end(err ? 'Error reading log' : data || '(empty)');
    });

  } else if (method === 'POST' && url === '/backup') {
    fs.copyFile(LOG, 'backup.log', err => {
      res.end(err ? 'Backup failed' : 'Backup created');
    });

  } else if (method === 'GET' && url === '/clearLog') {
    fs.writeFile(LOG, '', err => {
      res.end(err ? 'Error clearing log' : 'Log cleared');
    });

  } else if (method === 'GET' && url === '/serverInfo') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      cpus: os.cpus().length,
      hostname: os.hostname(),
    }, null, 2));

  } else {
    res.statusCode = 404;
    res.end('Route not found');
  }
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
