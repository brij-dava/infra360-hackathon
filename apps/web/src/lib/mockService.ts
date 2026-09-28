import {
  generateSeedData,
  SEED_USERS,
  calculateRepairVsReplace,
  traverseBlastRadius,
} from '@infra360/shared';
import { IAsset, IDiscoveredDevice, IMaintenanceRecord, IAuditLog, IUser } from '@infra360/types';

class MockDatabase {
  public users: IUser[] = [...SEED_USERS];
  public assets: IAsset[] = [];
  public relationships: any[] = [];
  public maintenance: IMaintenanceRecord[] = [];
  public discovery: IDiscoveredDevice[] = [];
  public audit: IAuditLog[] = [];
  private initialized = false;

  public init() {
    if (this.initialized) return;
    const seed = generateSeedData();
    this.assets = seed.assets;
    this.relationships = seed.relationships;
    this.maintenance = seed.maintenance;
    this.discovery = seed.discovery;
    this.audit = seed.audit;
    this.initialized = true;
  }
}

export const mockDb = new MockDatabase();
mockDb.init();

export class MockService {
  public static handle(endpoint: string, options: RequestInit = {}): any {
    mockDb.init();
    const method = (options.method || 'GET').toUpperCase();
    const [pathOnly, queryString] = endpoint.split('?');
    const params = new URLSearchParams(queryString || '');

    // 1. Auth Personas
    if (pathOnly === '/auth/personas') {
      return { users: mockDb.users };
    }

    // 2. Health
    if (pathOnly === '/health') {
      return {
        status: 'HEALTHY',
        service: 'INFRA360 Cloud Intelligent Client',
        timestamp: new Date().toISOString(),
        totalAssets: mockDb.assets.length,
      };
    }

    // 3. Dashboard Analytics
    if (pathOnly === '/analytics/dashboard') {
      return this.getDashboardKPIs();
    }

    // 4. Repair vs Replace
    if (pathOnly.startsWith('/analytics/repair-replace/')) {
      const tag = pathOnly.replace('/analytics/repair-replace/', '');
      const asset = mockDb.assets.find((a) => a.assetTag === tag);
      if (!asset) return { error: 'Asset not found' };
      const immediateEst = asset.status === 'DEGRADED' ? 3800 : asset.status === 'DEFECTIVE' ? 6500 : 1200;
      let failureProb = 0.20;
      if (asset.riskScore >= 75) failureProb = 0.73;
      else if (asset.riskScore >= 50) failureProb = 0.45;
      return { analysis: calculateRepairVsReplace(asset, immediateEst, failureProb) };
    }

    // 5. Assets list
    if (pathOnly === '/assets') {
      if (method === 'POST') {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const newAsset: IAsset = {
          ...body,
          id: body.assetTag || 'AST-GEN-' + Math.floor(100000 + Math.random() * 900000),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockDb.assets.unshift(newAsset);
        return { asset: newAsset };
      }

      const search = params.get('search')?.toLowerCase();
      const category = params.get('category');
      const status = params.get('status');
      const criticality = params.get('criticality');
      const skip = parseInt(params.get('skip') || '0', 10);
      const limit = parseInt(params.get('limit') || '25', 10);

      let list = [...mockDb.assets];
      if (search) {
        list = list.filter(
          (a) =>
            a.name.toLowerCase().includes(search) ||
            a.assetTag.toLowerCase().includes(search) ||
            a.serialNumber.toLowerCase().includes(search) ||
            a.ipAddress?.toLowerCase().includes(search)
        );
      }
      if (category && category !== 'ALL') {
        list = list.filter((a) => a.category === category);
      }
      if (status && status !== 'ALL') {
        list = list.filter((a) => a.status === status);
      }
      if (criticality && criticality !== 'ALL') {
        list = list.filter((a) => a.criticality === criticality);
      }

      const total = list.length;
      const paginated = list.slice(skip, skip + limit);
      return { assets: paginated, total, skip, limit };
    }

    // 6. Single Asset Detail
    if (pathOnly.startsWith('/assets/') && !pathOnly.includes('/lifecycle') && !pathOnly.includes('/qr')) {
      const tag = pathOnly.replace('/assets/', '');
      const asset = mockDb.assets.find((a) => a.assetTag === tag);
      if (!asset) return { error: 'Asset not found' };
      const rels = mockDb.relationships.filter((r) => r.sourceAssetTag === tag || r.targetAssetTag === tag);
      const maint = mockDb.maintenance.filter((m) => m.assetTag === tag);
      return {
        asset,
        relationships: rels,
        maintenance: maint,
        qrCodeDataUrl: 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"white\"/><path d=\"M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M50,45 h10 v10 h-10 z M65,65 h10 v10 h-10 z\" fill=\"black\"/><text x=\"50\" y=\"95\" font-size=\"6\" text-anchor=\"middle\" fill=\"#333\">' + tag + '</text></svg>',
      };
    }

    // 7. Asset QR
    if (pathOnly.startsWith('/assets/') && pathOnly.endsWith('/qr')) {
      const tag = pathOnly.replace('/assets/', '').replace('/qr', '');
      return {
        qrCodeDataUrl: 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"white\"/><path d=\"M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M50,45 h10 v10 h-10 z M65,65 h10 v10 h-10 z\" fill=\"black\"/><text x=\"50\" y=\"95\" font-size=\"6\" text-anchor=\"middle\" fill=\"#333\">' + tag + '</text></svg>',
        portalUrl: 'https://infra360.internal/scan/' + tag,
      };
    }

    // 8. Lifecycle transition
    if (pathOnly.endsWith('/lifecycle')) {
      const tag = pathOnly.split('/')[2];
      const asset = mockDb.assets.find((a) => a.assetTag === tag);
      const body = options.body ? JSON.parse(options.body as string) : {};
      if (asset) {
        asset.lifecycleStage = body.targetStage;
      }
      return { success: true, asset };
    }

    // 9. Topology
    if (pathOnly === '/topology') {
      const assetMap = new Map<string, IAsset>();
      mockDb.assets.forEach((a) => assetMap.set(a.assetTag, a));
      const tagsInGraph = new Set<string>();
      mockDb.relationships.forEach((r) => {
        tagsInGraph.add(r.sourceAssetTag);
        tagsInGraph.add(r.targetAssetTag);
      });
      if (tagsInGraph.size < 25) {
        mockDb.assets.slice(0, 30).forEach((a) => tagsInGraph.add(a.assetTag));
      }

      const nodes = Array.from(tagsInGraph).map((tag, idx) => {
        const asset = assetMap.get(tag);
        const col = idx % 5;
        const row = Math.floor(idx / 5);
        return {
          id: tag,
          type: 'assetNode',
          position: { x: col * 260 + 50, y: row * 180 + 50 },
          data: {
            assetTag: tag,
            name: asset ? asset.name : tag,
            category: asset ? asset.category : 'SERVER',
            status: asset ? asset.status : 'OPERATIONAL',
            healthScore: asset ? asset.healthScore : 100,
            riskScore: asset ? asset.riskScore : 0,
            criticality: asset ? asset.criticality : 'TIER_2_OPERATIONAL',
            ipAddress: asset?.ipAddress || '10.10.x.x',
            location: asset ? asset.location?.rack || 'Rack-01' : 'Datacenter',
          },
        };
      });

      const edges = mockDb.relationships.map((rel) => ({
        id: rel.id,
        source: rel.sourceAssetTag,
        target: rel.targetAssetTag,
        label: rel.relationshipType,
        animated: rel.relationshipType === 'CONNECTED_TO' || rel.relationshipType === 'SERVES',
      }));

      return { nodes, edges };
    }

    // 10. Blast Radius
    if (pathOnly.startsWith('/topology/blast-radius/')) {
      const tag = pathOnly.replace('/topology/blast-radius/', '');
      const assetMap = new Map<string, IAsset>();
      mockDb.assets.forEach((a) => assetMap.set(a.assetTag, a));
      const blast = traverseBlastRadius(tag, mockDb.relationships, assetMap);
      return { blastRadius: blast };
    }

    // 11. Discovery / Shadow IT
    if (pathOnly === '/discovery') {
      const status = params.get('status');
      let devices = [...mockDb.discovery];
      if (status && status !== 'ALL') {
        devices = devices.filter((d) => d.triageStatus === status);
      }
      return { devices };
    }

    // 12. Triage Device
    if (pathOnly.includes('/discovery/') && pathOnly.endsWith('/triage')) {
      const parts = pathOnly.split('/');
      const id = parts[2];
      const body = options.body ? JSON.parse(options.body as string) : {};
      const dev = mockDb.discovery.find((d) => d.id === id);
      if (dev) {
        if (body.action === 'APPROVE') dev.triageStatus = 'REGISTERED';
        if (body.action === 'QUARANTINE') dev.triageStatus = 'QUARANTINED';
        if (body.action === 'IGNORE') dev.triageStatus = 'DISMISSED';
      }
      return { success: true, device: dev };
    }

    // 13. Trigger scan
    if (pathOnly === '/discovery/scan') {
      return {
        message: 'Subnet scan initiated',
        subnet: '10.14.20.0/24',
        newDevicesDetected: 2,
      };
    }

    // 14. Maintenance
    if (pathOnly === '/maintenance') {
      if (method === 'POST') {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const newRecord: IMaintenanceRecord = {
          ...body,
          id: 'MNT-' + Math.floor(10000 + Math.random() * 90000),
          createdAt: new Date().toISOString(),
        };
        mockDb.maintenance.unshift(newRecord);
        return { maintenance: newRecord };
      }
      const tag = params.get('assetTag');
      let m = [...mockDb.maintenance];
      if (tag) m = m.filter((x) => x.assetTag === tag);
      return { maintenance: m };
    }

    // 15. Predictive
    if (pathOnly.startsWith('/predictive/fleet')) {
      const highRisk = mockDb.assets.filter((a) => a.riskScore >= 70).slice(0, 10);
      return { highRiskAssets: highRisk };
    }
    if (pathOnly.startsWith('/predictive/')) {
      const tag = pathOnly.replace('/predictive/', '');
      const asset = mockDb.assets.find((a) => a.assetTag === tag) || mockDb.assets[0];
      return {
        assetTag: asset.assetTag,
        assetName: asset.name,
        predictedFailureProbability90d: 0.82,
        recommendedAction: 'Schedule urgent preventive fan & PSU replacement',
        daysUntilLikelyFailure: 24,
      };
    }

    // 16. AI
    if (pathOnly === '/ai/query' || pathOnly === '/ai/chat') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const query = (body.query || body.prompt || '').toLowerCase();
      
      let answer = 'Based on the INFRA360 Enterprise Graph and active telemetry: The fleet comprises 500 managed physical and virtual assets across 4 global sites. Asset AST-SRV-000041 (Core ERP Primary Application & DB Server) exhibits elevated thermal degradation (79°C) and requires prioritized maintenance.';
      
      if (query.includes('risk') || query.includes('fail')) {
        answer = 'High-Risk Analysis: 38 assets currently have a Risk Score > 70. The primary driver is expired hardware warranties coupled with high downstream blast radius. Core server AST-SRV-000041 has a 90-day failure probability of 82%. Recommendation: Execute immediate preventive maintenance.';
      } else if (query.includes('shadow') || query.includes('rogue') || query.includes('discovery')) {
        answer = 'Shadow IT Telemetry: 13 unmanaged rogue devices were intercepted on subnet 10.14.20.0/24, including unauthorized Raspberry Pi relays and unverified IoT sensors. Recommend quarantining MAC b8:27:eb:41:9a:11 immediately.';
      } else if (query.includes('cost') || query.includes('budget') || query.includes('spend')) {
        answer = 'Financial Overview: Total fleet replacement asset value is ,940,000. Replacing asset AST-SRV-000041 yields an estimated Net Present Value savings of ,500 compared to perpetual reactive emergency repairs.';
      }

      return {
        answer,
        groundedAssets: mockDb.assets.slice(0, 5),
        confidence: 0.96,
      };
    }

    // 17. Audit
    if (pathOnly === '/audit') {
      return { logs: mockDb.audit };
    }

    // Fallback default
    return { status: 'OK', fallback: true };
  }

