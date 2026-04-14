const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// ═════════════════════════════════════════════════════════════════
// 1. CONFIGURATION CORS (pour que flowtym.com puisse appeler l'API)
// ═════════════════════════════════════════════════════════════════
app.use(cors({
  origin: [
    'https://flowtym.com',
    'https://www.flowtym.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://api.flowtym.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Réponse immédiate pour les requêtes OPTIONS (preflight)
app.options('*', cors());

// ═════════════════════════════════════════════════════════════════
// 2. MIDDLEWARES
// ═════════════════════════════════════════════════════════════════
app.use(express.json()); // Pour parser le JSON
app.use(express.urlencoded({ extended: true }));

// ═════════════════════════════════════════════════════════════════
// 3. CHEMINS VERS LES FICHIERS STATIQUES
// ═════════════════════════════════════════════════════════════════

// Chemin vers plan3d.html (depuis la racine)
const plan3dPath = path.join(__dirname, 'flowtym-pms', 'flowtym-repo', 'plan3d.html');
const altPlan3dPath = path.join(__dirname, 'flowtysm-pms', 'flowtysm-repo', 'plan3d.html');

// Vérifier quel chemin fonctionne
const fs = require('fs');
let activePlan3dPath = null;
if (fs.existsSync(plan3dPath)) {
  activePlan3dPath = plan3dPath;
  console.log('✅ plan3d.html trouvé :', plan3dPath);
} else if (fs.existsSync(altPlan3dPath)) {
  activePlan3dPath = altPlan3dPath;
  console.log('✅ plan3d.html trouvé :', altPlan3dPath);
} else {
  console.error('❌ plan3d.html NON TROUVÉ !');
  console.log('📁 Contenu de __dirname :', fs.readdirSync(__dirname));
}

// Servir les fichiers statiques du dossier contenant plan3d.html
if (activePlan3dPath) {
  const staticDir = path.dirname(activePlan3dPath);
  app.use(express.static(staticDir));
  console.log('📁 Dossier statique :', staticDir);
}

// ═════════════════════════════════════════════════════════════════
// 4. ROUTES API
// ═════════════════════════════════════════════════════════════════

// Route principale du PMS (plan 3D)
app.get('/api/pms-app', (req, res) => {
  if (activePlan3dPath && fs.existsSync(activePlan3dPath)) {
    res.sendFile(activePlan3dPath);
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head><title>FLOWTYM - Configuration</title></head>
      <body style="background:#0f0f1a; color:#c6a43f; font-family:sans-serif; text-align:center; padding:50px;">
        <h1>🏨 FLOWTYM</h1>
        <p>Le fichier plan3d.html n'a pas été trouvé.</p>
        <p>Vérifie la structure de ton dépôt GitHub.</p>
        <hr>
        <small>Chemin recherché : ${plan3dPath}</small>
      </body>
      </html>
    `);
  }
});

// Route pour les notifications (API support)
app.get('/api/support/hotels/:hotelId/notifications', (req, res) => {
  const { hotelId } = req.params;
  console.log(`📬 Notifications demandées pour l'hôtel: ${hotelId}`);
  
  res.json({
    success: true,
    data: {
      notifications: [
        {
          id: 1,
          title: "Bienvenue sur FLOWTYM",
          message: "Votre PMS est opérationnel",
          type: "info",
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: "Réservations",
          message: "3 nouvelles réservations aujourd'hui",
          type: "alert",
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          title: "Check-out",
          message: "5 départs prévus aujourd'hui",
          type: "warning",
          read: false,
          createdAt: new Date().toISOString()
        }
      ],
      unreadCount: 3
    }
  });
});

// Route pour les statistiques du dashboard
app.get('/api/dashboard/stats/:hotelId', (req, res) => {
  res.json({
    success: true,
    data: {
      occupation: 68,
      adr: 245,
      revpar: 166,
      ca_jour: 12450,
      arrivals: 12,
      departures: 8
    }
  });
});

// Route racine (API status)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'FLOWTYM API is running 🚀',
    version: '1.0.0',
    endpoints: [
      '/api/pms-app',
      '/api/support/hotels/:hotelId/notifications',
      '/api/dashboard/stats/:hotelId'
    ],
    timestamp: new Date().toISOString()
  });
});

// Route catch-all pour les routes non trouvées (404)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// ═════════════════════════════════════════════════════════════════
// 5. DÉMARRAGE DU SERVEUR
// ═════════════════════════════════════════════════════════════════
app.listen(port, () => {
  console.log(`\n🚀 FLOWTYM API démarrée sur le port ${port}`);
  console.log(`📍 URL: http://localhost:${port}`);
  console.log(`📁 Répertoire racine: ${__dirname}`);
  console.log(`📄 Plan 3D: ${activePlan3dPath || 'NON TROUVÉ'}`);
  console.log(`\n✨ Endpoints disponibles:`);
  console.log(`   ➜ GET  /`);
  console.log(`   ➜ GET  /api/pms-app`);
  console.log(`   ➜ GET  /api/support/hotels/:hotelId/notifications`);
  console.log(`   ➜ GET  /api/dashboard/stats/:hotelId`);
});
