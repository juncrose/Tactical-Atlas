const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');
const DIST_INDEX = path.join(ROOT, 'dist/index.html');

// Check for --share flag
if (process.argv.includes('--share')) {
  console.log('🚀 [Dev Server] --share option detected. Launching Gradio sharing server via app.py...');
  const child = spawn('python3', ['app.py'], { cwd: ROOT, stdio: 'inherit' });
  child.on('close', (code) => {
    process.exit(code || 0);
  });
} else {
  // Helper to run the build script
  function runBuild() {
    try {
      console.log('[Dev Server] Rebuilding...');
      execSync('node scripts/build.js', { cwd: ROOT, stdio: 'inherit' });
      console.log('[Dev Server] Rebuild successful.');
    } catch (err) {
      console.error('[Dev Server] Build failed:', err.message);
    }
  }

  // Ensure first build
  runBuild();

  const server = http.createServer((req, res) => {
    // Normalize URL
    let url = req.url.split('?')[0];
    if (url === '/' || url === '/index.html') {
      // Rebuild on page refresh to always serve the latest data
      runBuild();
      
      fs.readFile(DIST_INDEX, (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Build file not found or failed to load. Check console.');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    // Fallback to serving other static assets if any exist in the dist or root directories
    let filePath = path.join(ROOT, url);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // Not found
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  });

  function startServer(port) {
    server.listen(port, () => {
      console.log(`\n🚀 [Dev Server] Running at http://localhost:${port}`);
      console.log(`💡 Tip: Changing JSON files and refreshing the page will automatically rebuild the project.\n`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Dev Server] Port ${port} is in use, trying port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('[Dev Server] Server error:', err);
      }
    });
  }

  startServer(PORT);
}
