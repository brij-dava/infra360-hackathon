/**
 * INFRA360 Domain Types
 * Unified contract across frontend, backend, scoring engines, and ML services.
 */

export type UserRole =
  | 'ADMIN'
  | 'IT_MANAGER'
  | 'INFRA_ENGINEER'
  | 'TECHNICIAN'
  | 'SECURITY_ANALYST'
  | 'AUDITOR'
  | 'EMPLOYEE'
  | 'EXECUTIVE';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  createdAt: string;
}

export type AssetCategory =
  | 'SERVER'
  | 'SWITCH'
  | 'ROUTER'
  | 'FIREWALL'
  | 'STORAGE'
  | 'UPS'
  | 'WORKSTATION'
  | 'ACCESS_POINT'
  | 'IOT'
  | 'CLOUD';

export type LifecycleStage =
  | 'PLANNING'
  | 'PROCUREMENT'
  | 'RECEIVED'
  | 'INVENTORIED'
  | 'DEPLOYED'
  | 'OPERATIONAL'
  | 'MAINTENANCE'
  | 'TRANSFERRED'
  | 'RETIRED'
  | 'DISPOSED';

export type AssetStatus =
  | 'OPERATIONAL'
  | 'DEGRADED'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'DEFECTIVE';

export type Criticality =
  | 'TIER_1_CRITICAL'
  | 'TIER_2_OPERATIONAL'
  | 'TIER_3_SUPPORT';

export interface ILocation {
  siteId: string;
  siteName: string;
  building: string;
  floor: string;
  room: string;
  rack: string;
  rackUnitStart: number;
  rackUnitEnd: number;
}

export interface ITelemetry {
  cpuUtilizationPct: number;
  temperatureCelsius: number;
  errorRatePerMin: number;
  uptimeHours: number;
  lastPingTimestamp: string;
}

export interface IHealthFactor {
  factor: string;
  penalty: number;
  reason: string;
}

export interface IRiskFactor {
  factor: string;
  weight: number;
  contribution: number;
  reason: string;
}

export interface IAsset {
  id: string;
  assetTag: string; // e.g., "AST-SRV-000102"
  name: string;
  category: AssetCategory;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: AssetStatus;
  lifecycleStage: LifecycleStage;
  criticality: Criticality;

  // Location
  location: ILocation;

  // Ownership & Organization
  department: string;
  ownerId: string;
  ownerName: string;
  custodianId: string;
  custodianName: string;

  // Financials & Lifecycle Specs
  purchaseDate: string;
  purchaseCost: number;
  currency: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  expectedLifespanMonths: number;
  replacementCostEstimate: number;
  accumulatedMaintenanceCost: number;

  // Scoring & Explainability
  healthScore: number; // 0 - 100
  healthFactors: IHealthFactor[];
  riskScore: number; // 0 - 100
  riskFactors: IRiskFactor[];

  // Network & System Specifications
  ipAddress?: string;
  macAddress?: string;
  firmwareVersion: string;
  telemetry: ITelemetry;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
}

export type RelationshipType =
  | 'CONNECTED_TO'
  | 'DEPENDS_ON'
  | 'HOSTS'
  | 'LOCATED_IN'
  | 'BACKED_UP_BY'
  | 'SERVES'
  | 'UPSTREAM_OF'
  | 'DOWNSTREAM_OF';

export interface IRelationship {
  id: string;
  sourceAssetTag: string;
  targetAssetTag: string;
  relationshipType: RelationshipType;
  criticalityMultiplier: number; // 1.0 to 3.0
  metadata?: {
    port?: string;
    protocol?: string;
    bandwidthMbps?: number;
    description?: string;
  };
  createdAt: string;
}

export type MaintenanceType =
  | 'PREVENTIVE'
  | 'CORRECTIVE'
  | 'FIRMWARE_UPGRADE'
  | 'EMERGENCY_REPAIR'
  | 'INSPECTION';

export type MaintenanceStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IPartUsed {
  partNumber: string;
  description: string;
  quantity: number;
  unitCost: number;
}

export interface IMaintenanceRecord {
  id: string;
  ticketId: string;
  assetTag: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  title: string;
  description: string;
  technicianId: string;
  technicianName: string;
  scheduledDate: string;
  completedDate?: string;
  downtimeMinutes: number;
  cost: number;
  partsReplaced: IPartUsed[];
  resolutionNotes?: string;
  createdAt: string;
}

export type DiscoverySource =
  | 'ARP_SWEEP'
  | 'SNMP_PROBE'
  | 'MDNS_DISCOVERY'
  | 'NETFLOW'
  | 'CLOUD_SYNC';

export type TriageStatus =
  | 'UNIDENTIFIED'
  | 'INVESTIGATING'
  | 'REGISTERED'
  | 'AUTHORIZED_BYOD'
  | 'QUARANTINED'
  | 'DISMISSED';

export interface IDiscoveredDevice {
  id: string;
  ipAddress: string;
  macAddress: string;
  hostname?: string;
  detectedManufacturer: string;
  detectedType: string;
  subnet: string;
  firstSeenAt: string;
  lastSeenAt: string;
  discoverySource: DiscoverySource;
  triageStatus: TriageStatus;
  riskScore: number;
  openPorts: number[];
  associatedAssetTag?: string;
}

export interface IAuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'ASSET' | 'RELATIONSHIP' | 'MAINTENANCE' | 'DISCOVERY' | 'USER' | 'LIFECYCLE';
  entityId: string;
  diff: {
    previous: Record<string, any>;
    current: Record<string, any>;
  };
  reason?: string;
  ipAddress: string;
}

export interface IBlastRadiusResult {
  rootAssetTag: string;
  rootAssetName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC';
  impactedAssetsCount: number;
  impactedServicesCount: number;
  totalImpactedUsers: number;
  estimatedHourlyFinancialLoss: number;
  downstreamAssets: Array<{
    assetTag: string;
    name: string;
    category: AssetCategory;
    status: AssetStatus;
    hopDistance: number;
  }>;
  compromisedServices: Array<{
    serviceName: string;
    slaTier: string;
    hourlyRevenueImpact: number;
    userCount: number;
  }>;
  recommendedMitigations: string[];
}

export interface IRepairReplaceAnalysis {
  assetTag: string;
  assetName: string;
  currentAgeMonths: number;
  expectedLifespanMonths: number;
  accumulatedMaintenanceCost: number;
  estimatedImmediateRepairCost: number;
  newAssetReplacementCost: number;
  failureProbabilityNext90Days: number;
  netPresentCostRepair: number;
  netPresentCostReplace: number;
  recommendation: 'REPAIR' | 'REPLACE' | 'RETIRE' | 'MONITOR';
  rationale: string[];
  economicSavingsOpportunity: number;
}

export interface IPredictiveFailureResult {
  assetTag: string;
  failureProbabilityNext90Days: number; // 0.0 - 1.0
  predictedTimeToFailureDays: number;
  confidenceScore: number;
  keyContributingFactors: Array<{
    feature: string;
    impact: number;
    description: string;
  }>;
  prescriptiveActions: string[];
}

export interface INaturalLanguageQueryResult {
  rawQuery: string;
  interpretedIntent: string;
  structuredFilter: Record<string, any>;
  matchedAssetCount: number;
  results: IAsset[];
  explanation: string;
}
