const { spawn } = require('child_process');
const path = require('path');

const binPath = path.resolve(__dirname, 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');

const search = (query, platform = 'youtube', limit = 10) => {
  return new Promise((resolve, reject) => {
    const prefix = platform === 'soundcloud' ? 'scsearch' : 'ytsearch';
    const searchTerm = `${prefix}${limit}:${query}`;
    
    const args = [
      searchTerm,
      '--dump-json',
      '--flat-playlist',
      '--no-playlist'
    ];

    const child = spawn(binPath, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data;
    });

    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`Search error (code ${code}): ${stderr}`);
        return reject(new Error(stderr));
      }

      try {
        // Output can be multiple JSON objects separated by newlines
        const results = stdout.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const item = JSON.parse(line);
            return {
              id: item.id,
              title: item.title,
              uploader: item.uploader || item.uploader_id,
              duration: item.duration,
              thumbnail: item.thumbnail || (item.thumbnails && item.thumbnails[0] ? item.thumbnails[0].url : null),
              url: item.webpage_url || item.url,
              platform: platform
            };
          });
        resolve(results);
      } catch (e) {
        console.error('Error parsing search results:', e);
        reject(e);
      }
    });
  });
};

const getAudioStream = (url, res) => {
  const args = [
    url,
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '-o', '-',
    '--no-playlist'
  ];

  const child = spawn(binPath, args);

  child.stdout.pipe(res);

  child.stderr.on('data', (data) => {
    // console.log(`yt-dlp stderr: ${data}`);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`yt-dlp process exited with code ${code}`);
    }
  });

  return child;
};

module.exports = { search, getAudioStream };
