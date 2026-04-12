const express = require('express');
const cors = require('cors');
const path = require('path');
const { search, getAudioStream } = require('./yt-dlp-utils');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Sirve archivos estáticos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
  const { q, platform } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const results = await search(q, platform || 'youtube');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search' });
  }
});

app.get('/api/download', (req, res) => {
  const { url, title } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const filename = title ? `${title}.mp3` : 'audio.mp3';
  
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

  const stream = getAudioStream(url, res);

  // Handle client disconnection
  req.on('close', () => {
    stream.kill();
  });
});

// Ruta comodín (fallback) para SPA (Angular). 
// Las rutas que no coincidan con la API devolverán la aplicación de Angular.
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html') && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
