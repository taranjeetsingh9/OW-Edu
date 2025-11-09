require('dotenv').config({ path: '../../../../OW-Edu/.env' });
const geminiService = require('../src/services/gemini-fixed-service');

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini API...');
    const response = await geminiService.generateContent("Say 'Gemini is working!' if you can read this.");
    console.log('✅ Response:', response);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGemini();