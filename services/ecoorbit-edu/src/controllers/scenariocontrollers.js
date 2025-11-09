// controllers/scenariocontrollers.js
const Scenario = require('../../../../models/Scenario');
const Curriculum = require('../../../../models/Curriculum');
const geminiService = require('../services/gemini-service');

// --- helpers ---
const toArray = (v) => (Array.isArray(v) ? v : (v ? [v] : []));

function mapActivitiesFromCurriculum(currActivities = []) {
  // Curriculum.activities: { type, title, description, materials[], learningOutcomes[] }
  // Scenario.activities:   { title, instructions, materials[], expectedOutcome }
  return (currActivities || []).map(a => ({
    title: a.title || 'Activity',
    instructions: a.description || '',
    materials: Array.isArray(a.materials) ? a.materials : [],
    expectedOutcome: Array.isArray(a.learningOutcomes)
      ? a.learningOutcomes.join(', ')
      : (a.learningOutcomes || '')
  }));
}

function buildFallbackScenario({ grade, curriculum, curriculumCode }) {
  const activities = mapActivitiesFromCurriculum(curriculum.activities);
  const learningObjectives = toArray(curriculum.expectation);

  return {
    title: `Grade ${grade} Space Mission - ${curriculum.topic}`,
    description: curriculum.expectation || 'Curriculum-aligned activity',
    mission: `Learn about ${curriculum.topic} through interactive activities`,
    activities: activities.length
      ? activities
      : [{
          title: `${curriculum.topic} Investigation`,
          instructions: `Explore and present findings about ${curriculum.topic}`,
          materials: ['Research materials', 'Presentation tools'],
          expectedOutcome: curriculum.expectation || ''
        }],
    environmentalImpact: 'Explore environmental considerations in space technology',
    learningObjectives, // keep in scenario payload for downstream UI
    emissionParams: { educational: true, impact: 'low' },
    orbitParams: { missionType: 'educational', gradeLevel: grade },
    meta: { curriculumCode }
  };
}

