// src/services/greenlaunchAiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { computeEmissionSummary } = require('../utils/emissionCalculator');

const MODEL_NAME = 'gemini-1.5-pro-latest';

function buildPrompt(summary, tone) {
  return `
You are a sustainability analyst AI for a Canadian STEM program.

Launch Site: ${summary.launchSite}
Rocket: ${summary.rocket}
Destination: ${summary.destination}
Payload Mass: ${summary.assumptions.payloadMassKg} kg
Mission Duration: ${summary.assumptions.missionDurationDays} days

Total Emissions (kg):
- CO2: ${summary.totalsKg.co2}
- NOx: ${summary.totalsKg.nox}
- Black Carbon: ${summary.totalsKg.blackCarbon}
- Water Vapor: ${summary.totalsKg.waterVapor}

Emission intensity:
- ${summary.intensity.perKgPayload} kg CO2 per kg payload
- ${summary.intensity.perKm} kg CO2 per km

Compliance:
- Transport Canada: ${summary.compliance.transportCanada}
- Indigenous consultation required: ${summary.compliance.indigenousConsultationRequired}
- Notes: ${summary.compliance.additionalNotes.join('; ')}

Produce a concise launch briefing in a ${tone} tone.
Explain the emission numbers, flag Ontario-specific compliance concerns, and suggest:
1. A technical optimization (fuel/trajectory/hardware).
2. An operational optimization (weather window, community engagement, offsets).

Use short bullet points followed by a single actionable takeaway for students.
`;
}

async function generateMissionBrief(payload) {
  const summary = computeEmissionSummary(payload);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  const prompt = buildPrompt(summary, payload.tone || 'educator');
  const geminiResponse = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  return {
    summary,
    advisory: geminiResponse.response.text()
  };
}

module.exports = {
  generateMissionBrief
};