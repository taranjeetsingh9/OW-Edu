// src/utils/riskEngine.js
function normalize(x, min, max) {
    if (max === min) return 0;
    return Math.max(0, Math.min(1, (x - min) / (max - min)));
  }
  
  /**
   * Build a simple, deterministic risk model off your emission summary.
   * Returns per-dimension scores (0-100) and an overall score.
   */
  function computeRiskReport(summary) {
    const { totalsKg, intensity, compliance, assumptions } = summary;
  
    // Heuristics (tweak quickly for demo)
    const co2Risk = Math.round(normalize(totalsKg.co2, 200_000, 700_000) * 100);     // higher CO2 => higher risk
    const noxRisk = Math.round(normalize(totalsKg.nox, 800, 2_500) * 100);            // higher NOx => higher risk
    const payloadUtil = assumptions.payloadUtilizationPercent || 60;                   // % of capacity
    const underUtilPenalty = payloadUtil < 70 ? (70 - payloadUtil) / 70 : 0;           // inefficiency penalty 0..~0.43
    const efficiencyRisk = Math.round(underUtilPenalty * 100);
  
    const complianceRisk =
      (compliance.transportCanada === 'review-required' ? 65 : 25) +
      (compliance.indigenousConsultationRequired ? 20 : 0);                            // add 20 if consultation needed
  
    const siteNotes = (summary.compliance.additionalNotes || []).join(' ').toLowerCase();
    const wildlifeHint = siteNotes.includes('wildlife') ? 15 : 0;
    const localEnvRisk = Math.min(100, (summary.assumptions.adjustments?.length || 0) * 5 + wildlifeHint);
  
    // Weighted overall (show this weight to judges as “transparent scoring”)
    const weights = { co2: 0.30, nox: 0.15, efficiency: 0.15, compliance: 0.30, local: 0.10 };
    const overall =
      Math.round(
        co2Risk * weights.co2 +
        noxRisk * weights.nox +
        efficiencyRisk * weights.efficiency +
        complianceRisk * weights.compliance +
        localEnvRisk * weights.local
      );
  
    // Quick labels for the UI
    const label = overall >= 70 ? 'High' : overall >= 40 ? 'Medium' : 'Low';
  
    // One-click recommendations judges can read in seconds
    const recommendations = [
      payloadUtil < 70 ? 'Increase payload utilization or rideshare to cut intensity' : 'Payload efficiency acceptable',
      totalsKg.co2 > 450_000 ? 'Consider methalox/hydrolox upper stage or trajectory optimization' : 'CO₂ within expected bounds',
      compliance.transportCanada === 'review-required' ? 'Engage Transport Canada pre-brief and file mitigation plan' : 'Standard compliance path',
      compliance.indigenousConsultationRequired ? 'Begin Indigenous consultation early; co-develop monitoring plan' : 'No Indigenous consultation flagged',
    ];
  
    const dimensions = {
      co2Risk, noxRisk, efficiencyRisk, complianceRisk, localEnvRisk
    };
  
    return {
      overall: { score: overall, label },
      dimensions,
      recommendations
    };
  }
  
  module.exports = { computeRiskReport };
  