// Create & save a scenario (AI with fallback to curriculum)
exports.generateSpaceScenario = async (req, res) => {
  try {
    const { grade, topic, curriculumCode } = req.body;
    const studentId = req.user?.sub;

    if (!grade || !curriculumCode) {
      return res.status(400).json({
        error: 'Missing required fields: grade, curriculumCode'
      });
    }

    // 1) Try strict match (grade + code)
    let curriculum = await Curriculum.findOne({ grade, ontarioCode: curriculumCode });

    // 2) If not found, try by code only (handles mismatched grade)
    if (!curriculum) {
      curriculum = await Curriculum.findOne({ ontarioCode: curriculumCode });
    }

    // 3) If still not found, DO NOT 404 — proceed AI-only (or generic)
    const haveCurriculum = !!curriculum;
    const resolvedTopic = topic || curriculum?.topic || 'space science';
    const resolvedExpectation = curriculum?.expectation || 'Ontario curriculum expectations';

    // Ask AI (pass curriculumCode through)
    let aiResponse = null;
    let aiObj = null;
    try {
      aiResponse = await geminiService.generateSpaceScenario(
        grade,
        resolvedTopic,
        resolvedExpectation,
        curriculumCode
      );

      // Handle both object and string
      if (typeof aiResponse === 'string') {
        try { aiObj = JSON.parse(aiResponse); } catch { /* ignore */ }
      } else if (aiResponse && typeof aiResponse === 'object') {
        aiObj = aiResponse;
      }
    } catch (aiErr) {
      console.log('Gemini failed, using fallback:', aiErr.message);
    }

    // Normalize AI/object or build fallback
    let scenarioData = null;

    if (aiObj && aiObj.title) {
      scenarioData = aiObj;

      // Normalize types/fields
      scenarioData.learningObjectives = Array.isArray(scenarioData.learningObjectives)
        ? scenarioData.learningObjectives
        : (scenarioData.learningObjectives ? [scenarioData.learningObjectives] : []);

      if (Array.isArray(scenarioData.activities)) {
        scenarioData.activities = scenarioData.activities.map(a => ({
          title: a.title || 'Activity',
          instructions: a.instructions || a.description || '',
          materials: Array.isArray(a.materials) ? a.materials : [],
          expectedOutcome: a.expectedOutcome ||
            (Array.isArray(a.learningOutcomes) ? a.learningOutcomes.join(', ') : (a.learningOutcomes || ''))
        }));
      } else {
        scenarioData.activities = [{
          title: `${resolvedTopic} Investigation`,
          instructions: `Explore and present findings about ${resolvedTopic}`,
          materials: ['Research materials', 'Presentation tools'],
          expectedOutcome: resolvedExpectation || ''
        }];
      }

      scenarioData.meta = { ...(scenarioData.meta || {}), curriculumCode };
      scenarioData.emissionParams = scenarioData.emissionParams || { educational: true, impact: 'low' };
      scenarioData.orbitParams = scenarioData.orbitParams || { missionType: 'educational', gradeLevel: grade };

    } else {
      // Fallback builder that works even without curriculum
      const activities = haveCurriculum
        ? (curriculum.activities || []).map(a => ({
            title: a.title || 'Activity',
            instructions: a.description || '',
            materials: Array.isArray(a.materials) ? a.materials : [],
            expectedOutcome: Array.isArray(a.learningOutcomes)
              ? a.learningOutcomes.join(', ')
              : (a.learningOutcomes || '')
          }))
        : [{
            title: `${resolvedTopic} Investigation`,
            instructions: `Explore and present findings about ${resolvedTopic}`,
            materials: ['Research materials', 'Presentation tools'],
            expectedOutcome: resolvedExpectation || ''
          }];

      scenarioData = {
        title: `Grade ${grade} Space Mission - ${resolvedTopic}`,
        description: resolvedExpectation || 'Curriculum-aligned activity',
        mission: `Learn about ${resolvedTopic} through interactive activities`,
        activities,
        environmentalImpact: 'Explore environmental considerations in space technology',
        learningObjectives: haveCurriculum
          ? (Array.isArray(curriculum.expectation) ? curriculum.expectation : [curriculum.expectation])
          : [resolvedExpectation],
        emissionParams: { educational: true, impact: 'low' },
        orbitParams: { missionType: 'educational', gradeLevel: grade },
        meta: { curriculumCode }
      };
    }

    // Save to DB
    const scenario = await Scenario.create({
      title: scenarioData.title,
      description: scenarioData.description,
      mission: scenarioData.mission,
      grade,
      curriculumCode,
      studentId,
      activities: scenarioData.activities,
      environmentalImpact: scenarioData.environmentalImpact,
      simulatorData: scenarioData.simulatorData || {
        emissionCalculator: scenarioData.emissionParams || {},
        orbitVisualizer: scenarioData.orbitParams || {}
      },
      status: 'active',
      aiGenerated: !!aiObj,
      learningOutcomes: scenarioData.learningObjectives
    });

    // Always 200 with a usable payload
    res.json({
      message: aiObj ? 'AI-generated scenario created!' : (haveCurriculum ? 'Scenario created (curriculum fallback)' : 'Scenario created (generic fallback)'),
      scenario
    });

  } catch (e) {
    console.error('Scenario generation error:', e);
    res.status(500).json({
      error: 'Failed to generate scenario',
      details: e.message
    });
  }
};


// List scenarios for the current student
exports.getStudentScenarios = async (req, res, next) => {
  try {
    const scenarios = await Scenario.find({
      studentId: req.user?.sub
    }).sort({ createdAt: -1 });

    res.json(scenarios);
  } catch (e) {
    next(e);
  }
};

// Submit results for an existing scenario and get AI feedback
exports.submitScenarioResult = async (req, res) => {
  try {
    const { scenarioId, simulatorResults, learningOutcomes } = req.body;

    if (!scenarioId) {
      return res.status(400).json({ error: 'scenarioId is required' });
    }

    const scenario = await Scenario.findById(scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    scenario.simulatorResults = simulatorResults || {};
    scenario.learningOutcomes = toArray(learningOutcomes);
    scenario.completedAt = new Date();
    scenario.status = 'completed';
    await scenario.save();

    // Ask Gemini for feedback (best effort)
    let aiFeedback = null;
    try {
      const prompt = `
Student completed space scenario: ${scenario.title}
Simulator Results: ${JSON.stringify(scenario.simulatorResults || {})}
Learning Outcomes: ${Array.isArray(scenario.learningOutcomes) ? scenario.learningOutcomes.join(', ') : ''}

Provide constructive feedback and suggest next steps.
Keep it encouraging and educational.
      `.trim();
      aiFeedback = await geminiService.generateContent(prompt);
    } catch (e) {
      console.log('Feedback generation failed:', e.message);
    }

    res.json({
      scenario,
      aiFeedback: aiFeedback || 'Great work! Continue exploring space concepts.'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to submit results', details: e.message });
  }
};

// Optional: preview without DB save
exports.previewSpaceScenario = async (req, res) => {
  try {
    const { grade, topic, learningObjectives, curriculumCode } = req.body;
    const out = await geminiService.generateSpaceScenario(
      grade,
      topic,
      learningObjectives,
      curriculumCode
    );
    res.json({ ok: true, data: JSON.parse(out) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
};