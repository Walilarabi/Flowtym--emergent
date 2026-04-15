const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));

// Liste tous les fichiers du dossier pour debug
console.log('📁 Contenu de /app :');
try {
  const files = fs.readdirSync('/app');
  console.log(files);
} catch(e) { console.log('Erreur lecture /app'); }

// Test simple
app.get('/api/pms-app', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>FLOWTYM Test</title></head>
    <body style="background:#0f0f1a; color:#c6a43f; font-family:sans-serif; text-align:center; padding:50px;">
      <h1>🏨 FLOWTYM PMS</h1>
      <p>Le serveur fonctionne correctement !</p>
      <p>Route /api/pms-app active ✓</p>
      <p>Heure actuelle : ${new Date().toLocaleString()}</p>
      <hr>
      <small>Si vous voyez ce message, le serveur répond bien.</small>
    </body>
    </html>
  `);
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'FLOWTYM API running' });
});

app.listen(port, () => {
  console.log(`✅ Serveur démarré sur le port ${port}`);
});
