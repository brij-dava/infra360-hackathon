import {
  IAsset,
  IHealthFactor,
  IRiskFactor,
  LifecycleStage,
  IBlastRadiusResult,
  IRepairReplaceAnalysis,
  IRelationship,
  AssetCategory,
} from '@infra360/types';

/**
 * Valid state transitions for the 10-stage Asset Lifecycle State Machine.
 */
export const LIFECYCLE_STATE_MACHINE: Record<LifecycleStage, LifecycleStage[]> = {
  PLANNING: ['PROCUREMENT', 'RETIRED'],
  PROCUREMENT: ['RECEIVED', 'PLANNING'],
  RECEIVED: ['INVENTORIED', 'PROCUREMENT'],
  INVENTORIED: ['DEPLOYED', 'RETIRED'],
  DEPLOYED: ['OPERATIONAL', 'MAINTENANCE', 'INVENTORIED'],
  OPERATIONAL: ['MAINTENANCE', 'TRANSFERRED', 'RETIRED'],
  MAINTENANCE: ['OPERATIONAL', 'RETIRED', 'DISPOSED'],
  TRANSFERRED: ['OPERATIONAL', 'MAINTENANCE', 'RETIRED'],
  RETIRED: ['DISPOSED', 'OPERATIONAL'],
  DISPOSED: [],
};

export function canTransitionLifecycle(
  fromStage: LifecycleStage,
  toStage: LifecycleStage
): boolean {
  if (fromStage === toStage) return true;
  const allowed = LIFECYCLE_STATE_MACHINE[fromStage];
  return allowed ? allowed.includes(toStage) : false;
}

/**
 * Deterministic, Explainable Health Score Engine (0–100)
 * Health Score = 100 - sum(penalties)
 */
