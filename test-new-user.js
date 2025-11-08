require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing connection with new user...');

const testConnection = async () => {
  try {
    console.log('🔄 Connecting with username: bramhacker');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Successfully connected to MongoDB with new user!');
    
    // List databases to verify access
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    console.log('📊 Available databases:', databases.databases.map(db => db.name));
    
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('🔐 Authentication failed - check username/password and user permissions');
    }
  }
};

testConnection();