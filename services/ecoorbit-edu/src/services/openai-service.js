const axios = require('axios');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
  }

  async generateContent(prompt) {
    try {
      if (!this.apiKey) {
        console.log('❌ OPENAI_API_KEY not configured');
        return this.getEnhancedMockResponse();
      }

      console.log('🤖 Calling OpenAI API...');
      
      const response = await axios.post(
        this.apiUrl,
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ OpenAI API success!');
      
      if (response.data.choices && response.data.choices[0].message) {
        return response.data.choices[0].message.content;
      } else {
        console.log('No content in response');
        return this.getEnhancedMockResponse();
      }
      
    } catch (error) {
      console.error('❌ OpenAI API Error:', error.response?.status, error.message);
      console.log('🔄 Using enhanced mock response');
      return this.getEnhancedMockResponse();
    }
  }

  async generateSpaceScenario(grade, topic, learningObjectives, curriculumCode) {
    const prompt = `Create an engaging space education scenario for Grade ${grade} students in Ontario, Canada.
    
Topic: ${topic}
Learning Objectives: ${learningObjectives}
Curriculum Code: ${curriculumCode}

Please respond in this exact JSON format:
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

Make it interactive, educational, and age-appropriate for grade ${grade}.`;

    try {
      const response = await this.generateContent(prompt);
      return response; // OpenAI should return proper JSON
    } catch (error) {
      console.error('Scenario generation error:', error);
      return this.getEnhancedMockResponse(grade, topic, learningObjectives, curriculumCode);
    }
  }

  getEnhancedMockResponse(grade = 6, topic = "rocket propulsion", learningObjectives = "Understand basic rocket propulsion", curriculumCode = "E2.2") {
    const scenarios = {
      'E2.2': {
        title: "🚀 Water vs Nitrogen Rocket Propellant Mission",
        description: "Grade 6 students compare the efficiency and environmental impact of different rocket propellants in this exciting space mission! Discover why nitrogen is better than water for rocket fuel through hands-on experiments.",
        mission: "Test and compare water and nitrogen as rocket propellants, analyzing performance, efficiency, and environmental impact",
        activities: [
          {
            title: "Propellant Comparison Lab",
            instructions: "1. Set up safety equipment\n2. Test water propellant and measure thrust\n3. Test nitrogen propellant and measure thrust\n4. Compare efficiency metrics\n5. Analyze environmental data",
            materials: ["Water", "Liquid nitrogen", "Safety goggles", "Thrust measuring device", "Data recording sheet"],
            expectedOutcome: "Understand why nitrogen provides better thrust efficiency and lower environmental impact"
          },
          {
            title: "Environmental Impact Analysis",
            instructions: "Calculate carbon footprint and sustainability scores for both propellants",
            materials: ["Environmental data sheets", "Calculator", "Research materials"],
            expectedOutcome: "Compare environmental sustainability of rocket fuels"
          }
        ],
        environmentalImpact: "Nitrogen produces 40% fewer greenhouse gases and is more efficient than water-based propellants, making space exploration more sustainable",
        learningObjectives: ["Compare chemical properties of propellants", "Analyze environmental impact", "Understand rocket propulsion basics", "Calculate efficiency metrics"],
        emissionParams: {
          fuelType: "nitrogen",
          efficiency: "high",
          environmentalScore: 85,
          co2Reduction: "40%"
        },
        orbitParams: {
          missionType: "educational",
          complexity: "beginner",
          duration: "2 class periods"
        }
      },
      'C1.1': {
        title: "🌡️ Space Temperature Control Mission",
        description: "Grade 7 students explore heat transfer principles in space environments and learn how spacecraft maintain safe temperatures.",
        mission: "Investigate thermal management systems for spacecraft and spacesuits",
        activities: [
          {
            title: "Thermal Insulation Testing",
            instructions: "Test different insulation materials and measure their effectiveness in controlling temperature",
            materials: ["Insulation samples", "Thermometers", "Heat sources", "Data recording tools"],
            expectedOutcome: "Understand heat transfer principles and insulation effectiveness"
          }
        ],
        environmentalImpact: "Energy-efficient temperature control reduces power requirements and extends mission duration",
        learningObjectives: ["Heat transfer mechanisms", "Spacecraft systems design", "Energy efficiency principles"],
        emissionParams: { system: "thermal control", efficiency: "medium", powerSavings: "25%" },
        orbitParams: { missionType: "environmental", focus: "energy efficiency" }
      }
    };

    const scenario = scenarios[curriculumCode] || {
      title: `🚀 Grade ${grade} ${topic} Mission`,
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

module.exports = new OpenAIService();