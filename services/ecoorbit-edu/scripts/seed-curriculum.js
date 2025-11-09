const mongoose = require('mongoose');
const Curriculum = require('../../../models/Curriculum');
const path = require('path');

// Load .env from the CORRECT path - OW-Edu/.env
const envPath = path.resolve(__dirname, '../../../../OW-Edu/.env');
console.log('Loading .env from:', envPath);

require('dotenv').config({ path: envPath });

const MONGODB_URI = process.env.MONGO_URI;

console.log('MONGO_URI found:', !!MONGODB_URI);
if (!MONGODB_URI) {
  console.error('MONGO_URI environment variable is required');
  process.exit(1);
}

const curriculumData = [
  {
    grade: 6,
    subject: 'science',
    strand: 'Earth and Space Systems',
    expectation: 'Understand basic rocket propulsion and chemical properties',
    topic: 'rocket_propulsion',
    spaceConnection: 'Comparing water vs nitrogen in rockets',
    difficulty: 'basic',
    ontarioCode: 'E2.2',
    activities: [
      {
        type: 'experiment',
        title: 'Water vs Nitrogen Propellant Test',
        description: 'Compare why nitrogen is better than water as rocket propellant',
        materials: ['water', 'balloons', 'safety goggles'],
        learningOutcomes: ['Understand chemical properties', 'Compare environmental impact']
      }
    ]
  },
  {
    grade: 6,
    subject: 'science', 
    strand: 'Earth and Space Systems',
    expectation: 'Identify components of the solar system and their characteristics',
    topic: 'solar_system',
    spaceConnection: 'Solar system exploration and planet identification',
    difficulty: 'basic',
    ontarioCode: 'E2.1',
    activities: [
      {
        type: 'simulation',
        title: 'Solar System Explorer Mission',
        description: 'Map planets and understand orbital mechanics',
        materials: ['planet charts', 'orbital diagrams'],
        learningOutcomes: ['Identify solar system components', 'Understand basic orbits']
      }
    ]
  },
  {
    grade: 6,
    subject: 'science',
    strand: 'Earth and Space Systems', 
    expectation: 'Analyze the impact that conditions in space have on humans',
    topic: 'space_exploration',
    spaceConnection: 'Human spaceflight and environmental challenges',
    difficulty: 'basic',
    ontarioCode: 'E1.1',
    activities: [
      {
        type: 'mission',
        title: 'Space Habitat Design Challenge',
        description: 'Design living quarters for Mars mission',
        materials: ['design software', 'research materials'],
        learningOutcomes: ['Understand space environment', 'Design solutions for space living']
      }
    ]
  },
  {
    grade: 7,
    subject: 'science',
    strand: 'Heat in the Environment',
    expectation: 'Explain how heat affects matter in space environments',
    topic: 'heat_transfer',
    spaceConnection: 'Temperature control in spacecraft and spacesuits',
    difficulty: 'intermediate', 
    ontarioCode: 'C1.1',
    activities: [
      {
        type: 'experiment',
        title: 'Space Temperature Control Lab',
        description: 'Test insulation materials for spacecraft',
        materials: ['insulation samples', 'thermometers'],
        learningOutcomes: ['Understand heat transfer', 'Apply to space technology']
      }
    ]
  }
];

async function seedCurriculum() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI ? '***' + MONGODB_URI.split('@')[1] : 'Not found');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Curriculum.deleteMany({});
    console.log('Cleared existing curriculum data');
    
    // Insert new data
    await Curriculum.insertMany(curriculumData);
    console.log(`Seeded ${curriculumData.length} curriculum items!`);
    
    // Verify the data
    const count = await Curriculum.countDocuments();
    console.log(`Total curriculum items in database: ${count}`);
    
    // Show what was added
    const addedItems = await Curriculum.find({});
    console.log('\nAdded curriculum items:');
    addedItems.forEach(item => {
      console.log(`- Grade ${item.grade}: ${item.ontarioCode} - ${item.topic}`);
    });
    
    console.log('Curriculum seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedCurriculum();