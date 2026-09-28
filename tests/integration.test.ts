/**
 * INFRA360 Comprehensive Automated Verification Suite
 * Validates domain engines, scoring explainability, blast radius BFS, and live API endpoints.
 */

async function runTests() {
  console.log('=======================================================');
  console.log('🧪 RUNNING INFRA360 AUTOMATED TEST SUITE');
  console.log('=======================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  const BASE_URL = 'http://localhost:5000/api';

  try {
    // 1. Health Endpoint Test
    console.log('\n--- 1. API Gateway & Health Telemetry ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'Health endpoint responds with HTTP 200');
    const healthData = await healthRes.json();
    assert(healthData.status === 'HEALTHY', 'Service status is HEALTHY');
    assert(healthData.database.totalAssets >= 500, `Fleet assets loaded: ${healthData.database.totalAssets} (>= 500)`);
    assert(healthData.database.totalShadowDevices === 13, `Shadow IT rogue devices loaded: ${healthData.database.totalShadowDevices} (== 13)`);

    // 2. Asset Retrieval & Scoring Explainability
    console.log('\n--- 2. Digital Twin & Explainable Scoring ---');
    const heroAssetRes = await fetch(`${BASE_URL}/assets/AST-SRV-000041`);
    assert(heroAssetRes.status === 200, 'Hero Asset AST-SRV-000041 retrieved');
    const heroAssetData = await heroAssetRes.json();
    const asset = heroAssetData.asset;
    assert(asset.assetTag === 'AST-SRV-000041', 'Asset Tag matches AST-SRV-000041');
    assert(asset.status === 'DEGRADED', 'Asset status is DEGRADED as specified in hero story');
    assert(asset.criticality === 'TIER_1_CRITICAL', 'Asset is TIER_1_CRITICAL');
    assert(asset.healthFactors && asset.healthFactors.length > 0, `Explainable health factors present (${asset.healthFactors.length} factors)`);
    assert(asset.riskFactors && asset.riskFactors.length > 0, `Explainable risk factors present (${asset.riskFactors.length} factors)`);
    assert(asset.riskScore >= 70, `Asset risk score is HIGH (${asset.riskScore}/100)`);

    // 3. Topology & Failure Blast Radius Simulation
    console.log('\n--- 3. Graph Dependency & Failure Blast Radius ---');
    const blastRes = await fetch(`${BASE_URL}/topology/blast-radius/AST-SRV-000041`);
    assert(blastRes.status === 200, 'Blast radius endpoint responds HTTP 200');
    const blastData = await blastRes.json();
    const blast = blastData.blastRadius;
    assert(blast.severity === 'CATASTROPHIC' || blast.severity === 'HIGH', `Blast severity categorized correctly: ${blast.severity}`);
    assert(blast.totalImpactedUsers >= 500, `Impacted active users calculated: ${blast.totalImpactedUsers}`);
    assert(blast.estimatedHourlyFinancialLoss > 0, `Hourly outage cost calculated: $${blast.estimatedHourlyFinancialLoss.toLocaleString()}/hr`);
    assert(blast.compromisedServices.length > 0, `Compromised services identified: ${blast.compromisedServices.map((s: any) => s.serviceName).join(', ')}`);

    // 4. Grounded AI Natural Language Query Parser
    console.log('\n--- 4. Grounded INFRA-AI Natural Language Query ---');
    const aiQueryRes = await fetch(`${BASE_URL}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Show high-risk servers' }),
    });
    assert(aiQueryRes.status === 200, 'AI Query endpoint responds HTTP 200');
    const aiQueryData = await aiQueryRes.json();
    assert(aiQueryData.structuredFilter.category === 'SERVER', 'AI accurately extracted Category=SERVER filter');
    assert(aiQueryData.structuredFilter.riskScore !== undefined, 'AI accurately extracted Risk constraint');
    assert(aiQueryData.matchedAssetCount > 0, `Live database matches returned: ${aiQueryData.matchedAssetCount} assets`);
    assert(Array.isArray(aiQueryData.results), 'Results returned as verified array of assets');

    // 5. Grounded Diagnostic Chat
    console.log('\n--- 5. Grounded Diagnostic Assistant ---');
    const aiChatRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'What happens if AST-SRV-000041 fails?' }),
    });
    assert(aiChatRes.status === 200, 'AI Chat endpoint responds HTTP 200');
    const aiChatData = await aiChatRes.json();
    assert(aiChatData.response.includes('AST-SRV-000041'), 'Response contains targeted asset context');
    assert(aiChatData.groundedContext.blastRadius !== undefined, 'Grounded telemetry context attached');

    // 6. Economic Repair vs Replace Decision Support
    console.log('\n--- 6. Repair vs. Replace Economic Decision Model ---');
    const repRes = await fetch(`${BASE_URL}/analytics/repair-replace/AST-SRV-000041`);
    assert(repRes.status === 200, 'Repair-vs-Replace endpoint responds HTTP 200');
    const repData = await repRes.json();
    const rep = repData.analysis;
    assert(rep.recommendation === 'REPLACE', `Economic decision model recommended: ${rep.recommendation}`);
    assert(rep.netPresentCostRepair > 0, `NPC Repair calculated: $${rep.netPresentCostRepair}`);
    assert(rep.netPresentCostReplace > 0, `NPC Replace calculated: $${rep.netPresentCostReplace}`);
    assert(rep.rationale.length >= 2, `Decision rationale points provided: ${rep.rationale.length}`);

    // 7. Predictive Maintenance Prognostics
    console.log('\n--- 7. Machine Learning Predictive Prognostics ---');
    const predRes = await fetch(`${BASE_URL}/predictive/AST-SRV-000041`);
    assert(predRes.status === 200, 'Predictive endpoint responds HTTP 200');
    const predData = await predRes.json();
    const pred = predData.prediction;
    assert(pred.failureProbabilityNext90Days >= 0.70, `90-day failure probability: ${Math.round(pred.failureProbabilityNext90Days * 100)}% (>= 70%)`);
    assert(pred.predictedTimeToFailureDays > 0, `Predicted MTBF: ${pred.predictedTimeToFailureDays} days`);
    assert(pred.keyContributingFactors.length > 0, 'Top contributing telemetry features returned');

    // 8. Shadow IT Discovery & One-Click Triage
    console.log('\n--- 8. Shadow IT Discovery & Triage ---');
    const discRes = await fetch(`${BASE_URL}/discovery`);
    assert(discRes.status === 200, 'Discovery endpoint responds HTTP 200');
    const discData = await discRes.json();
    assert(discData.devices.length >= 13, `Discovered devices found: ${discData.devices.length} (>= 13)`);
    const rogue = discData.devices[0];

    // Triage test
    const triageRes = await fetch(`${BASE_URL}/discovery/${rogue.id}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REGISTERED', targetCategory: 'SERVER' }),
    });
    assert(triageRes.status === 200, 'Triage endpoint responds HTTP 200');
    const triageData = await triageRes.json();
    assert(triageData.device.triageStatus === 'REGISTERED', 'Device status transitioned to REGISTERED');
    assert(triageData.registeredAsset !== undefined, `New managed asset created: ${triageData.registeredAsset?.assetTag}`);

    // 9. QR Code Generation
    console.log('\n--- 9. Physical QR Code Deep-Link Generator ---');
    const qrRes = await fetch(`${BASE_URL}/assets/AST-SRV-000041/qr`);
    assert(qrRes.status === 200, 'QR endpoint responds HTTP 200');
    const qrData = await qrRes.json();
    assert(qrData.dataUrl && qrData.dataUrl.startsWith('data:image/png;base64,'), 'High-density Base64 QR code generated');
    assert(qrData.scanUrl.includes('/scan/AST-SRV-000041'), 'Scan URL contains valid deep link');

    // 10. Immutable Audit Ledger
    console.log('\n--- 10. Immutable Governance Audit Ledger ---');
    const auditRes = await fetch(`${BASE_URL}/audit`);
    assert(auditRes.status === 200, 'Audit endpoint responds HTTP 200');
    const auditData = await auditRes.json();
    assert(auditData.logs.length > 0, `Audit logs present: ${auditData.logs.length} transactions recorded`);
    assert(auditData.logs[0].diff !== undefined, 'Audit record contains JSON state diff');

  } catch (err: any) {
    console.error('Test Execution Error:', err);
    failed++;
  }

  console.log('\n=======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
