const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = process.env.PORT || 3000;
const root = __dirname;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text, contentType = 'text/plain') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(text);
}

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  return types[ext] || 'application/octet-stream';
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendText(res, 404, 'Not Found');
      return;
    }
    sendText(res, 200, data.toString('utf8'), getMime(filePath));
  });
}

async function callLLM(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return 'LLM is not configured yet. Please set OPENAI_API_KEY in the environment.';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are Coach Mia, a playful, kid-friendly math instructor for grades 9-12 algebra. Be encouraging, clear, and concise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I could not get a response from the model.';
  } catch (error) {
    return `Sorry, I hit an issue connecting to the LLM: ${error.message}`;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'POST' && pathname === '/api/chat') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body);
        const reply = await callLLM(message);
        sendJson(res, 200, { reply });
      } catch (error) {
        sendJson(res, 400, { error: 'Invalid request body' });
      }
    });
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(port, () => {
  console.log(`Math chatbot server running on http://localhost:${port}`);
});
