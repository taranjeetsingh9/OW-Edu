// routes/planetMode.routes.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

// Import existing controllers
const { simulation, mission } = require("../controllers");

/* ---------------------- Health Check ---------------------- */
router.get("/", (req, res) => res.send("🌍 PlanetMode routes active ✅"));

/* ---------------------- Simulation Routes ---------------------- */
router.get("/config", simulation.getSimulationConfig);
router.post("/simulate", simulation.runSimulation);

/* ---------------------- Mission Routes ---------------------- */
router.get("/missions", mission.getLandingMissions);
router.get("/missions/:id/full", mission.getMissionBundle);

/* ---------------------- Gemini Simulation ---------------------- */
router.post("/gemini-simulate", async (req, res) => {
  const { planet, vehicle, site } = req.body || {};
  const gemini = req.app.locals.gemini;
  const nasaKey = process.env.NASA_API_KEY || "DEMO_KEY";
  const weatherKey = process.env.OPENWEATHER_API_KEY;

  function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ---------- 1. Gemini Simulation ----------
  const prompt = `
Simulate a ${planet} landing using ${vehicle} at ${site}.
Respond with JSON only:
{
 "results": {
   "craterDiameter": "10 m",
   "dustRadius": "50 m",
   "seismicMagnitude": "M 3.2",
   "contaminationLevel": 2,
   "environmentalScore": 92
 },
 "summary": "Short description",
 "risks": ["..."],
 "recommendations": ["..."]
}`;

  let aiData;
  try {
    aiData = await gemini.generateContent(prompt);

    // --- Fallback if Gemini returns plain text ---
    if (!aiData.results && aiData.text) {
      const text = aiData.text;
      aiData.results = {
        craterDiameter:
          text.match(/([0-9.]+)\s*m/i)?.[0] || `${randomRange(10, 60)} m`,
        dustRadius:
          text.match(/dust.*?([0-9.]+)\s*m/i)?.[1] + " m" ||
          `${randomRange(50, 250)} m`,
        seismicMagnitude:
          text.match(/M\s?[0-9.]+/i)?.[0] ||
          `M ${(Math.random() * 2 + 3).toFixed(1)}`,
        contaminationLevel: randomRange(1, 5),
        environmentalScore: randomRange(70, 98),
      };
      aiData.summary = aiData.summary || "Parsed from Gemini text output.";
    }
  } catch {
    aiData = {
      results: {
        craterDiameter: `${randomRange(10, 60)} m`,
        dustRadius: `${randomRange(50, 250)} m`,
        seismicMagnitude: `M ${(Math.random() * 2 + 3).toFixed(1)}`,
        contaminationLevel: randomRange(1, 5),
        environmentalScore: randomRange(70, 98),
      },
      summary: "Fallback simulation result (no Gemini data).",
      risks: [],
      recommendations: [],
    };
  }

  // ---------- 2. Weather ----------
  const weather = { Earth: null, Mars: null, Moon: null };

/* ---------- 2. Earth weather (fixed) ---------- */
let earthWeather = null;
try {
  const city = site || "Timmins";
  const wRes = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
    params: { q: city, appid: weatherKey || process.env.OPENWEATHER_API_KEY, units: "metric" },
  });
  const d = wRes.data;
  earthWeather = {
    city: d.name,
    temp: d.main?.temp?.toFixed(1),
    humidity: d.main?.humidity,
    condition: d.weather?.[0]?.main,
  };
} catch (err) {
  console.warn("⚠️ Earth weather fetch failed:", err.message);
  earthWeather = {
    city: site || "Earth",
    temp: "N/A",
    humidity: "—",
    condition: "No data (check API key or location name)",
  };
}


  // 🔴 Mars weather (NASA InSight)
  try {
    const mRes = await axios.get("https://api.nasa.gov/insight_weather/", {
      params: { api_key: nasaKey, feedtype: "json", ver: "1.0" },
    });
    const data = mRes.data;
    const solKeys = data.sol_keys || [];
    if (solKeys.length) {
      const sol = solKeys[solKeys.length - 1];
      const sData = data[sol];
      weather.Mars = {
        sol,
        tempAvg: sData.AT?.av ?? null,
        pressure: sData.PRE?.av ?? null,
        wind: sData.HWS?.av ?? null,
      };
    } else weather.Mars = { error: "No recent Mars weather data." };
  } catch {
    weather.Mars = { error: "Failed to fetch Mars weather." };
  }

  // 🌕 Moon weather (fictional, via Gemini)
  try {
    const moonPrompt = `Generate a fictional short weather report for the Moon as JSON:
{ "summary": "No atmosphere, extreme cold (-170°C at night)." }`;
    const moonData = await gemini.generateContent(moonPrompt);
    weather.Moon = moonData.summary
      ? moonData
      : { summary: "No atmosphere, extreme temperature fluctuations." };
  } catch {
    weather.Moon = { summary: "No atmosphere, extreme cold at night (-170°C)." };
  }

  // ---------- 3. Near-Earth Object Data ----------
  let neoSummary = null;
  try {
    const today = new Date().toISOString().split("T")[0];
    const neoRes = await axios.get("https://api.nasa.gov/neo/rest/v1/feed", {
      params: { start_date: today, end_date: today, api_key: nasaKey },
    });
    const objs = Object.values(neoRes.data.near_earth_objects || {}).flat();
    neoSummary = {
      totalObjects: objs.length,
      hazardousCount: objs.filter(
        (n) => n.is_potentially_hazardous_asteroid
      ).length,
      closest: objs.length
        ? objs.reduce((a, b) => {
            const aDist = parseFloat(
              a.close_approach_data?.[0]?.miss_distance?.kilometers || 1e9
            );
            const bDist = parseFloat(
              b.close_approach_data?.[0]?.miss_distance?.kilometers || 1e9
            );
            return aDist < bDist ? a : b;
          })
        : null,
    };
  } catch {
    neoSummary = { error: "Failed to fetch NEO data." };
  }

  // ---------- 4. Final Response ----------
  res.json({
    ok: true,
    planet,
    vehicle,
    site,
    results: aiData.results,
    summary: aiData.summary,
    weather,
    neo: neoSummary,
  });
});

