import {
  IAsset,
  IRelationship,
  IMaintenanceRecord,
  IDiscoveredDevice,
  IAuditLog,
  IUser,
  AssetCategory,
  AssetStatus,
  LifecycleStage,
  Criticality,
} from '@infra360/types';
import { calculateHealthScore, calculateRiskScore } from './index';

export const SEED_USERS: IUser[] = [
  {
    id: 'USR-001',
    email: 'admin@infra360.internal',
    name: 'Sarah Connor',
    role: 'ADMIN',
    department: 'Infrastructure & Cloud Operations',
    createdAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'USR-002',
    email: 'itmanager@infra360.internal',
    name: 'Vikram Patel',
    role: 'IT_MANAGER',
    department: 'Enterprise IT Services',
    createdAt: '2025-01-12T08:00:00Z',
  },
  {
    id: 'USR-003',
    email: 'engineer@infra360.internal',
    name: 'Kavita Rao',
    role: 'INFRA_ENGINEER',
    department: 'Network & Systems Architecture',
    createdAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'USR-004',
    email: 'technician@infra360.internal',
    name: 'Marcus Zhang',
    role: 'TECHNICIAN',
    department: 'Field Engineering & Data Center Ops',
    createdAt: '2025-02-01T08:00:00Z',
  },
  {
    id: 'USR-005',
    email: 'security@infra360.internal',
    name: 'Elena Rostova',
    role: 'SECURITY_ANALYST',
    department: 'InfoSec & Vulnerability Management',
    createdAt: '2025-02-10T08:00:00Z',
  },
  {
    id: 'USR-006',
    email: 'auditor@infra360.internal',
    name: 'David Hoffman',
    role: 'AUDITOR',
    department: 'Governance, Risk & Compliance',
    createdAt: '2025-02-20T08:00:00Z',
  },
  {
    id: 'USR-007',
    email: 'employee@infra360.internal',
    name: 'Ananya Sharma',
    role: 'EMPLOYEE',
    department: 'Corporate Finance & Analytics',
    createdAt: '2025-03-01T08:00:00Z',
  },
  {
    id: 'USR-008',
    email: 'cio@infra360.internal',
    name: 'Alexander Sterling',
    role: 'EXECUTIVE',
    department: 'Office of the CIO / Executive Board',
    createdAt: '2025-01-05T08:00:00Z',
  },
];

