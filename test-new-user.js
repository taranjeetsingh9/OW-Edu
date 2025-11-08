require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing connection on public WiFi...');

const testConnection = async () => {
  try {
    console.log('🔄 Attempting connection...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Solution: Try using mobile hotspot or add current IP to whitelist');
    console.log('Current public IP might be different on this WiFi network');
  }
};

testConnection();