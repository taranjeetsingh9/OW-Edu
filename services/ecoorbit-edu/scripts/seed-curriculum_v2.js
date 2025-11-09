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
  // ----- Grade 6 -----
  {
    grade: 6, subject: 'science', strand: 'Earth and Space Systems',
    expectation: 'Understand basic rocket propulsion and chemical properties',
    topic: 'rocket_propulsion', spaceConnection: 'Comparing water vs nitrogen in rockets',
    difficulty: 'basic', ontarioCode: 'E2.2',
    activities: [
      { type:'experiment', title:'Water vs Nitrogen Propellant Test',
        description:'Compare why nitrogen is better than water as rocket propellant',
        materials:['water','balloons','safety goggles'],
        learningOutcomes:['Understand chemical properties','Compare environmental impact']
      }
    ]
  },
  {
    grade: 6, subject:'science', strand:'Earth and Space Systems',
    expectation:'Identify components of the solar system and their characteristics',
    topic:'solar_system', spaceConnection:'Solar system exploration and planet identification',
    difficulty:'basic', ontarioCode:'E2.1',
    activities: [
      { type:'simulation', title:'Solar System Explorer Mission',
        description:'Map planets and understand orbital mechanics',
        materials:['planet charts','orbital diagrams'],
        learningOutcomes:['Identify solar system components','Understand basic orbits']
      }
    ]
  },
  {
    grade: 6, subject:'science', strand:'Earth and Space Systems',
    expectation:'Analyze the impact that conditions in space have on humans',
    topic:'space_exploration', spaceConnection:'Human spaceflight and environmental challenges',
    difficulty:'basic', ontarioCode:'E1.1',
    activities: [
      { type:'mission', title:'Space Habitat Design Challenge',
        description:'Design living quarters for a Mars mission',
        materials:['design software','research materials'],
        learningOutcomes:['Understand space environment','Design solutions for space living']
      }
    ]
  },

  // ----- Grade 7 -----
  {
    grade: 7, subject:'science', strand:'Heat in the Environment',
    expectation:'Explain how heat affects matter in space environments',
    topic:'heat_transfer', spaceConnection:'Temperature control in spacecraft and spacesuits',
    difficulty:'intermediate', ontarioCode:'C1.1',
    activities: [
      { type:'experiment', title:'Space Temperature Control Lab',
        description:'Test insulation materials for spacecraft',
        materials:['insulation samples','thermometers'],
        learningOutcomes:['Understand heat transfer','Apply to space technology']
      }
    ]
  },

  // ----- Grade 8 -----
  {
    grade: 8, subject:'science', strand:'Fluids',
    expectation:'Relate fluid dynamics to rocket propulsion and stability',
    topic:'fluid_dynamics', spaceConnection:'Nozzle design and thrust',
    difficulty:'intermediate', ontarioCode:'D2.3',
    activities: [
      { type:'lab', title:'Nozzle Shape & Thrust',
        description:'Study how nozzle geometry affects exhaust velocity and thrust',
        materials:['nozzle models','air source','sensor'],
        learningOutcomes:['Relate flow to thrust','Analyze stability impacts']
      }
    ]
  },

  // ----- Grade 9 -----
  {
    grade: 9, subject:'science', strand:'Sustainable Systems',
    expectation:'Evaluate environmental impacts of space technologies',
    topic:'environmental_impact', spaceConnection:'Emissions, debris mitigation, life-cycle analysis',
    difficulty:'intermediate', ontarioCode:'A1.2',
    activities: [
      { type:'research', title:'Rocket Emissions & Debris',
        description:'Analyze emissions profiles and debris mitigation strategies',
        materials:['articles','datasets'],
        learningOutcomes:['Compare propellants','Propose mitigation steps']
      }
    ]
  },

  // ----- Grade 10 -----
  {
    grade: 10, subject:'science', strand:'Chemistry in Space',
    expectation:'Investigate chemical reactions and energy release in propulsion',
    topic:'propulsion_chemistry', spaceConnection:'Green propellants and energetics',
    difficulty:'intermediate', ontarioCode:'B3.1',
    activities: [
      { type:'analysis', title:'Green Propellant Trade-offs',
        description:'Compare toxicity, Isp, energy density of common propellants',
        materials:['spec sheets','safety data'],
        learningOutcomes:['Relate reaction energy to thrust','Assess safety/environmental trade-offs']
      }
    ]
  },

  // ----- Grade 11 -----
  {
    grade: 11, subject:'physics', strand:'Motion & Energy',
    expectation:'Apply kinematics and energy to launch and re-entry profiles',
    topic:'orbital_kinematics', spaceConnection:'Delta-v budgeting, staging',
    difficulty:'advanced', ontarioCode:'P2.4',
    activities: [
      { type:'calculation', title:'Delta-v Budget Workshop',
        description:'Compute delta-v requirements for LEO/GTO and staging benefits',
        materials:['calculator','spreadsheets'],
        learningOutcomes:['Calculate delta-v','Explain staging efficiency']
      }
    ]
  },

  // ----- Grade 12 -----
  {
    grade: 12, subject:'physics', strand:'Earth & Space Systems',
    expectation:'Synthesize advanced concepts in space systems, propulsion, and sustainability',
    topic:'advanced_space_systems', spaceConnection:'Deep-space mission design & closed-loop systems',
    difficulty:'advanced', ontarioCode:'Z12.1',
    activities: [
      { type:'design', title:'Sustainable Deep-Space Mission',
        description:'Propose architecture focusing on efficient propulsion and life support',
        materials:['mission template','delta-v calculator','life-support refs'],
        learningOutcomes:['Evaluate propulsion trade-offs','Propose sustainability strategies']
      }
    ]
  }
];

async function upsertAll() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected:', MONGODB_URI.replace(/:\\w+@/, ':***@'));

  for (const c of curriculumData) {
    await Curriculum.updateOne(
      { grade: c.grade, ontarioCode: c.ontarioCode },
      { $set: { ...c, createdAt: new Date() } },
      { upsert: true }
    );
    console.log(`Upserted Grade ${c.grade} / ${c.ontarioCode} — ${c.topic}`);
  }

  const count = await Curriculum.countDocuments();
  console.log('Total curriculum items:', count);

  await mongoose.disconnect();
  console.log('Done.');
}

upsertAll().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
