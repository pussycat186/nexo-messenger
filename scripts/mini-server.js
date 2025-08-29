const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const distPath = path.join(__dirname, '..', 'dist');
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(express.static(distPath));
app.listen(port, () => console.log(`[mini-server] listening on ${port}, dist=${distPath}`));