export function calculateHealthScore(
  asset: Partial<IAsset>,
  recentFailuresCount: number = 0,
  hasOpenCriticalDefect: boolean = false
): { healthScore: number; factors: IHealthFactor[] } {
  let score = 100;
  const factors: IHealthFactor[] = [];

  // 1. Age Degradation Penalty (Max 25 pts)
  const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date();
  const now = new Date('2026-09-28T00:00:00Z');
  const ageMonths = Math.max(
    0,
    (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (now.getMonth() - purchaseDate.getMonth())
  );
  const lifespan = asset.expectedLifespanMonths || 60;
  const ageRatio = Math.min(1.5, ageMonths / lifespan);
  const agePenalty = Math.round(25 * Math.min(1.0, Math.pow(ageRatio, 1.4)));
  if (agePenalty > 0) {
    score -= agePenalty;
    factors.push({
      factor: 'Age & Operational Wear',
      penalty: -agePenalty,
      reason: `Asset is ${Math.round(ageMonths / 12 * 10) / 10} years old (${Math.round(ageRatio * 100)}% of expected ${lifespan / 12}y lifespan)`,
    });
  }

  // 2. Failure Frequency Penalty (Max 30 pts)
  if (recentFailuresCount > 0) {
    const failPenalty = Math.min(30, recentFailuresCount * 10);
    score -= failPenalty;
    factors.push({
      factor: 'Recent Failure Frequency',
      penalty: -failPenalty,
      reason: `${recentFailuresCount} recorded failure incident(s) in last 90 days`,
    });
  }

  // 3. Open Critical Defect Penalty (Max 20 pts)
  if (hasOpenCriticalDefect || asset.status === 'DEGRADED') {
    const defectPenalty = 20;
    score -= defectPenalty;
    factors.push({
      factor: 'Active Defect / Degraded State',
      penalty: -defectPenalty,
      reason: 'Active critical ticket or degraded telemetry warning flag',
    });
  }

  // 4. Telemetry Strain (Max 15 pts)
  if (asset.telemetry) {
    let telemetryPenalty = 0;
    const reasons: string[] = [];

    if (asset.telemetry.temperatureCelsius > 75) {
      telemetryPenalty += 10;
      reasons.push(`High operating temperature (${asset.telemetry.temperatureCelsius}°C)`);
    } else if (asset.telemetry.temperatureCelsius > 65) {
      telemetryPenalty += 5;
      reasons.push(`Elevated temperature (${asset.telemetry.temperatureCelsius}°C)`);
    }

    if (asset.telemetry.errorRatePerMin > 10) {
      telemetryPenalty += 5;
      reasons.push(`High packet/bus error rate (${asset.telemetry.errorRatePerMin}/min)`);
    }

    if (telemetryPenalty > 0) {
      score -= telemetryPenalty;
      factors.push({
        factor: 'Operating Telemetry Strain',
        penalty: -telemetryPenalty,
        reason: reasons.join('; '),
      });
    }
  }

  // 5. Warranty Lapse Penalty (Max 10 pts)
  if (asset.warrantyEndDate) {
    const warrantyEnd = new Date(asset.warrantyEndDate);
    const daysUntilExpiry = Math.ceil(
      (warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry < 0) {
      const warrantyPenalty = 10;
      score -= warrantyPenalty;
      factors.push({
        factor: 'OEM Warranty Lapsed',
        penalty: -warrantyPenalty,
        reason: `Vendor warranty expired ${Math.abs(daysUntilExpiry)} days ago`,
      });
    } else if (daysUntilExpiry <= 30) {
      const warrantyPenalty = 5;
      score -= warrantyPenalty;
      factors.push({
        factor: 'OEM Warranty Expiring Soon',
        penalty: -warrantyPenalty,
        reason: `Vendor warranty expires in ${daysUntilExpiry} days`,
      });
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  return { healthScore: finalScore, factors };
}

/**
 * Deterministic Multi-Vector Risk Score Engine (0–100)
 */
export function calculateRiskScore(
  asset: Partial<IAsset>,
  healthScore: number,
  downstreamImpactCount: number = 0
): { riskScore: number; factors: IRiskFactor[] } {
  const factors: IRiskFactor[] = [];

  // Criticality points (0 - 100)
  let critPts = 20;
  let critReason = 'Tier 3 (Supporting/Non-critical)';
  if (asset.criticality === 'TIER_1_CRITICAL') {
    critPts = 100;
    critReason = 'Tier 1 Mission Critical Asset';
  } else if (asset.criticality === 'TIER_2_OPERATIONAL') {
    critPts = 60;
    critReason = 'Tier 2 Business Operational Asset';
  }

  // Health vulnerability points (100 - healthScore)
  const healthVulnPts = 100 - healthScore;
  const healthReason = `Health vulnerability index is ${healthVulnPts}/100`;

  // Blast radius exposure points (0 - 100)
  const blastPts = Math.min(100, downstreamImpactCount * 18);
  const blastReason = `${downstreamImpactCount} downstream asset(s) depend directly or indirectly on this node`;

  // Warranty / Vendor coverage risk (0 - 100)
  let warrantyPts = 0;
  let warrantyReason = 'Active OEM SLA coverage';
  if (asset.warrantyEndDate) {
    const days = Math.ceil(
      (new Date(asset.warrantyEndDate).getTime() - new Date('2026-09-28T00:00:00Z').getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (days < 0) {
      warrantyPts = 90;
      warrantyReason = 'Support contract expired; replacement parts at market spot price';
    } else if (days <= 30) {
      warrantyPts = 60;
      warrantyReason = `Support contract expires in ${days} days`;
    }
  }

  // Weighted calculation
  // 0.30 * Criticality + 0.30 * HealthVuln + 0.25 * BlastRadius + 0.15 * Warranty
  const wCrit = 0.30;
  const wHealth = 0.30;
  const wBlast = 0.25;
  const wWarranty = 0.15;

  const totalRisk = Math.round(
    wCrit * critPts +
    wHealth * healthVulnPts +
    wBlast * blastPts +
    wWarranty * warrantyPts
  );

  factors.push({
    factor: 'Business Criticality',
    weight: wCrit,
    contribution: Math.round(wCrit * critPts),
    reason: critReason,
  });

  factors.push({
    factor: 'Health & Degradation',
    weight: wHealth,
    contribution: Math.round(wHealth * healthVulnPts),
    reason: healthReason,
  });

  factors.push({
    factor: 'Blast Radius Exposure',
    weight: wBlast,
    contribution: Math.round(wBlast * blastPts),
    reason: blastReason,
  });

  factors.push({
    factor: 'Warranty & Support Risk',
    weight: wWarranty,
    contribution: Math.round(wWarranty * warrantyPts),
    reason: warrantyReason,
  });

  return {
    riskScore: Math.max(0, Math.min(100, totalRisk)),
    factors,
  };
}

/**
 * Traverses the dependency graph downstream using Breadth-First Search (BFS)
 * to calculate Blast Radius and impacted downstream services.
 */
export function traverseBlastRadius(
  rootAssetTag: string,
  relationships: IRelationship[],
  assetsByTag: Map<string, IAsset>
): IBlastRadiusResult {
  const rootAsset = assetsByTag.get(rootAssetTag);
  const rootName = rootAsset ? rootAsset.name : rootAssetTag;

  // Build forward adjacency list
  // Note: sourceAssetTag -> targetAssetTag or upstream -> downstream
  const adj = new Map<string, string[]>();
  for (const rel of relationships) {
    if (!adj.has(rel.sourceAssetTag)) {
      adj.set(rel.sourceAssetTag, []);
    }
    adj.get(rel.sourceAssetTag)!.push(rel.targetAssetTag);
  }

  // BFS
  const visited = new Set<string>();
  const queue: Array<{ tag: string; distance: number }> = [{ tag: rootAssetTag, distance: 0 }];
  visited.add(rootAssetTag);

  const downstreamAssets: IBlastRadiusResult['downstreamAssets'] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.tag !== rootAssetTag) {
      const ast = assetsByTag.get(current.tag);
      downstreamAssets.push({
        assetTag: current.tag,
        name: ast ? ast.name : current.tag,
        category: ast ? ast.category : ('SERVER' as AssetCategory),
        status: ast ? ast.status : 'OPERATIONAL',
        hopDistance: current.distance,
      });
    }

    const neighbors = adj.get(current.tag) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ tag: neighbor, distance: current.distance + 1 });
      }
    }
  }

  // Map compromised business services based on root or downstream assets
  const compromisedServices: IBlastRadiusResult['compromisedServices'] = [];
  let hourlyLoss = 0;
  let totalUsers = 0;

  // Service lookup heuristics
  const downstreamTags = new Set(downstreamAssets.map((d) => d.assetTag));
  downstreamTags.add(rootAssetTag);

  if (downstreamTags.has('AST-SRV-000041') || rootAssetTag === 'AST-SRV-000041' || rootAsset?.name.includes('ERP')) {
    compromisedServices.push({
      serviceName: 'Enterprise SAP / ERP Core',
      slaTier: 'Platinum (99.99%)',
      hourlyRevenueImpact: 45000,
      userCount: 850,
    });
    hourlyLoss += 45000;
    totalUsers += 850;
  }

  if (rootAsset?.category === 'ROUTER' || rootAsset?.category === 'FIREWALL' || rootAsset?.name.includes('Edge')) {
    compromisedServices.push({
      serviceName: 'Corporate WAN & Edge VPN Access',
      slaTier: 'Gold (99.9%)',
      hourlyRevenueImpact: 18000,
      userCount: 1400,
    });
    hourlyLoss += 18000;
    totalUsers += 1400;
  }

  if (downstreamAssets.length > 3 || rootAsset?.criticality === 'TIER_1_CRITICAL') {
    compromisedServices.push({
      serviceName: 'Internal Microservices & Auth Cluster',
      slaTier: 'Tier 1 Mission Critical',
      hourlyRevenueImpact: 22000,
      userCount: 650,
    });
    hourlyLoss += 22000;
    totalUsers += 650;
  }

  // Base fallback if no specific rule matched
  if (compromisedServices.length === 0) {
    const baseLoss = downstreamAssets.length * 3500 + 2000;
    const baseUsers = downstreamAssets.length * 45 + 50;
    compromisedServices.push({
      serviceName: `${rootAsset?.name || 'Departmental Application'} Dependent Service`,
      slaTier: 'Standard (99.5%)',
      hourlyRevenueImpact: baseLoss,
      userCount: baseUsers,
    });
    hourlyLoss += baseLoss;
    totalUsers += baseUsers;
  }

  // Severity rating
  let severity: IBlastRadiusResult['severity'] = 'LOW';
  if (hourlyLoss > 50000 || totalUsers > 1500) {
    severity = 'CATASTROPHIC';
  } else if (hourlyLoss > 20000 || totalUsers > 500) {
    severity = 'HIGH';
  } else if (downstreamAssets.length > 2) {
    severity = 'MEDIUM';
  }

  const recommendedMitigations = [
    `Initiate immediate redundant circuit failover to secondary path.`,
    `Notify service custodians for ${compromisedServices.map((s) => s.serviceName).join(', ')}.`,
    `Schedule urgent hot-swap or maintenance window during off-peak hours.`,
  ];

  return {
    rootAssetTag,
    rootAssetName: rootName,
    severity,
    impactedAssetsCount: downstreamAssets.length,
    impactedServicesCount: compromisedServices.length,
    totalImpactedUsers: totalUsers,
    estimatedHourlyFinancialLoss: hourlyLoss,
    downstreamAssets,
    compromisedServices,
    recommendedMitigations,
  };
}

