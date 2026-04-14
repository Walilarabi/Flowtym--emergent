const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Chemin vers plan3d.html (depuis la racine)
const plan3dPath = path.join(__dirname, 'flowtym-pms', 'flowtym-repo', 'plan3d.html');

console.log('📁 __dirname :', __dirname);
console.log('📄 plan3d.html path :', plan3dPath);

app.get('/api/pms-app', (req, res) => {
  res.sendFile(plan3dPath, (err) => {
    if (err) {
      console.error('❌ Erreur envoi fichier:', err);
      res.status(404).send('Fichier plan3d.html non trouvé');
    }
  });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'FLOWTYM API running 🚀' });
});

app.listen(port, () => {
  console.log(`✅ Serveur démarré sur le port ${port}`);
});
