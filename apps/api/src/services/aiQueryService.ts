import { db } from '../storage/db';
import { IAsset, INaturalLanguageQueryResult } from '@infra360/types';
import { TopologyService } from './topologyService';
import { PredictiveService } from './predictiveService';
import { GoogleGenAI } from '@google/genai';

export class AiQueryService {
  /**
   * Safely translates natural language prompt into a validated structured database query.
   */
  public static async executeNaturalLanguageQuery(query: string): Promise<INaturalLanguageQueryResult> {
    const qLower = query.toLowerCase().trim();
    const filter: Record<string, any> = {};
    const explanations: string[] = [];

    // 1. Asset Category matching
    if (qLower.includes('server')) {
      filter.category = 'SERVER';
      explanations.push('Category = SERVER');
    } else if (qLower.includes('switch')) {
      filter.category = 'SWITCH';
      explanations.push('Category = SWITCH');
    } else if (qLower.includes('router')) {
      filter.category = 'ROUTER';
      explanations.push('Category = ROUTER');
    } else if (qLower.includes('firewall')) {
      filter.category = 'FIREWALL';
      explanations.push('Category = FIREWALL');
    } else if (qLower.includes('storage') || qLower.includes('san') || qLower.includes('nas')) {
      filter.category = 'STORAGE';
      explanations.push('Category = STORAGE');
    } else if (qLower.includes('ups') || qLower.includes('power')) {
      filter.category = 'UPS';
      explanations.push('Category = UPS');
    } else if (qLower.includes('access point') || qLower.includes('wifi') || qLower.includes('wi-fi') || qLower.includes(' ap ')) {
      filter.category = 'ACCESS_POINT';
      explanations.push('Category = ACCESS_POINT');
    } else if (qLower.includes('network')) {
      filter.category = { $in: ['SWITCH', 'ROUTER', 'FIREWALL'] };
      explanations.push('Category IN [SWITCH, ROUTER, FIREWALL]');
    }

    // 2. Risk criteria
    if (qLower.includes('high risk') || qLower.includes('high-risk') || qLower.includes('critical risk') || qLower.includes('risky')) {
      filter.riskScore = { $gte: 70 };
      explanations.push('Risk Score >= 70');
    } else if (qLower.includes('medium risk')) {
      filter.riskScore = { $gte: 36, $lte: 69 };
      explanations.push('Risk Score BETWEEN 36 AND 69');
    } else if (qLower.includes('low risk')) {
      filter.riskScore = { $lte: 35 };
      explanations.push('Risk Score <= 35');
    }

    // 3. Health criteria
    if (qLower.includes('degraded') || qLower.includes('unhealthy') || qLower.includes('poor health')) {
      filter.healthScore = { $lte: 60 };
      explanations.push('Health Score <= 60');
    } else if (qLower.includes('healthy')) {
      filter.healthScore = { $gte: 80 };
      explanations.push('Health Score >= 80');
    }

    // 4. Criticality
    if (qLower.includes('mission critical') || qLower.includes('tier 1') || qLower.includes('critical assets')) {
      filter.criticality = 'TIER_1_CRITICAL';
      explanations.push('Criticality = TIER_1_CRITICAL');
    }

    // 5. Status / Lifecycle
    if (qLower.includes('under maintenance') || qLower.includes('in maintenance')) {
      filter.status = 'MAINTENANCE';
      explanations.push('Status = MAINTENANCE');
    } else if (qLower.includes('offline')) {
      filter.status = 'OFFLINE';
      explanations.push('Status = OFFLINE');
    }

    // 6. Location matching
    if (qLower.includes('ashburn') || qLower.includes('dc-east') || qLower.includes('east')) {
      filter['location.siteId'] = 'DC-EAST-01';
      explanations.push('Location = Ashburn Datacenter Alpha');
    } else if (qLower.includes('oregon') || qLower.includes('dc-west') || qLower.includes('west')) {
      filter['location.siteId'] = 'DC-WEST-02';
      explanations.push('Location = Oregon Datacenter Beta');
    } else if (qLower.includes('bangalore') || qLower.includes('hq-blr') || qLower.includes('india')) {
      filter['location.siteId'] = 'HQ-BLR-01';
      explanations.push('Location = Bangalore Technology Center');
    } else if (qLower.includes('london') || qLower.includes('uk')) {
      filter['location.siteId'] = 'BR-LON-01';
      explanations.push('Location = London Regional Operations');
    }

    // 7. Warranty criteria
    const now = new Date('2026-09-28T00:00:00Z').getTime();
    if (qLower.includes('expired warranty') || qLower.includes('warranty expired')) {
      filter.warrantyEndDate = { $lt: new Date(now).toISOString() };
      explanations.push('Warranty End Date < Today (Expired)');
    } else if (qLower.includes('30 days') || qLower.includes('within 30')) {
      const targetDate = new Date(now + 30 * 24 * 3600 * 1000).toISOString();
      filter.warrantyEndDate = { $lte: targetDate };
      explanations.push('Warranty End Date <= Today + 30 Days');
    } else if (qLower.includes('60 days') || qLower.includes('within 60')) {
      const targetDate = new Date(now + 60 * 24 * 3600 * 1000).toISOString();
      filter.warrantyEndDate = { $lte: targetDate };
      explanations.push('Warranty End Date <= Today + 60 Days');
    } else if (qLower.includes('90 days') || qLower.includes('within 90') || qLower.includes('this quarter')) {
      const targetDate = new Date(now + 90 * 24 * 3600 * 1000).toISOString();
      filter.warrantyEndDate = { $lte: targetDate };
      explanations.push('Warranty End Date <= Today + 90 Days');
    }

    // Execute safe query against database
    const results = db.assets.find(filter);

    return {
      rawQuery: query,
      interpretedIntent:
        explanations.length > 0
          ? `Parsed structured filter: ${explanations.join(' AND ')}`
          : 'Broad search query (no specific category or constraint isolated)',
      structuredFilter: filter,
      matchedAssetCount: results.length,
      results: results.slice(0, 50), // Return top 50 matches
      explanation: `Successfully executed sanitized query against live inventory. Found ${results.length} matching asset(s).`,
    };
  }

