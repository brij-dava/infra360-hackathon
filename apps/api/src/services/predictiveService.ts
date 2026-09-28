import { db } from '../storage/db';
import { IPredictiveFailureResult } from '@infra360/types';

export class PredictiveService {
  public static predictAssetFailure(assetTag: string): IPredictiveFailureResult | null {
    const asset = db.assets.findOne({ assetTag });
    if (!asset) return null;

    const maintenanceList = db.maintenance.find({ assetTag });
    const emergencyFails = maintenanceList.filter((m) => m.type === 'EMERGENCY_REPAIR').length;

    // Feature values
    const purchaseDate = new Date(asset.purchaseDate);
    const now = new Date('2026-09-28T00:00:00Z');
    const ageMonths = Math.max(
      1,
      (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
        (now.getMonth() - purchaseDate.getMonth())
    );
    const lifespanMonths = asset.expectedLifespanMonths || 60;
    const ageRatio = ageMonths / lifespanMonths;

    const temp = asset.telemetry?.temperatureCelsius || 45;
    const cpu = asset.telemetry?.cpuUtilizationPct || 30;
    const errRate = asset.telemetry?.errorRatePerMin || 0;

    // Multi-variate logistic risk function
    // z = w_age*ageRatio + w_fails*fails + w_temp*(temp-50)/20 + w_err*errRate/10
    const z =
      1.6 * (ageRatio - 0.7) +
      0.8 * emergencyFails +
      1.1 * ((temp - 55) / 20) +
      0.5 * (errRate / 10) +
      (asset.status === 'DEGRADED' ? 1.2 : 0);

    // Sigmoid probability: 1 / (1 + exp(-z))
    const rawProb = 1 / (1 + Math.exp(-z));
    const failureProb = Math.min(0.96, Math.max(0.04, Math.round(rawProb * 100) / 100));

    // Predicted MTBF in days: 10 to 180 days inversely proportional to failure probability
    const predictedDays = Math.max(7, Math.round((1 - failureProb) * 120 + 10));

    // Contributing feature importances
    const factors: IPredictiveFailureResult['keyContributingFactors'] = [];

    if (ageRatio >= 0.8) {
      factors.push({
        feature: 'Operational Age Degradation',
        impact: Math.round(Math.min(0.40, ageRatio * 0.25) * 100),
        description: `Asset is ${Math.round(ageMonths / 12 * 10) / 10}y old, exceeding ${Math.round(ageRatio * 100)}% of design lifecycle`,
      });
    }

    if (emergencyFails > 0) {
      factors.push({
        feature: 'Historic Failure Cluster',
        impact: Math.min(35, emergencyFails * 12),
        description: `${emergencyFails} emergency breakdown incident(s) logged in past cycle`,
      });
    }

    if (temp >= 65) {
      factors.push({
        feature: 'Elevated Operating Temperature',
        impact: Math.round(((temp - 50) / 30) * 25),
        description: `Chassis thermal sensor reports ${temp}°C (optimal < 60°C)`,
      });
    }

    if (errRate >= 5) {
      factors.push({
        feature: 'Interface Error Packet Spikes',
        impact: Math.min(20, Math.round(errRate * 1.5)),
        description: `Bus/network error counter is ${errRate}/min, indicating signal degradation`,
      });
    }

    if (factors.length === 0) {
      factors.push({
        feature: 'Routine Component Aging',
        impact: 15,
        description: 'Standard operational wear within manufacturer specifications',
      });
    }

    // Prescriptive actions
    const prescriptiveActions: string[] = [];
    if (failureProb >= 0.70) {
      prescriptiveActions.push('Schedule urgent maintenance window within 14 calendar days.');
      prescriptiveActions.push('Perform thermal repasting and hot-swap redundant power module.');
      prescriptiveActions.push('Execute non-disruptive workload failover to standby replica.');
    } else if (failureProb >= 0.40) {
      prescriptiveActions.push('Queue for routine diagnostic inspection during next off-peak window.');
      prescriptiveActions.push('Monitor IPMI thermal logs and fan speed PWM curves.');
    } else {
      prescriptiveActions.push('No immediate intervention required. Maintain standard 90-day inspection schedule.');
    }

    return {
      assetTag,
      failureProbabilityNext90Days: failureProb,
      predictedTimeToFailureDays: predictedDays,
      confidenceScore: 0.89,
      keyContributingFactors: factors,
      prescriptiveActions,
    };
  }

  public static getFleetHighRisk() {
    const assets = db.assets.find();
    const scored = assets
      .map((a) => {
        const pred = this.predictAssetFailure(a.assetTag);
        return {
          asset: a,
          prediction: pred,
        };
      })
      .filter((item) => item.prediction && item.prediction.failureProbabilityNext90Days >= 0.50)
      .sort((a, b) => b.prediction!.failureProbabilityNext90Days - a.prediction!.failureProbabilityNext90Days)
      .slice(0, 15);

    return scored;
  }
}
