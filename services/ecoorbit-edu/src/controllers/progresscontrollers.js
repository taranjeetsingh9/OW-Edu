const LearningProgress = require('../../../../models/ecoorbit-edu/LearningProgress');
const Assignment = require('../../../../models/ecoorbit-edu/Assignment');

exports.getMyProgress = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const profileId = req.user.sub;

    const lp = await LearningProgress.findOne({ profileId, classId }).lean();
    // Also compute simple aggregates from assignments
    const assignments = await Assignment.find({ classId, 'submissions.profileId': profileId }).lean();

    const totals = assignments.reduce((acc, a) => {
      const me = (a.submissions || []).find(s => String(s.profileId) === String(profileId));
      if (!me) return acc;
      acc.submitted += 1;
      if (typeof me.grade === 'number') {
        acc.graded += 1;
        acc.totalScore += me.grade;
      }
      return acc;
    }, { submitted: 0, graded: 0, totalScore: 0 });

    const avg = totals.graded ? (totals.totalScore / totals.graded) : null;

    res.json({ learningProgress: lp, submitted: totals.submitted, graded: totals.graded, averageScore: avg });
  } catch (e) { next(e); }
};