export function generateSeedData(): {
  assets: IAsset[];
  relationships: IRelationship[];
  maintenance: IMaintenanceRecord[];
  discovery: IDiscoveredDevice[];
  audit: IAuditLog[];
} {
  const assets: IAsset[] = [];
  const relationships: IRelationship[] = [];
  const maintenance: IMaintenanceRecord[] = [];
  const discovery: IDiscoveredDevice[] = [];
  const audit: IAuditLog[] = [];

  const sites = [
    { id: 'DC-EAST-01', name: 'Ashburn Datacenter Alpha', building: 'DC Building A', room: 'Server Room 101' },
    { id: 'DC-WEST-02', name: 'Oregon Datacenter Beta', building: 'DC Building B', room: 'Halls 2 & 3' },
    { id: 'HQ-BLR-01', name: 'Bangalore Technology Center', building: 'Tower 4', room: 'Network Lab 3A' },
    { id: 'BR-LON-01', name: 'London Regional Operations', building: 'Canary Wharf Hub', room: 'Comms Room 12' },
  ];

  const depts = [
    'Core Enterprise Applications',
    'Network & Cloud Engineering',
    'Corporate IT & Workplace',
    'Data Science & Analytics',
    'Cybersecurity Operations',
    'Financial Systems',
  ];

  // ==========================================
  // HERO ASSET 1: AST-SRV-000041 (Core ERP Server)
  // ==========================================
  const erpHealth = calculateHealthScore(
    {
      purchaseDate: '2021-03-15T00:00:00Z',
      expectedLifespanMonths: 48, // 4 years (already 5.5 years old)
      warrantyEndDate: '2025-03-15T00:00:00Z', // Expired!
      status: 'DEGRADED',
      telemetry: {
        cpuUtilizationPct: 88,
        temperatureCelsius: 79,
        errorRatePerMin: 14,
        uptimeHours: 3410,
        lastPingTimestamp: '2026-09-28T11:20:00Z',
      },
    },
    4, // 4 failures in 90 days!
    true // degraded/defect
  );

  const erpRisk = calculateRiskScore(
    {
      criticality: 'TIER_1_CRITICAL',
      warrantyEndDate: '2025-03-15T00:00:00Z',
    },
    erpHealth.healthScore,
    14 // 14 downstream dependents
  );

  const heroServer: IAsset = {
    id: 'AST-SRV-000041',
    assetTag: 'AST-SRV-000041',
    name: 'Core ERP Primary Application & DB Server',
    category: 'SERVER',
    type: 'Rackmount 2U High-Performance Database Server',
    manufacturer: 'Dell Technologies',
    model: 'PowerEdge R750',
    serialNumber: 'SN-DEL-984210',
    status: 'DEGRADED',
    lifecycleStage: 'OPERATIONAL',
    criticality: 'TIER_1_CRITICAL',
    location: {
      siteId: 'DC-EAST-01',
      siteName: 'Ashburn Datacenter Alpha',
      building: 'DC Building A',
      floor: 'Floor 1',
      room: 'Server Room 101',
      rack: 'Rack-A4',
      rackUnitStart: 14,
      rackUnitEnd: 16,
    },
    department: 'Core Enterprise Applications',
    ownerId: 'USR-002',
    ownerName: 'Vikram Patel',
    custodianId: 'USR-003',
    custodianName: 'Kavita Rao',
    purchaseDate: '2021-03-15T00:00:00Z',
    purchaseCost: 38500,
    currency: 'USD',
    warrantyStartDate: '2021-03-15T00:00:00Z',
    warrantyEndDate: '2025-03-15T00:00:00Z', // Expired
    expectedLifespanMonths: 48,
    replacementCostEstimate: 45000,
    accumulatedMaintenanceCost: 19400,
    healthScore: erpHealth.healthScore,
    healthFactors: erpHealth.factors,
    riskScore: erpRisk.riskScore,
    riskFactors: erpRisk.factors,
    ipAddress: '10.10.10.41',
    macAddress: '00:1E:67:D8:92:01',
    firmwareVersion: 'iDRAC9-v5.10.30',
    telemetry: {
      cpuUtilizationPct: 88,
      temperatureCelsius: 79,
      errorRatePerMin: 14,
      uptimeHours: 3410,
      lastPingTimestamp: '2026-09-28T11:20:00Z',
    },
    createdAt: '2021-03-16T10:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
    lastSeenAt: '2026-09-28T11:20:00Z',
  };
  assets.push(heroServer);

  // Maintenance history for hero server
  maintenance.push(
    {
      id: 'MNT-2026-0012',
      ticketId: 'MNT-2026-0012',
      assetTag: 'AST-SRV-000041',
      type: 'EMERGENCY_REPAIR',
      status: 'COMPLETED',
      title: 'RAID Controller Battery Backed Cache Module Fault',
      description: 'Controller cache battery reported voltage drop; replaced battery module and rebuilt cache mirror.',
      technicianId: 'USR-004',
      technicianName: 'Marcus Zhang',
      scheduledDate: '2026-07-14T09:00:00Z',
      completedDate: '2026-07-14T14:30:00Z',
      downtimeMinutes: 180,
      cost: 2400,
      partsReplaced: [{ partNumber: 'DEL-PERC-BAT-H750', description: 'PERC H750 Battery Unit', quantity: 1, unitCost: 450 }],
      resolutionNotes: 'Write cache restored to Write-Back mode.',
      createdAt: '2026-07-14T08:15:00Z',
    },
    {
      id: 'MNT-2026-0038',
      ticketId: 'MNT-2026-0038',
      assetTag: 'AST-SRV-000041',
      type: 'CORRECTIVE',
      status: 'COMPLETED',
      title: 'Hot-Swap Cooling Fan Tray 2 Ball Bearing Seizure',
      description: 'Chassis fan tray #2 RPM dropped below 1500 RPM, triggering acoustic and IPMI alert.',
      technicianId: 'USR-004',
      technicianName: 'Marcus Zhang',
      scheduledDate: '2026-08-22T11:00:00Z',
      completedDate: '2026-08-22T12:15:00Z',
      downtimeMinutes: 0,
      cost: 650,
      partsReplaced: [{ partNumber: 'DEL-FAN-R750-HS', description: 'Dual Rotor Fan Module', quantity: 1, unitCost: 180 }],
      resolutionNotes: 'Replaced hot-swap fan module live with zero server downtime.',
      createdAt: '2026-08-22T10:45:00Z',
    }
  );

  // ==========================================
  // HERO ASSET 2: AST-NET-000012 (Core Switch Alpha)
  // ==========================================
  const switchHealth = calculateHealthScore(
    {
      purchaseDate: '2023-01-10T00:00:00Z',
      expectedLifespanMonths: 60,
      warrantyEndDate: '2027-01-10T00:00:00Z',
      status: 'OPERATIONAL',
      telemetry: {
        cpuUtilizationPct: 42,
        temperatureCelsius: 48,
        errorRatePerMin: 1,
        uptimeHours: 8900,
        lastPingTimestamp: '2026-09-28T11:21:00Z',
      },
    },
    0,
    false
  );
  const switchRisk = calculateRiskScore(
    {
      criticality: 'TIER_1_CRITICAL',
      warrantyEndDate: '2027-01-10T00:00:00Z',
    },
    switchHealth.healthScore,
    22 // heavy blast radius
  );

  const heroSwitch: IAsset = {
    id: 'AST-NET-000012',
    assetTag: 'AST-NET-000012',
    name: 'Core Distribution Switch Alpha (Catalyst 9500)',
    category: 'SWITCH',
    type: 'Core 48-Port 25G/100G Aggregation Switch',
    manufacturer: 'Cisco Systems',
    model: 'Catalyst 9500 48Y4C',
    serialNumber: 'SN-CSC-771920',
    status: 'OPERATIONAL',
    lifecycleStage: 'OPERATIONAL',
    criticality: 'TIER_1_CRITICAL',
    location: {
      siteId: 'DC-EAST-01',
      siteName: 'Ashburn Datacenter Alpha',
      building: 'DC Building A',
      floor: 'Floor 1',
      room: 'Server Room 101',
      rack: 'Rack-A1',
      rackUnitStart: 40,
      rackUnitEnd: 42,
    },
    department: 'Network & Cloud Engineering',
    ownerId: 'USR-003',
    ownerName: 'Kavita Rao',
    custodianId: 'USR-004',
    custodianName: 'Marcus Zhang',
    purchaseDate: '2023-01-10T00:00:00Z',
    purchaseCost: 42000,
    currency: 'USD',
    warrantyStartDate: '2023-01-10T00:00:00Z',
    warrantyEndDate: '2027-01-10T00:00:00Z',
    expectedLifespanMonths: 60,
    replacementCostEstimate: 46000,
    accumulatedMaintenanceCost: 3200,
    healthScore: switchHealth.healthScore,
    healthFactors: switchHealth.factors,
    riskScore: switchRisk.riskScore,
    riskFactors: switchRisk.factors,
    ipAddress: '10.10.1.1',
    macAddress: '00:00:0C:9F:F0:01',
    firmwareVersion: 'Cisco IOS-XE 17.9.4a',
    telemetry: {
      cpuUtilizationPct: 42,
      temperatureCelsius: 48,
      errorRatePerMin: 1,
      uptimeHours: 8900,
      lastPingTimestamp: '2026-09-28T11:21:00Z',
    },
    createdAt: '2023-01-11T09:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
    lastSeenAt: '2026-09-28T11:21:00Z',
  };
  assets.push(heroSwitch);

  // Link Switch to ERP Server
  relationships.push({
    id: 'REL-0001',
    sourceAssetTag: 'AST-NET-000012',
    targetAssetTag: 'AST-SRV-000041',
    relationshipType: 'CONNECTED_TO',
    criticalityMultiplier: 2.5,
    metadata: { port: 'TenGigE1/0/14', bandwidthMbps: 10000, description: '10GbE Uplink Port' },
    createdAt: '2023-01-12T10:00:00Z',
  });

  // ==========================================
  // GENERATE 510 REALISTIC ENTERPRISE ASSETS
  // ==========================================
  const categories: Array<{
    cat: AssetCategory;
    models: Array<{ mfr: string; model: string; type: string; baseCost: number; lifespan: number }>;
  }> = [
    {
      cat: 'SERVER',
      models: [
        { mfr: 'Dell Technologies', model: 'PowerEdge R650 1U', type: 'Virtualization Compute Node', baseCost: 18500, lifespan: 60 },
        { mfr: 'HPE', model: 'ProLiant DL380 Gen10', type: 'High Density Analytics Server', baseCost: 22000, lifespan: 60 },
        { mfr: 'Cisco Systems', model: 'UCS B200 M5 Blade', type: 'Private Cloud Compute Blade', baseCost: 15400, lifespan: 48 },
        { mfr: 'Supermicro', model: 'A+ Server 2124GQ', type: 'AI Inference Cluster Node', baseCost: 35000, lifespan: 36 },
      ],
    },
    {
      cat: 'SWITCH',
      models: [
        { mfr: 'Cisco Systems', model: 'Catalyst 9300 48P', type: 'Layer 3 PoE+ Access Switch', baseCost: 8900, lifespan: 72 },
        { mfr: 'Arista Networks', model: '7050SX3-48YC8', type: '25G/100G Top-of-Rack Switch', baseCost: 24000, lifespan: 60 },
        { mfr: 'Juniper Networks', model: 'EX4300-48T', type: 'Campus Distribution Switch', baseCost: 11500, lifespan: 72 },
      ],
    },
    {
      cat: 'ROUTER',
      models: [
        { mfr: 'Cisco Systems', model: 'ASR 1001-X', type: 'Edge BGP WAN Aggregator', baseCost: 28000, lifespan: 84 },
        { mfr: 'Juniper Networks', model: 'MX204 Universal Routing', type: 'SD-WAN Interconnect Gateway', baseCost: 32000, lifespan: 84 },
      ],
    },
    {
      cat: 'FIREWALL',
      models: [
        { mfr: 'Palo Alto Networks', model: 'PA-3220', type: 'Next-Gen Perimeter Firewall', baseCost: 26000, lifespan: 60 },
        { mfr: 'Fortinet', model: 'FortiGate 200F', type: 'Branch Unified Threat Gateway', baseCost: 9500, lifespan: 60 },
      ],
    },
    {
      cat: 'STORAGE',
      models: [
        { mfr: 'Dell Technologies', model: 'PowerStore 1000T SAN', type: 'All-Flash NVMe Array (120TB)', baseCost: 65000, lifespan: 72 },
        { mfr: 'NetApp', model: 'AFF A250', type: 'Unified Multi-Protocol Flash Storage', baseCost: 54000, lifespan: 72 },
        { mfr: 'Pure Storage', model: 'FlashArray//X20', type: 'DirectFlash Tier-0 SAN', baseCost: 72000, lifespan: 72 },
      ],
    },
    {
      cat: 'UPS',
      models: [
        { mfr: 'Schneider Electric / APC', model: 'Symmetra LX 16kVA', type: 'Modular Redundant Datacenter UPS', baseCost: 18000, lifespan: 96 },
        { mfr: 'Eaton', model: '9PX 6000i', type: 'On-Line Double-Conversion 6kVA UPS', baseCost: 5200, lifespan: 84 },
      ],
    },
    {
      cat: 'ACCESS_POINT',
      models: [
        { mfr: 'Aruba Networks', model: 'AP-555 Wi-Fi 6', type: 'Campus High-Density Access Point', baseCost: 1200, lifespan: 48 },
        { mfr: 'Cisco Systems', model: 'Catalyst 9130AX', type: 'Enterprise Multigigabit AP', baseCost: 1400, lifespan: 48 },
      ],
    },
    {
      cat: 'WORKSTATION',
      models: [
        { mfr: 'Dell Technologies', model: 'Precision 7865 Tower', type: 'Dual AMD Threadripper CAD Workstation', baseCost: 7500, lifespan: 48 },
        { mfr: 'HP Inc.', model: 'Z8 G4 Workstation', type: 'Data Science Modeling Tower', baseCost: 8200, lifespan: 48 },
      ],
    },
    {
      cat: 'IOT',
      models: [
        { mfr: 'Advantech', model: 'WISE-710 Industrial IoT', type: 'Datacenter Environmental Gateway', baseCost: 850, lifespan: 60 },
        { mfr: 'Axis Communications', model: 'P3245-V 4K Security Dome', type: 'Perimeter Security Camera', baseCost: 950, lifespan: 60 },
      ],
    },
  ];

  let assetCounter = 100;
  for (const catGroup of categories) {
    const targetCount = catGroup.cat === 'SERVER' ? 140
      : catGroup.cat === 'SWITCH' ? 95
      : catGroup.cat === 'ROUTER' ? 40
      : catGroup.cat === 'FIREWALL' ? 35
      : catGroup.cat === 'STORAGE' ? 45
      : catGroup.cat === 'UPS' ? 40
      : catGroup.cat === 'ACCESS_POINT' ? 65
      : catGroup.cat === 'WORKSTATION' ? 45
      : 30; // IOT

    for (let i = 0; i < targetCount; i++) {
      assetCounter++;
      const catPrefix = catGroup.cat.substring(0, 3).toUpperCase();
      const assetTag = `AST-${catPrefix}-${String(assetCounter).padStart(6, '0')}`;
      const modelDef = catGroup.models[i % catGroup.models.length];
      const site = sites[i % sites.length];
      const dept = depts[i % depts.length];
      const user = SEED_USERS[i % SEED_USERS.length];

      // Age distribution (from 6 months to 6 years)
      const ageMonths = Math.floor(6 + (i * 7) % 65);
      const purchaseDate = new Date(Date.now() - ageMonths * 30 * 24 * 3600 * 1000);
      const warrantyMonths = 36;
      const warrantyEndDate = new Date(purchaseDate.getTime() + warrantyMonths * 30 * 24 * 3600 * 1000);
      const daysUntilWarranty = Math.ceil((warrantyEndDate.getTime() - Date.now()) / (1000 * 3600 * 24));

      // Status & Stage
      let status: AssetStatus = 'OPERATIONAL';
      let stage: LifecycleStage = 'OPERATIONAL';
      if (i % 25 === 0) {
        status = 'DEGRADED';
      } else if (i % 40 === 0) {
        status = 'MAINTENANCE';
        stage = 'MAINTENANCE';
      } else if (i % 60 === 0) {
        status = 'DEFECTIVE';
        stage = 'MAINTENANCE';
      }

      // Criticality
      const criticality: Criticality =
        i % 4 === 0 ? 'TIER_1_CRITICAL' : i % 3 === 0 ? 'TIER_2_OPERATIONAL' : 'TIER_3_SUPPORT';

      // Telemetry
      const temp = 35 + ((i * 13) % 45);
      const cpu = 15 + ((i * 17) % 75);
      const err = i % 18 === 0 ? 8 + (i % 12) : (i % 3);

      const health = calculateHealthScore(
        {
          purchaseDate: purchaseDate.toISOString(),
          expectedLifespanMonths: modelDef.lifespan,
          warrantyEndDate: warrantyEndDate.toISOString(),
          status,
          telemetry: {
            cpuUtilizationPct: cpu,
            temperatureCelsius: temp,
            errorRatePerMin: err,
            uptimeHours: 500 + i * 42,
            lastPingTimestamp: new Date().toISOString(),
          },
        },
        i % 15 === 0 ? 2 : 0,
        status === 'DEGRADED' || status === 'DEFECTIVE'
      );

      const risk = calculateRiskScore(
        {
          criticality,
          warrantyEndDate: warrantyEndDate.toISOString(),
        },
        health.healthScore,
        (i % 5) + 1
      );

      const assetRecord: IAsset = {
        id: assetTag,
        assetTag,
        name: `${modelDef.mfr} ${modelDef.model} [${site.id}-${String((i % 12) + 1).padStart(2, '0')}]`,
        category: catGroup.cat,
        type: modelDef.type,
        manufacturer: modelDef.mfr,
        model: modelDef.model,
        serialNumber: `SN-${modelDef.mfr.substring(0, 3).toUpperCase()}-${100000 + i * 147}`,
        status,
        lifecycleStage: stage,
        criticality,
        location: {
          siteId: site.id,
          siteName: site.name,
          building: site.building,
          floor: `Floor ${(i % 4) + 1}`,
          room: site.room,
          rack: `Rack-${String.fromCharCode(65 + (i % 8))}${((i % 6) + 1)}`,
          rackUnitStart: (i % 38) + 1,
          rackUnitEnd: (i % 38) + 3,
        },
        department: dept,
        ownerId: user.id,
        ownerName: user.name,
        custodianId: SEED_USERS[(i + 2) % SEED_USERS.length].id,
        custodianName: SEED_USERS[(i + 2) % SEED_USERS.length].name,
        purchaseDate: purchaseDate.toISOString(),
        purchaseCost: modelDef.baseCost,
        currency: 'USD',
        warrantyStartDate: purchaseDate.toISOString(),
        warrantyEndDate: warrantyEndDate.toISOString(),
        expectedLifespanMonths: modelDef.lifespan,
        replacementCostEstimate: Math.round(modelDef.baseCost * 1.15),
        accumulatedMaintenanceCost: Math.round((ageMonths / 12) * 850 + (i % 4) * 450),
        healthScore: health.healthScore,
        healthFactors: health.factors,
        riskScore: risk.riskScore,
        riskFactors: risk.factors,
        ipAddress: `10.${10 + (i % 15)}.${(i % 250) + 1}.${(assetCounter % 250) + 1}`,
        macAddress: `00:${String((i * 17) % 99).padStart(2, '0')}:${String((i * 31) % 99).padStart(2, '0')}:${String((i * 47) % 99).padStart(2, '0')}:${String((i * 61) % 99).padStart(2, '0')}:${String((i * 83) % 99).padStart(2, '0')}`,
        firmwareVersion: `v${(i % 5) + 1}.${(i % 10)}.${(i % 8)}`,
        telemetry: {
          cpuUtilizationPct: cpu,
          temperatureCelsius: temp,
          errorRatePerMin: err,
          uptimeHours: 500 + i * 42,
          lastPingTimestamp: new Date().toISOString(),
        },
        createdAt: purchaseDate.toISOString(),
        updatedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      };

      assets.push(assetRecord);

      // Create topological connections
      if (catGroup.cat === 'SERVER' && i < 20) {
        relationships.push({
          id: `REL-${relationships.length + 1}`,
          sourceAssetTag: 'AST-NET-000012',
          targetAssetTag: assetTag,
          relationshipType: 'CONNECTED_TO',
          criticalityMultiplier: 2.0,
          metadata: { port: `GigE1/0/${(i % 48) + 1}`, bandwidthMbps: 10000 },
          createdAt: new Date().toISOString(),
        });
      }

      if (catGroup.cat === 'STORAGE' && i < 8) {
        relationships.push({
          id: `REL-${relationships.length + 1}`,
          sourceAssetTag: assetTag,
          targetAssetTag: 'AST-SRV-000041',
          relationshipType: 'SERVES',
          criticalityMultiplier: 2.5,
          metadata: { protocol: 'iSCSI / Fiber Channel', description: 'ERP Primary Storage LUN' },
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // ==========================================
  // 13 SHADOW IT / DISCOVERED DEVICES
  // ==========================================
  const roguePrototypes = [
    { ip: '10.14.20.188', mac: 'B8:27:EB:42:11:90', mfr: 'Raspberry Pi Foundation', type: 'Unknown Micro-Compute Node / Probe', ports: [22, 8080], subnet: '10.14.20.0/24', risk: 88 },
    { ip: '10.14.20.52', mac: '00:1E:58:AA:7F:12', mfr: 'D-Link Systems', type: 'Unmanaged 8-Port Switch', ports: [80], subnet: '10.14.20.0/24', risk: 76 },
    { ip: '10.14.20.95', mac: '40:16:9F:88:23:44', mfr: 'TP-Link Technologies', type: 'Rogue Wireless Access Point', ports: [80, 443], subnet: '10.14.20.0/24', risk: 94 },
    { ip: '10.14.20.210', mac: '44:4E:6D:32:89:01', mfr: 'Hikvision Digital', type: 'Uncatalogued IP Surveillance Camera', ports: [554, 8000], subnet: '10.14.20.0/24', risk: 82 },
    { ip: '10.14.20.14', mac: '70:B3:D5:19:AA:05', mfr: 'WAGO Kontakttechnik', type: 'Rogue PLC / Modbus Field Controller', ports: [502], subnet: '10.14.20.0/24', risk: 90 },
    { ip: '10.14.20.77', mac: 'A4:C1:38:65:21:40', mfr: 'Espressif Systems', type: 'ESP32 Wi-Fi Sensor Hub', ports: [1883], subnet: '10.14.20.0/24', risk: 70 },
    { ip: '192.168.100.41', mac: '00:26:86:14:FE:99', mfr: 'Cisco Consumer / Linksys', type: 'Unregistered SOHO Router', ports: [80, 443, 8080], subnet: '192.168.100.0/24', risk: 85 },
    { ip: '192.168.100.88', mac: '3C:52:82:90:1B:32', mfr: 'Synology Inc.', type: 'Personal Unapproved NAS Enclosure', ports: [5000, 5001], subnet: '192.168.100.0/24', risk: 80 },
    { ip: '192.168.100.103', mac: '90:72:40:55:18:02', mfr: 'Xiaomi Electronics', type: 'Smart Environmental Display', ports: [80], subnet: '192.168.100.0/24', risk: 65 },
    { ip: '192.168.100.119', mac: '00:50:56:C0:00:08', mfr: 'VMware Virtual NIC', type: 'Unregistered Test VM Sandbox', ports: [22, 3389], subnet: '192.168.100.0/24', risk: 72 },
    { ip: '192.168.100.155', mac: 'DC:A6:32:78:E1:22', mfr: 'Raspberry Pi Foundation', type: 'Network Packet Sniffer (Pi 4B)', ports: [22], subnet: '192.168.100.0/24', risk: 91 },
    { ip: '192.168.100.180', mac: '00:1B:21:84:77:A0', mfr: 'Intel Mobile', type: 'Unauthorized Engineer Development Rig', ports: [22, 9000], subnet: '192.168.100.0/24', risk: 68 },
    { ip: '192.168.100.222', mac: '28:6C:07:91:AA:54', mfr: 'Netgear Inc.', type: 'Unmanaged 5-Port Gigabit Desktop Switch', ports: [], subnet: '192.168.100.0/24', risk: 74 },
  ];

  for (let idx = 0; idx < roguePrototypes.length; idx++) {
    const rogue = roguePrototypes[idx];
    discovery.push({
      id: `DISC-2026-${String(idx + 1).padStart(4, '0')}`,
      ipAddress: rogue.ip,
      macAddress: rogue.mac,
      hostname: `unknown-host-${rogue.ip.split('.').pop()}`,
      detectedManufacturer: rogue.mfr,
      detectedType: rogue.type,
      subnet: rogue.subnet,
      firstSeenAt: new Date(Date.now() - (idx + 1) * 36 * 3600 * 1000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      discoverySource: idx % 2 === 0 ? 'ARP_SWEEP' : 'SNMP_PROBE',
      triageStatus: 'UNIDENTIFIED',
      riskScore: rogue.risk,
      openPorts: rogue.ports,
    });
  }

  // Initial audit records
  audit.push(
    {
      id: 'AUD-2026-0001',
      timestamp: '2026-09-28T09:15:00Z',
      actorId: 'USR-001',
      actorName: 'Sarah Connor',
      actorRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZED',
      entityType: 'ASSET',
      entityId: 'SYSTEM',
      diff: { previous: {}, current: { totalAssetsLoaded: assets.length } },
      reason: 'Platform initialization and enterprise baseline synchronization',
      ipAddress: '10.10.1.5',
    },
    {
      id: 'AUD-2026-0002',
      timestamp: '2026-09-28T09:45:00Z',
      actorId: 'USR-005',
      actorName: 'Elena Rostova',
      actorRole: 'SECURITY_ANALYST',
      action: 'DISCOVERY_SWEEP_EXECUTED',
      entityType: 'DISCOVERY',
      entityId: 'SUBNET-10.14.20.0/24',
      diff: { previous: {}, current: { discoveredRoguesCount: 13 } },
      reason: 'Routine perimeter ARP/SNMP subnet discovery sweep',
      ipAddress: '10.10.1.22',
    }
  );

  return { assets, relationships, maintenance, discovery, audit };
}
