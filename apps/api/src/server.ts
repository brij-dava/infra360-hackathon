import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { db } from './storage/db';
import { generateSeedData, SEED_USERS } from './seed/seedData';

// Route imports
import authRoutes from './routes/authRoutes';
import assetRoutes from './routes/assetRoutes';
import topologyRoutes from './routes/topologyRoutes';
import discoveryRoutes from './routes/discoveryRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import predictiveRoutes from './routes/predictiveRoutes';
import aiRoutes from './routes/aiRoutes';
import auditRoutes from './routes/auditRoutes';

const app = express();

// Security & Utility Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auto-seed in-memory / persistent database if empty
function initializeSeed() {
  if (!db.isAlreadySeeded()) {
    console.log('[INFRA360 SEED] Seeding users and initial dataset...');
    db.users.insertMany(SEED_USERS);

    const { assets, relationships, maintenance, discovery, audit } = generateSeedData();
    db.assets.insertMany(assets);
    db.relationships.insertMany(relationships);
    db.maintenance.insertMany(maintenance);
    db.discovery.insertMany(discovery);
    db.audit.insertMany(audit);
    db.markSeeded();

    console.log(
      `[INFRA360 SEED] Successfully loaded: ${assets.length} assets, ${relationships.length} relationships, ${maintenance.length} maintenance records, ${discovery.length} shadow devices, ${SEED_USERS.length} user personas.`
    );
  }
}

initializeSeed();

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'INFRA360 Enterprise API Gateway',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      status: 'CONNECTED',
      totalAssets: db.assets.count(),
      totalRelationships: db.relationships.count(),
      totalMaintenanceTickets: db.maintenance.count(),
      totalShadowDevices: db.discovery.count(),
      totalAuditLogs: db.audit.count(),
    },
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/topology', topologyRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/predictive', predictiveRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audit', auditRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 INFRA360 Enterprise API Gateway Online`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`🩺 Health: http://localhost:${config.port}/api/health`);
    console.log(`=======================================================`);
  });
}

export default app;
