const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Remonter d'un niveau pour accéder à flowtym-pms
const rootDir = path.join(__dirname, '..');

// Servir les fichiers statiques
app.use(express.static(path.join(rootDir, 'flowtym-pms', 'flowtym-repo')));

// Route pour le PMS
app.get('/api/pms-app', (req, res) => {
  res.sendFile(path.join(rootDir, 'flowtym-pms', 'flowtym-repo', 'plan3d.html'));
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'FLOWTYM API running' });
});

app.listen(port, () => {
  console.log(`✅ Server on port ${port}`);
  console.log(`📁 Path: ${path.join(rootDir, 'flowtym-pms', 'flowtym-repo', 'plan3d.html')}`);
});
