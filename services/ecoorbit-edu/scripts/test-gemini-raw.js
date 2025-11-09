require('dotenv').config({ path: '../../../../OW-Edu/.env' });
const axios = require('axios');

async function testGeminiRaw() {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `Create an engaging space education scenario for Grade 6 students about rocket propulsion.

Please respond in this exact JSON format:
{
  "title": "mission title",
  "description": "description",
  "mission": "mission statement",
  "activities": [
    {
      "title": "activity title", 
      "instructions": "instructions",
      "materials": ["item1", "item2"],
      "expectedOutcome": "outcome"
    }
  ],
  "environmentalImpact": "environmental info",
  "learningObjectives": ["obj1", "obj2"],
  "emissionParams": {"key": "value"},
  "orbitParams": {"key": "value"}
}`;

  try {
    console.log('🧪 Testing Gemini API with JSON prompt...');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

    console.log('✅ Gemini API success!');
    
    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const rawText = response.data.candidates[0].content.parts[0].text;
      console.log('📝 RAW RESPONSE TEXT:');
      console.log('=' .repeat(50));
      console.log(rawText);
      console.log('=' .repeat(50));
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(rawText);
        console.log('✅ SUCCESS: Valid JSON parsed!');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (parseError) {
        console.log('❌ FAILED: Not valid JSON');
        console.log('Parse error:', parseError.message);
        
        // Try to extract JSON
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('🔍 Found potential JSON in response:');
          try {
            const extracted = JSON.parse(jsonMatch[0]);
            console.log('✅ EXTRACTED JSON:');
            console.log(JSON.stringify(extracted, null, 2));
          } catch (extractError) {
            console.log('❌ Failed to parse extracted JSON:', extractError.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

testGeminiRaw();