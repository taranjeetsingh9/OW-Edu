const { z } = require('zod');

exports.CreateAssignmentDTO = z.object({
  classId: z.string().length(24),
  title: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(['mission', 'quiz', 'project', 'discussion', 'research']),
  missionConfig: z.object({
    feature: z.enum(['greenlaunch','orbitwatch','planetmode']).optional(),
    parameters: z.record(z.any()).optional(),
    constraints: z.object({
      maxEmissions: z.number().optional(),
      minEfficiency: z.number().optional(),
      requiredTechniques: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  requirements: z.object({
    dueDate: z.coerce.date().optional(),
    points: z.number().int().min(0).optional(),
    groupSize: z.number().int().min(1).optional(),
    submissionsAllowed: z.number().int().min(1).optional(),
    lateSubmission: z.boolean().optional()
  }).optional(),
  grading: z.object({
    rubric: z.array(z.object({
      criterion: z.string(),
      description: z.string().optional(),
      maxPoints: z.number().min(0),
      weight: z.number().min(0).max(1)
    })).optional(),
    totalPoints: z.number().min(0).optional(),
    autoGrade: z.boolean().optional()
  }).optional(),
  resources: z.array(z.object({
    type: z.enum(['document','video','link']),
    title: z.string(),
    url: z.string().url(),
    description: z.string().optional()
  })).optional()
});

exports.SubmitAssignmentDTO = z.object({
  assignmentId: z.string().length(24),
  missionId: z.string().length(24).optional(), // if tied to mission
  contentUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

exports.GradeSubmissionDTO = z.object({
  assignmentId: z.string().length(24),
  submissionId: z.string().length(24),
  grade: z.number().min(0),
  feedback: z.string().max(2000).optional()
});
