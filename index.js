const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Servir les fichiers statiques du dossier flowtym-pms/flowtym-repo
app.use(express.static(path.join(__dirname, 'flowtym-pms', 'flowtym-repo')));

// Route pour afficher le plan 3D (page principale du PMS)
app.get('/api/pms-app', (req, res) => {
  res.sendFile(path.join(__dirname, 'flowtym-pms', 'flowtym-repo', 'plan3d.html'));
});

// Route racine (API status)
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'FLOWTYM API is running 🚀',
    endpoints: ['/api/pms-app', '/']
  });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`✅ FLOWTYM server running on port ${port}`);
});