/* ---------------------- Gemini Missions ---------------------- */
router.get("/gemini-missions", async (req, res) => {
  const { planet = "Moon", vehicle = "Starship", count = 3 } = req.query;
  const gemini = req.app.locals.gemini;
  const maxCount = Math.min(5, Number(count));

  const prompt = `
Generate ${maxCount} fictional planetary landing missions as JSON.
Each mission must include missionName, era, status, scenario, scoring, and comparison.
Prefer missions targeting "${planet}" using vehicle "${vehicle}".
Return a JSON array.
`;

  const vehicles = [
    "Apollo LM",
    "Starship",
    "Curiosity Rover",
    "Chandrayaan Lander",
    "Artemis Vehicle",
    "BlueMoon Mk-II",
    "DragonXL Cargo",
    "Zephyr Explorer",
  ];
  const planets = ["Earth", "Moon", "Mars"];
  const landingSites = {
    Earth: ["Timmins", "Capio"],
    Moon: ["Mare Tranquillitatis", "Tycho Crater"],
    Mars: ["Jezero Crater", "Elysium Planitia"],
  };

  function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRandomMission() {
    const planet = planets[randomRange(0, planets.length - 1)];
    const vehicle = vehicles[randomRange(0, vehicles.length - 1)];
    const siteList = landingSites[planet] || ["Unknown Site"];
    const site = siteList[randomRange(0, siteList.length - 1)];

    const sci = randomRange(70, 95);
    const safety = randomRange(70, 95);
    const eff = randomRange(70, 95);
    const overall = ((sci + safety + eff) / 3).toFixed(1);

    return {
      missionName: `${vehicle.split(" ")[0]}-${planet}-${randomRange(100, 999)}`,
      era: ["Apollo-era", "Modern", "Future"][randomRange(0, 2)],
      status: ["completed", "planned", "failed"][randomRange(0, 2)],
      scenario: {
        vehicle: { name: vehicle },
        bodyId: planet,
        landingSite: { name: site },
        approach: {
          descentProfile: ["propulsive", "ballistic", "chute-assisted"][
            randomRange(0, 2)
          ],
          entryAngle: randomRange(15, 60),
        },
      },
      scoring: {
        scientificValue: sci,
        safety,
        efficiency: eff,
        overall: Number(overall),
      },
      comparison: {
        historicalBaseline: "apollo11",
        improvement: 25,
        industryAverage: 82,
      },
      isPublic: true,
    };
  }

  try {
    const ai = await gemini.generateContent(prompt);
    let missions = [];
    if (Array.isArray(ai)) missions = ai;
    else if (Array.isArray(ai.missions)) missions = ai.missions;
    else if (ai.mission) missions = [ai.mission];
    if (!missions.length) throw new Error("No missions returned from Gemini.");
    res.json({ ok: true, source: "gemini", missions });
  } catch (err) {
    console.warn("⚠️ Gemini failed, using fallback:", err.message);
    const fallback = Array.from({ length: maxCount }, () => getRandomMission());
    res.json({ ok: true, source: "fallback", missions: fallback });
  }
});

module.exports = router;
