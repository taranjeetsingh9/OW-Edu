// controllers/mission.controller.js
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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

/* ---------- Utility: Random Mission Generator ---------- */
function getRandomMission() {
  const planet = planets[randomRange(0, planets.length - 1)];
  const vehicle = vehicles[randomRange(0, vehicles.length - 1)];
  const siteList = landingSites[planet];
  const site = siteList[randomRange(0, siteList.length - 1)];

  const sci = randomRange(70, 95);
  const safety = randomRange(70, 95);
  const eff = randomRange(70, 95);
  const overall = ((sci + safety + eff) / 3).toFixed(1);

  return {
    _id: `auto-${Math.random().toString(36).slice(2, 8)}`,
    missionName: `${vehicle.split(" ")[0]}-${planet}-${randomRange(100, 999)}`,
    era: ["Apollo-era", "Modern", "Future"][randomRange(0, 2)],
    status: ["completed", "planned", "failed"][randomRange(0, 2)],
    scenario: {
      vehicle: { name: vehicle },
      bodyId: planet,
      landingSite: { name: site },
      approach: {
        descentProfile: ["propulsive", "ballistic", "chute-assisted"][randomRange(0, 2)],
        entryAngle: randomRange(15, 60),
      },
    },
    scoring: {
      scientificValue: sci,
      safety,
      efficiency: eff,
      overall: Number(overall),
    },
    comparison: { historicalBaseline: "apollo11", improvement: 25, industryAverage: 82 },
    timestampsBlock: {
      simulatedAt: new Date(),
      completedAt: new Date(Date.now() + 5 * 60 * 1000),
    },
    isPublic: true,
  };
}

/* ---------- 1. Fetch AI or fallback missions ---------- */
exports.getLandingMissions = async (req, res) => {
  try {
    const gemini = req.app.locals.gemini;
    const { planet = "Moon", vehicle = "Starship", count = 3 } = req.query;
    const maxCount = Math.min(5, Number(count));
    const prompt = `
    Return ONLY a valid JSON array. No markdown. No explanation. No extra text.
    
    Each item MUST follow EXACTLY this schema:
    
    {
      "missionName": "string",
      "era": "string",
      "status": "string",
      "scenario": {
        "vehicle": { "name": "string" },
        "bodyId": "string",
        "landingSite": { "name": "string" },
        "approach": {
          "descentProfile": "string",
          "entryAngle": number
        }
      },
      "scoring": {
        "scientificValue": number,
        "safety": number,
        "efficiency": number,
        "overall": number
      },
      "comparison": {
        "historicalBaseline": "apollo11",
        "improvement": number,
        "industryAverage": number
      },
      "isPublic": true
    }
    
    Generate EXACTLY ${maxCount} missions targeting "${planet}" using "${vehicle}".
    Return ONLY the JSON array.
    `;
    
    try {
      const ai = await gemini.generateContent(prompt);
      let missions = [];
      if (Array.isArray(ai)) missions = ai;
      else if (Array.isArray(ai.missions)) missions = ai.missions;
      else if (ai.mission) missions = [ai.mission];
      if (!missions.length) throw new Error("No missions returned from Gemini.");

      res.json({ ok: true, source: "gemini", missions });
    } catch (err) {
      console.warn("Gemini mission generation failed:", err.message);
      const fallback = Array.from({ length: maxCount }, () => getRandomMission());
      res.json({ ok: true, source: "fallback", missions: fallback });
    }
  } catch (err) {
    console.error("Error in getLandingMissions:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ----------  full mission bundle ---------- */
exports.getMissionBundle = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id !== "demo-001")
      return res.status(404).json({ error: "Mission not found" });

    const mission = {
      _id: "demo-001",
      missionName: "Luna Pioneer",
      era: "Future",
      status: "Completed",
      scenario: {
        vehicle: { name: "Starship Lander" },
        bodyId: "Moon",
        landingSite: { name: "Mare Tranquillitatis" },
        approach: { descentProfile: "propulsive", entryAngle: 45 },
      },
      scoring: { scientificValue: 92, safety: 88, efficiency: 85, overall: 88.3 },
      comparison: { historicalBaseline: "apollo11", improvement: 25, industryAverage: 82 },
      timestampsBlock: {
        simulatedAt: new Date("2025-03-20T10:00:00Z"),
        completedAt: new Date("2025-03-20T10:05:00Z"),
      },
      isPublic: true,
    };

    const impacts = [
      {
        status: "computed",
        isPublic: true,
        scores: {
          environmentalImpact: 12,
          safety: 97,
          scientificValue: 90,
          overall: 88,
        },
        site: { name: "Mare Tranquillitatis", coordinates: { lat: 0.674, lng: 23.473 } },
      },
    ];

    const historical = {
      name: "Apollo 11",
      agency: "NASA",
      missionType: "lunar-landing",
      launchDate: "1969-07-16T00:00:00Z",
      results: { success: true },
    };

    res.json({ ok: true, mission, impacts, historical });
  } catch (err) {
    console.error("❌ Error in getMissionBundle:", err);
    res.status(500).json({ error: err.message });
  }
};
