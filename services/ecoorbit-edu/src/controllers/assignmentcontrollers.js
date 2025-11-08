const mongoose = require('mongoose'); // ADD THIS IMPORT
const AssignmentModel = require('../../../../models/ecoorbit-edu/Assignment')
const ClassModel = require('../../../../models/ecoorbit-edu/Class');
const { CreateAssignmentDTO, SubmitAssignmentDTO, GradeSubmissionDTO } = require('../dto/assignments');

exports.create = async (req, res, next) => {
  try {
    const parsed = CreateAssignmentDTO.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'validation', details: parsed.error.flatten() });

    // Ensure requester is the class teacher
    const cls = await ClassModel.findById(parsed.data.classId);
    if (!cls) return res.status(404).json({ error: 'class_not_found' });
    if (String(cls.teacherId) !== String(req.user.sub)) return res.status(403).json({ error: 'forbidden' });

    const doc = await AssignmentModel.create({
      ...parsed.data,
      status: 'published',
      timestamps: { createdAt: new Date(), updatedAt: new Date(), assignedAt: new Date() }
    });

    res.status(201).json(doc);
  } catch (e) { next(e); }
};

exports.listByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const items = await AssignmentModel.find({ classId }).sort({ 'timestamps.createdAt': -1 }).lean();
    res.json(items);
  } catch (e) { next(e); }
};

exports.submit = async (req, res, next) => {
  try {
    const parsed = SubmitAssignmentDTO.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'validation', details: parsed.error.flatten() });

    const { assignmentId, missionId, contentUrl, notes } = parsed.data;
    const a = await AssignmentModel.findById(assignmentId);
    if (!a) return res.status(404).json({ error: 'assignment_not_found' });

    a.submissions = a.submissions || [];
    a.submissions.push({
      _id: new mongoose.Types.ObjectId(), // ADDED THIS LINE
      profileId: req.user.sub,
      missionId,
      submittedAt: new Date(),
      grade: null,
      feedback: null,
      status: 'submitted',
      contentUrl,
      notes
    });
    a.timestamps = a.timestamps || {};
    a.timestamps.updatedAt = new Date();
    await a.save();

    res.status(201).json(a);
  } catch (e) { next(e); }
};

exports.grade = async (req, res, next) => {
  try {
    // TEMPORARY: Accept profileId instead of submissionId
    const { assignmentId, profileId, grade, feedback } = req.body;

    const a = await AssignmentModel.findById(assignmentId);
    if (!a) return res.status(404).json({ error: 'assignment_not_found' });

    // teacher check by class
    const cls = await ClassModel.findById(a.classId);
    if (!cls) return res.status(404).json({ error: 'class_not_found' });
    if (String(cls.teacherId) !== String(req.user.sub)) return res.status(403).json({ error: 'forbidden' });

    // TEMPORARY: Find submission by profileId (since we don't have submissionId)
    const sub = a.submissions.find(s => String(s.profileId) === String(profileId));
    if (!sub) return res.status(404).json({ error: 'submission_not_found' });

    sub.grade = grade;
    sub.feedback = feedback || null;
    sub.status = 'graded';
    
    // FIX: Handle timestamps properly
    if (!a.timestamps) {
      a.timestamps = {};
    }
    a.timestamps.updatedAt = new Date();
    
    await a.save();

    res.json(a);
  } catch (e) { next(e); }
};