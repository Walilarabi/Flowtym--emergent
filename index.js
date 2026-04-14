const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Route simple pour tester
app.get('/api/pms-app', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>FLOWTYM Test</title></head>
    <body style="background:#0f0f1a; color:#c6a43f; font-family:sans-serif; text-align:center; padding:50px;">
      <h1>🏨 FLOWTYM PMS</h1>
      <p>Le serveur fonctionne correctement !</p>
      <p>Route /api/pms-app active ✓</p>
      <hr>
      <small>Si vous voyez ce message, le problème vient du chemin vers plan3d.html</small>
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
