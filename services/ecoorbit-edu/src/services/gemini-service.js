const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  async generateContent(prompt) {
    try {
      if (!this.apiKey) {
        console.log(' GEMINI_API_KEY not configured');
        return this.getEnhancedMockResponse();
      }

      console.log('calling Gemini API...');
      
      const response = await axios.post(
        `${this.baseUrl}/gemini-2.0-flash:generateContent?key=${this.apiKey}`, // it's free model and serve our purpose also converting gemini response to JSON is hard but ready for challenge
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log(' Gemini API success!');
      
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        console.log('No content in response');
        return this.getEnhancedMockResponse();
      }
      
    } catch (error) {
      console.error(' Gemini API Error:', error.response?.status, error.message);
      console.log(' Using enhanced mock response');
      return this.getEnhancedMockResponse();
    }
  }

  async generateSpaceScenario(grade, topic, learningObjectives, curriculumCode) {
    const prompt = `Create an engaging space education scenario for Grade ${grade} students in Ontario, Canada.
    
Topic: ${topic}
Learning Objectives: ${learningObjectives}
Curriculum Code: ${curriculumCode}

**IMPORTANT: Respond ONLY with valid JSON in this exact format, no other text:**

{
  "title": "engaging mission title with emoji",
  "description": "detailed description",
  "mission": "clear mission statement", 
  "activities": [
    {
      "title": "activity title",
      "instructions": "step-by-step instructions",
      "materials": ["item1", "item2"],
      "expectedOutcome": "what students will learn"
    }
  ],
  "environmentalImpact": "environmental considerations",
  "learningObjectives": ["objective1", "objective2"],
  "emissionParams": {"key": "value"},
  "orbitParams": {"key": "value"}
}

Make it interactive, educational, and age-appropriate for grade ${grade}. Focus on space science and environmental impact.`;

    try {
      const response = await this.generateContent(prompt);
      
      // Try to extract JSON if Gemini returns text with JSON inside
      let jsonResponse = response;
      
      // If response contains JSON, extract it
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = jsonMatch[0];
      }
      
      return jsonResponse;
    } catch (error) {
      console.error('Scenario generation error:', error);
      return this.getEnhancedMockResponse(grade, topic, learningObjectives, curriculumCode);
    }
  }

  getEnhancedMockResponse(grade = 6, topic = "rocket propulsion", learningObjectives = "Understand basic rocket propulsion", curriculumCode = "E2.2") {
    const scenarios = {
      'E2.2': {
        title: " Water vs Nitrogen Rocket Propellant Mission",
        description: "Grade 6 students compare the efficiency and environmental impact of different rocket propellants in this exciting space mission! Discover why nitrogen is better than water for rocket fuel through hands-on experiments.",
        mission: "Test and compare water and nitrogen as rocket propellants, analyzing performance, efficiency, and environmental impact",
        activities: [
          {
            title: "Propellant Comparison Lab",
            instructions: "1. Set up safety equipment\n2. Test water propellant and measure thrust\n3. Test nitrogen propellant and measure thrust\n4. Compare efficiency metrics\n5. Analyze environmental data",
            materials: ["Water", "Liquid nitrogen", "Safety goggles", "Thrust measuring device", "Data recording sheet"],
            expectedOutcome: "Understand why nitrogen provides better thrust efficiency and lower environmental impact"
          }
        ],
        environmentalImpact: "Nitrogen produces 40% fewer greenhouse gases and is more efficient than water-based propellants, making space exploration more sustainable",
        learningObjectives: ["Compare chemical properties of propellants", "Analyze environmental impact", "Understand rocket propulsion basics"],
        emissionParams: {
          fuelType: "nitrogen",
          efficiency: "high",
          environmentalScore: 85,
          co2Reduction: "40%"
        },
        orbitParams: {
          missionType: "educational",
          complexity: "beginner"
        }
      },
      'D2.3': {
        title: " Rocket Fluid Dynamics Mission",
        description: "Grade 8 students explore fluid dynamics principles as they apply to rocket propulsion systems and spacecraft design.",
        mission: "Investigate fluid behavior in rocket engines and spacecraft systems",
        activities: [
          {
            title: "Fluid Flow Analysis",
            instructions: "Study fluid dynamics in rocket propulsion systems and analyze flow patterns",
            materials: ["Fluid dynamics kits", "Measuring tools", "Data recording equipment"],
            expectedOutcome: "Understand fluid dynamics principles in rocket science"
          }
        ],
        environmentalImpact: "Optimized fluid systems improve rocket efficiency and reduce environmental impact",
        learningObjectives: ["Fluid dynamics principles", "Rocket propulsion systems", "Engineering design"],
        emissionParams: { system: "fluid dynamics", efficiency: "high" },
        orbitParams: { missionType: "engineering", complexity: "intermediate" }
      }
    };

    const scenario = scenarios[curriculumCode] || {
      title: ` Grade ${grade} ${topic} Mission`,
      description: `Explore ${topic} through interactive space science activities aligned with Ontario Grade ${grade} curriculum.`,
      mission: `Learn about ${topic} and master: ${learningObjectives}`,
      activities: [
        {
          title: `${topic} Investigation`,
          instructions: `Conduct experiments and research to explore ${topic}`,
          materials: ["Research materials", "Lab equipment", "Safety gear"],
          expectedOutcome: `Master ${learningObjectives}`
        }
      ],
      environmentalImpact: "Educational mission promoting sustainable space exploration practices",
      learningObjectives: [learningObjectives],
      emissionParams: { educational: true, impact: "low" },
      orbitParams: { missionType: "educational" }
    };

    return JSON.stringify(scenario);
  }
}

module.exports = new GeminiService();
