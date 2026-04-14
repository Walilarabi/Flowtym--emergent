const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Cherche plan3d.html dans tout le projet
function findPlan3d() {
  const searchPaths = [
    path.join(__dirname, 'flowtym-pms', 'flowtym-repo', 'plan3d.html'),
    path.join(__dirname, 'flowtysm-pms', 'flowtysm-repo', 'plan3d.html'),
    path.join(__dirname, 'plan3d.html'),
    path.join(__dirname, 'public', 'plan3d.html')
  ];
  for (const p of searchPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const plan3dPath = findPlan3d();
console.log('📄 plan3d.html trouvé ?', plan3dPath);

app.get('/api/pms-app', (req, res) => {
  if (plan3dPath && fs.existsSync(plan3dPath)) {
    res.sendFile(plan3dPath);
  } else {
    res.status(404).send('plan3d.html non trouvé. Vérifie les logs.');
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'FLOWTYM API running' });
});

app.listen(port, () => console.log(`✅ Serveur sur port ${port}`));
