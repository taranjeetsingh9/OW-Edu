// controllers/external.controller.js
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ---------- Weather ----------
exports.getWeather = async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENWEATHER_API_KEY" });
    }

    const { city } = req.query;
    if (!city) return res.status(400).json({ error: "City is required" });

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    res.json({
      location: { name: data.name, country: data.sys?.country },
      weather: { main: data.weather?.[0]?.main, description: data.weather?.[0]?.description },
      temperature: {
        current: data.main?.temp,
        feelsLike: data.main?.feels_like,
      },
      humidity: data.main?.humidity,
      pressure: data.main?.pressure,
      wind: data.wind,
      clouds: data.clouds?.all,
    });
  } catch (err) {
    console.error("Error in getWeather:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- NASA NEO Feed ----------
exports.getNeoFeed = async (req, res) => {
  try {
    const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
    const today = new Date().toISOString().slice(0, 10);
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    const objects = Object.values(data.near_earth_objects || {})
      .flat()
      .map((neo) => ({
        id: neo.id,
        name: neo.name,
        hazardous: neo.is_potentially_hazardous_asteroid,
        missDistance_km: neo.close_approach_data?.[0]?.miss_distance?.kilometers,
        relativeVelocity_km_s: neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second,
      }));

    res.json({ date: today, count: objects.length, objects });
  } catch (err) {
    console.error("Error in getNeoFeed:", err);
    res.status(500).json({ error: err.message });
  }
};