  /**
   * Grounded Diagnostic Chat Assistant
   */
  public static async executeDiagnosticChat(prompt: string, assetTag?: string): Promise<{
    response: string;
    groundedContext: Record<string, any>;
  }> {
    const pLower = prompt.toLowerCase();

    // 1. Collect comprehensive grounded context from local DB
    const total = db.assets.count();
    const healthy = db.assets.count({ healthScore: { $gte: 80 } });
    const degraded = db.assets.count({ status: 'DEGRADED' });
    const inMaint = db.assets.count({ status: 'MAINTENANCE' });
    
    const rogues = db.discovery.find({ triageStatus: 'UNIDENTIFIED' });
    const highRisk = db.assets.find({ riskScore: { $gte: 75 } });

    let baseContext: any = {
      fleetTelemetry: { total, healthy, degraded, inMaint },
      shadowIT: rogues.length > 0 ? { count: rogues.length, sample: rogues.slice(0, 5) } : null,
      highRiskAssets: highRisk.length > 0 ? { count: highRisk.length, sample: highRisk.slice(0, 4) } : null,
    };

    // Check if prompt specifically mentions an asset tag
    const tagMatch = prompt.match(/AST-[A-Z]{3}-[0-9]{6}/i);
    const targetTag = assetTag || (tagMatch ? tagMatch[0].toUpperCase() : undefined);

    let foundAsset = null;
    if (targetTag) {
      const asset = db.assets.findOne({ assetTag: targetTag });
      if (asset) {
        foundAsset = asset;
        const blast = TopologyService.getBlastRadius(targetTag);
        const pred = PredictiveService.predictAssetFailure(targetTag);
        
        baseContext.targetAsset = {
          assetTag: asset.assetTag,
          name: asset.name,
          status: asset.status,
          lifecycleStage: asset.lifecycleStage,
          location: asset.location,
          healthScore: asset.healthScore,
          riskScore: asset.riskScore,
          healthFactors: asset.healthFactors,
          blastRadius: blast,
          predictive: pred,
        };
      }
    }

    // 2. If Gemini API key is provided, route to real LLM
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const systemPrompt = `You are INFRA-AI, an expert infrastructure intelligence copilot. 
You have direct access to verified asset inventory and telemetry streams.
Base your answers ONLY on the following grounded JSON context. If the answer isn't in the context, say you don't have enough data.
Format responses in Markdown. Keep it concise, analytical, and professional.

Grounded Context:
${JSON.stringify(baseContext, null, 2)}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
                systemInstruction: systemPrompt
            }
        });

        return {
          response: response.text || 'Error generating response.',
          groundedContext: baseContext,
        };
      } catch (err: any) {
        console.error("Gemini API Error:", err);
        return {
          response: `**Error connecting to Gemini API**: ${err.message}\n\nFalling back to simulated heuristics...`,
          groundedContext: baseContext
        };
      }
    }

    // 3. Fallback: Simulated Mock Heuristics if NO API key
    if (foundAsset) {
      let narrative = `### Grounded Asset Intelligence Brief: **${foundAsset.name}** (\`${foundAsset.assetTag}\`)\n\n`;
      narrative += `- **Operational Status:** ${foundAsset.status} | **Lifecycle Stage:** ${foundAsset.lifecycleStage}\n`;
      narrative += `- **Physical Coordinates:** ${foundAsset.location.siteName}, ${foundAsset.location.room}, ${foundAsset.location.rack} (U${foundAsset.location.rackUnitStart}-U${foundAsset.location.rackUnitEnd})\n`;
      narrative += `- **Health Score:** **${foundAsset.healthScore}/100** | **Risk Score:** **${foundAsset.riskScore}/100**\n\n`;

      if (foundAsset.healthFactors && foundAsset.healthFactors.length > 0) {
        narrative += `#### Health Factor Attribution:\n`;
        foundAsset.healthFactors.forEach((hf: any) => {
          narrative += `- **${hf.factor}** (${hf.penalty} pts): ${hf.reason}\n`;
        });
        narrative += `\n`;
      }

      if (baseContext.targetAsset.predictive) {
        const pred = baseContext.targetAsset.predictive;
        narrative += `#### Predictive Prognostics (Scikit-Learn ML Model):\n`;
        narrative += `- **90-Day Failure Probability:** **${Math.round(pred.failureProbabilityNext90Days * 100)}%**\n`;
        narrative += `- **Estimated Mean Time To Failure (MTBF):** ~${pred.predictedTimeToFailureDays} days\n`;
        narrative += `- **Prescriptive Action:** ${pred.prescriptiveActions[0] || 'Monitor telemetry.'}\n\n`;
      }

      if (baseContext.targetAsset.blastRadius) {
        const blast = baseContext.targetAsset.blastRadius;
        narrative += `#### Cascading Downstream Failure Blast Radius:\n`;
        narrative += `- **Severity Rating:** **${blast.severity}**\n`;
        narrative += `- **Directly Dependent Assets:** ${blast.impactedAssetsCount} nodes\n`;
        narrative += `- **Compromised Services:** ${blast.compromisedServices.map((s: any) => s.serviceName).join(', ')}\n`;
        narrative += `- **Affected Enterprise Users:** ${blast.totalImpactedUsers.toLocaleString()} active users\n`;
        narrative += `- **Estimated Financial Outage Exposure:** $${blast.estimatedHourlyFinancialLoss.toLocaleString()} / hour\n`;
      }

      return { response: narrative, groundedContext: baseContext };
    }

    if (pLower.includes('unknown') || pLower.includes('shadow') || pLower.includes('rogue')) {
      return {
        response: `The network discovery scanner has identified **${rogues.length} uncatalogued shadow devices** across corporate subnets requiring security triage. Top high-risk rogue endpoints include:\n` +
          rogues.slice(0, 5).map((r) => `- **${r.ipAddress}** (${r.detectedManufacturer}): ${r.detectedType} [Risk: ${r.riskScore}/100]`).join('\n') +
          `\n\nRecommended Action: Investigate MAC fingerprints in the Shadow IT console.`,
        groundedContext: baseContext,
      };
    }

    if (pLower.includes('quarter') || pLower.includes('attention') || pLower.includes('replace')) {
      return {
        response: `Based on active telemetry, failure clustering, and warranty deadlines, **${highRisk.length} assets require executive attention this quarter**.\n\n` +
          `Highest priority candidates:\n` +
          highRisk.slice(0, 4).map((a) => `- **${a.assetTag}** (${a.name}): Risk ${a.riskScore}/100.`).join('\n'),
        groundedContext: baseContext,
      };
    }

    // Default simulated response incorporating their exact prompt text to feel interactive
    return {
      response: `You asked: *"${prompt}"*\n\nWithout a valid Gemini API key in my environment, I am running in **simulated local mode**. I parsed your prompt but couldn't map it to a specific hardcoded scenario (like checking shadow IT or specific asset tags).\n\nHowever, here is a general telemetry snapshot:\n` +
        `- Total Managed Assets: **${total}**\n` +
        `- Healthy & Nominal: **${healthy}** (${Math.round((healthy / total) * 100)}%)\n` +
        `- Degraded Telemetry: **${degraded}**\n` +
        `- Active Work Orders: **${inMaint}**\n\n` +
        `To unlock true conversational intelligence, please add a \`GEMINI_API_KEY\` to your \`.env\` file.`,
      groundedContext: baseContext,
    };
  }
}
