// controllers/simulation.controller.js
const axios = require("axios");

// ---------- Simulation Config (for dropdowns in frontend) ----------
exports.getSimulationConfig = async (req, res) => {
  try {
    res.json({
      planets: ["Earth", "Moon", "Mars"],
      vehicles: [
        "Apollo LM",
        "Starship",
        "Curiosity Rover",
        "Chandrayaan Lander",
        "Artemis Vehicle",
      ],
      sites: {
        Earth: ["Timmins", "Capio"],
        Moon: ["Mare Tranquillitatis", "Tycho Crater"],
        Mars: ["Jezero Crater", "Elysium Planitia"],
      },
    });
  } catch (err) {
    console.error(" Error in getSimulationConfig:", err);
    res.status(500).json({ error: "Failed to load simulation config" });
  }
};

// ---------- Utility: Random number range ----------
function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------- Landing Simulation (Gemini + Weather + NEO + fallback) ----------
exports.runSimulation = async (req, res) => {
  try {
    const { planet, vehicle, site } = req.body || {};
    const nasaKey = process.env.NASA_API_KEY || "DEMO_KEY";
    const weatherKey = process.env.OPENWEATHER_API_KEY;
    const gemini = req.app.locals.gemini;

    /* ---------- Gemini Simulation ---------- */
    const prompt = `
    Respond ONLY with valid JSON, no explanation, no markdown, no extra text.
    If you cannot produce JSON, return an empty JSON object {}.
    
    {
     "results": {
       "craterDiameter": "string",
       "dustRadius": "string",
       "seismicMagnitude": "string",
       "contaminationLevel": number,
       "environmentalScore": number
     },
     "summary": "short text",
     "risks": ["text"],
     "recommendations": ["text"]
    }
    
    Simulate a ${planet} landing using ${vehicle} at ${site}.
    Return ONLY the JSON above.
    `;
    let aiData;
    try {
      aiData = await gemini.generateContent(prompt);
    } catch {
      aiData = {
        results: {
          craterDiameter: `${randomRange(10, 60)} m`,
          dustRadius: `${randomRange(50, 250)} m`,
          seismicMagnitude: `M ${(Math.random() * 2 + 3).toFixed(1)}`,
          contaminationLevel: randomRange(1, 5),
          environmentalScore: randomRange(70, 98),
        },
        summary: "Heuristic fallback simulation result.",
        risks: [],
        recommendations: [],
      };
    }

    /* ---------- Earth Weather (Timmins + Capio only) ---------- */
    const earthWeather = {};
    if (weatherKey) {
      for (const city of ["Timmins", "Capio"]) {
        try {
          const wRes = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
            params: { q: city, appid: weatherKey, units: "metric" },
          });
          const d = wRes.data;
          earthWeather[city] = {
            city: d.name,
            temp: d.main?.temp,
            humidity: d.main?.humidity,
            condition: d.weather?.[0]?.main,
          };
        } catch (err) {
          earthWeather[city] = { error: `Failed to fetch weather for ${city}` };
        }
      }
    } else {
      earthWeather.error = "OPENWEATHER_API_KEY not configured.";
    }

    /* ---------- Mars Weather ---------- */
    let marsWeather = null;
    try {
      const mRes = await axios.get("https://api.nasa.gov/insight_weather/", {
        params: { api_key: nasaKey, feedtype: "json", ver: "1.0" },
      });
      const data = mRes.data;
      const solKeys = data.sol_keys || [];
      if (solKeys.length) {
        const sol = solKeys[solKeys.length - 1];
        const sData = data[sol];
        marsWeather = {
          sol,
          tempAvg: sData.AT?.av ?? null,
          pressure: sData.PRE?.av ?? null,
          wind: sData.HWS?.av ?? null,
        };
      } else marsWeather = { error: "No recent Mars weather data." };
    } catch {
      marsWeather = { error: "Failed to fetch Mars weather." };
    }

    /* ---------- Moon Weather (Fictional) ---------- */
    let moonWeather = { summary: "No atmosphere, extreme cold (-170°C at night)." };

    try {
      const moonPrompt = `
    Return ONLY valid JSON. No markdown. No explanation. No extra text.
    
    {
      "summary": "No atmosphere, extreme cold (-170°C at night)."
    }
    
    Generate a fictional short weather report for the Moon.
    Replace the summary with a realistic variation.
    Return ONLY the JSON object.
    `;
    
      const moonData = await gemini.generateContent(moonPrompt);
    
      // Accept JSON only
      if (moonData && moonData.summary) {
        moonWeather = moonData;
      }
    } catch (err) {
      console.warn("Moon weather Gemini failed:", err.message);
    }
    

    /* ---------- NEO (Near-Earth Objects) ---------- */
    let neoSummary = null;
    try {
      const today = new Date().toISOString().split("T")[0];
      const neoRes = await axios.get("https://api.nasa.gov/neo/rest/v1/feed", {
        params: { start_date: today, end_date: today, api_key: nasaKey },
      });
      const objs = Object.values(neoRes.data.near_earth_objects || {}).flat();
      neoSummary = {
        totalObjects: objs.length,
        hazardousCount: objs.filter((n) => n.is_potentially_hazardous_asteroid).length,
      };
    } catch {
      neoSummary = { error: "Failed to fetch NEO data." };
    }

    /* ---------- Final Response ---------- */
    res.json({
      ok: true,
      planet,
      vehicle,
      site,
      results: aiData.results,
      summary: aiData.summary,
      weather: { Earth: earthWeather, Mars: marsWeather, Moon: moonWeather },
      neo: neoSummary,
    });
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