/**
 * Economic Repair vs Replace Decision Support Engine
 */
export function calculateRepairVsReplace(
  asset: IAsset,
  estimatedImmediateRepairCost: number = 2500,
  failureProb90d: number = 0.45
): IRepairReplaceAnalysis {
  const purchaseDate = new Date(asset.purchaseDate);
  const now = new Date('2026-09-28T00:00:00Z');
  const currentAgeMonths = Math.max(
    1,
    (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (now.getMonth() - purchaseDate.getMonth())
  );
  const lifespan = asset.expectedLifespanMonths || 60;
  const replacementCost = asset.replacementCostEstimate || asset.purchaseCost * 1.15;
  const accumulatedMaint = asset.accumulatedMaintenanceCost || 0;

  // Remaining Useful Life (RUL)
  const remainingLifeMonths = Math.max(0, lifespan - currentAgeMonths);

  // Expected 12-month downtime exposure
  const downtimeExposureAnnual = failureProb90d * 4 * (asset.criticality === 'TIER_1_CRITICAL' ? 12000 : 3500);

  // Net Present Cost of Repairing and Continuing Asset:
  // NPC_Repair = Immediate Repair + (Projected annual maintenance * RUL/12) + Downtime risk
  const projectedAnnualMaint = Math.max(1200, (accumulatedMaint / (currentAgeMonths / 12 || 1)) * 1.25);
  const npcRepair = Math.round(
    estimatedImmediateRepairCost +
    projectedAnnualMaint * Math.min(2, remainingLifeMonths / 12) +
    downtimeExposureAnnual
  );

  // Net Present Cost of Replacing:
  // NPC_Replace = Replacement Cost - Salvage (10%) + Lower initial maintenance ($400/yr)
  const salvageValue = Math.round(asset.purchaseCost * 0.08);
  const npcReplace = Math.round(replacementCost - salvageValue + 400 * 2);

  const rationale: string[] = [];
  let recommendation: IRepairReplaceAnalysis['recommendation'] = 'MONITOR';

  const ageRatio = currentAgeMonths / lifespan;

  if (ageRatio >= 1.0 || npcRepair > 0.70 * npcReplace || failureProb90d > 0.65) {
    recommendation = 'REPLACE';
    rationale.push(`Asset age is ${Math.round(ageRatio * 100)}% of design lifespan (${currentAgeMonths} / ${lifespan} months).`);
    rationale.push(`Repairing carries high 90-day failure risk (${Math.round(failureProb90d * 100)}%) and persistent maintenance drain.`);
    rationale.push(`Net Present Cost to repair ($${npcRepair.toLocaleString()}) approaches new asset investment ($${npcReplace.toLocaleString()}).`);
  } else if (failureProb90d > 0.30 || estimatedImmediateRepairCost > 0) {
    recommendation = 'REPAIR';
    rationale.push(`Asset has ${remainingLifeMonths} months of useful life remaining.`);
    rationale.push(`Immediate repair cost ($${estimatedImmediateRepairCost.toLocaleString()}) is significantly lower than replacement cost ($${replacementCost.toLocaleString()}).`);
    rationale.push(`Targeted preventive repair restores asset health to acceptable thresholds.`);
  } else if (asset.status === 'OFFLINE' || asset.criticality === 'TIER_3_SUPPORT') {
    recommendation = 'RETIRE';
    rationale.push('Ancillary asset with minimal operational demand; decommissioning saves rack space and power.');
  } else {
    recommendation = 'MONITOR';
    rationale.push('Asset operating within standard parameters; continue routine telemetry monitoring.');
  }

  const economicSavingsOpportunity = Math.abs(npcRepair - npcReplace);

  return {
    assetTag: asset.assetTag,
    assetName: asset.name,
    currentAgeMonths,
    expectedLifespanMonths: lifespan,
    accumulatedMaintenanceCost: accumulatedMaint,
    estimatedImmediateRepairCost,
    newAssetReplacementCost: replacementCost,
    failureProbabilityNext90Days: failureProb90d,
    netPresentCostRepair: npcRepair,
    netPresentCostReplace: npcReplace,
    recommendation,
    rationale,
    economicSavingsOpportunity,
  };
}