  private static getDashboardKPIs() {
    const assets = mockDb.assets;
    const discovery = mockDb.discovery;
    let healthyCount = 0;
    let highRiskCount = 0;
    let criticalCount = 0;
    let underMaintenanceCount = 0;
    let totalValue = 0;
    let totalReplacementValue = 0;
    let totalMaintenanceSpend = 0;
    let warrantyExpiredCount = 0;
    let warrantyExpiring30dCount = 0;
    let warrantyExpiring90dCount = 0;
    let warrantyValidCount = 0;
    const categoryMap: Record<string, number> = {};
    const locationMap: Record<string, number> = {};
    const lifecycleMap: Record<string, number> = {};
    const riskTiers = { low: 0, medium: 0, high: 0 };
    const now = new Date('2026-09-28T00:00:00Z').getTime();

    assets.forEach((a) => {
      if (a.healthScore >= 80) healthyCount++;
      if (a.riskScore >= 70) {
        highRiskCount++;
        riskTiers.high++;
      } else if (a.riskScore >= 36) {
        riskTiers.medium++;
      } else {
        riskTiers.low++;
      }
      if (a.criticality === 'TIER_1_CRITICAL') criticalCount++;
      if (a.status === 'MAINTENANCE' || a.lifecycleStage === 'MAINTENANCE') underMaintenanceCount++;
      totalValue += a.purchaseCost || 0;
      totalReplacementValue += a.replacementCostEstimate || ((a.purchaseCost || 5000) * 1.15);
      totalMaintenanceSpend += a.accumulatedMaintenanceCost || 0;
      categoryMap[a.category] = (categoryMap[a.category] || 0) + 1;
      const site = a.location?.siteName || 'Unassigned';
      locationMap[site] = (locationMap[site] || 0) + 1;
      lifecycleMap[a.lifecycleStage] = (lifecycleMap[a.lifecycleStage] || 0) + 1;

      if (a.warrantyEndDate) {
        const diffDays = Math.ceil((new Date(a.warrantyEndDate).getTime() - now) / (1000 * 3600 * 24));
        if (diffDays < 0) warrantyExpiredCount++;
        else if (diffDays <= 30) warrantyExpiring30dCount++;
        else if (diffDays <= 90) warrantyExpiring90dCount++;
        else warrantyValidCount++;
      }
    });

    const unknownDevicesCount = discovery.filter(
      (d) => d.triageStatus === 'UNIDENTIFIED' || d.triageStatus === 'INVESTIGATING'
    ).length;

    const monthlyMaintenanceTrends = [
      { month: 'Apr 2026', spend: 14200, count: 8 },
      { month: 'May 2026', spend: 18500, count: 12 },
      { month: 'Jun 2026', spend: 11900, count: 7 },
      { month: 'Jul 2026', spend: 23400, count: 15 },
      { month: 'Aug 2026', spend: 19800, count: 11 },
      { month: 'Sep 2026', spend: 26150, count: 14 },
    ];

    return {
      kpis: {
        totalAssets: assets.length,
        healthyAssets: healthyCount,
        highRiskAssets: highRiskCount,
        criticalAssets: criticalCount,
        unknownAssets: unknownDevicesCount,
        warrantyExpiringSoon: warrantyExpiring30dCount + warrantyExpiredCount,
        warrantyExpired: warrantyExpiredCount,
        assetsUnderMaintenance: underMaintenanceCount,
        totalFleetAssetValue: totalValue,
        totalReplacementValue: Math.round(totalReplacementValue),
        totalMaintenanceSpend: Math.round(totalMaintenanceSpend),
      },
      charts: {
        categoryDistribution: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
        riskDistribution: [
          { name: 'Low Risk (0-35)', value: riskTiers.low, color: '#10b981' },
          { name: 'Medium Risk (36-69)', value: riskTiers.medium, color: '#f59e0b' },
          { name: 'High Risk (70-100)', value: riskTiers.high, color: '#ef4444' },
        ],
        lifecycleDistribution: Object.entries(lifecycleMap).map(([name, value]) => ({ name, value })),
        locationDistribution: Object.entries(locationMap).map(([name, value]) => ({ name, value })),
        warrantyCohorts: [
          { name: 'Expired', count: warrantyExpiredCount, color: '#ef4444' },
          { name: '<30 Days', count: warrantyExpiring30dCount, color: '#f97316' },
          { name: '30-90 Days', count: warrantyExpiring90dCount, color: '#eab308' },
          { name: '>90 Days', count: warrantyValidCount, color: '#10b981' },
        ],
        monthlyMaintenanceTrends,
      },
    };
  }
}
