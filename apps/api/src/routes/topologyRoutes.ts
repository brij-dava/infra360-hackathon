import { Router, Response } from 'express';
import { TopologyService } from '../services/topologyService';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/topology
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const graph = TopologyService.getTopologyGraph();
  res.json(graph);
});

// GET /api/topology/blast-radius/:assetTag
router.get('/blast-radius/:assetTag', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const blast = TopologyService.getBlastRadius(req.params.assetTag);
  if (!blast) {
    return res.status(404).json({ error: `Asset ${req.params.assetTag} not found` });
  }
  res.json({ blastRadius: blast });
});

// POST /api/topology/relationships
router.post(
  '/relationships',
  authMiddleware,
  requireRole('ADMIN', 'IT_MANAGER', 'INFRA_ENGINEER'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const rel = TopologyService.addRelationship(req.body, req.user!);
      res.status(201).json({ relationship: rel });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
