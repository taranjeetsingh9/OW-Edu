const { z } = require('zod');

exports.CreateClassDTO = z.object({
  className: z.string().min(2).max(60),
  school: z.string().min(1),
  gradeLevel: z.string().min(1), // e.g., "Grade 9"
  subject: z.string().min(1),
  // teacherId will come from req.user.sub for security
});

exports.JoinClassDTO = z.object({
  joinCode: z.string().min(6).max(12),
});
