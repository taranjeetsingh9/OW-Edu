const axios = require('axios');
const { computeEmissionSummary } = require('../utils/emissionCalculator');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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
1 technical optimization,
1 operational optimization.

Finish with one actionable sustainability takeaway for students.
  `;
}

async function generateMissionBrief(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const summary = computeEmissionSummary(payload);
  const prompt = buildPrompt(summary, payload.tone || "educator");

  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${apiKey}`,
      {
        contents: [
          { parts: [{ text: prompt }] }
        ],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7
        }
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text
      || "No AI response";

    return {
      summary,
      advisory: text
    };

  } catch (err) {
    console.error("Gemini error:", err.response?.status, err.message);

    return {
      summary,
      advisory: "AI system unavailable. Please try again later."
    };
  }
}

module.exports = { generateMissionBrief };
