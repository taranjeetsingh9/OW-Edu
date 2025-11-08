const ClassModel = require('../../../../models/ecoorbit-edu/Class');
const { CreateClassDTO, JoinClassDTO } = require('../dto/classesdto');
const crypto = require('crypto');

// generate friendly join code
function genJoinCode() {
  return crypto.randomBytes(4).toString('hex').slice(0, 8); // 8 chars
}

exports.createClass = async (req, res, next) => {
  try {
    const parse = CreateClassDTO.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'validation', details: parse.error.flatten() });

    // const teacherId = req.user.sub;
    const teacherId = "67a1b2c3d4e5f67890123456"; // Temporary fixed ID
    
    const joinCode = genJoinCode();
    // const joinCode = genJoinCode();

    const cls = await ClassModel.create({
      ...parse.data,
      teacherId,
      students: [],
      settings: { joinCode, isPublic: false, allowStudentCollaboration: true, parentalAccess: false },
      status: 'active'
    });

    res.status(201).json(cls);
  } catch (e) { next(e); }
};

exports.listMyClasses = async (req, res, next) => {
  try {
    // const userId = req.user.sub;
    const userId = "67a1b2c3d4e5f67890123456";
    const asTeacher = await ClassModel.find({ teacherId: userId, status: 'active' }).lean();
    const asStudent = await ClassModel.find({ 'students.profileId': userId, status: 'active' }).lean();
    res.json({ teacher: asTeacher, student: asStudent });
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const c = await ClassModel.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ error: 'not_found' });
    res.json(c);
  } catch (e) { next(e); }
};

exports.joinByCode = async (req, res, next) => {
  try {
    const parse = JoinClassDTO.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'validation', details: parse.error.flatten() });

    const userId = req.user.sub;
    const cls = await ClassModel.findOne({ 'settings.joinCode': parse.data.joinCode, status: 'active' });
    if (!cls) return res.status(404).json({ error: 'invalid_join_code' });

    const already = cls.students?.some(s => String(s.profileId) === String(userId));
    if (already) return res.status(200).json(cls);

    cls.students = cls.students || [];
    cls.students.push({ profileId: userId, joinedAt: new Date(), role: 'student' });
    await cls.save();

    res.json(cls);
  } catch (e) { next(e); }
};
