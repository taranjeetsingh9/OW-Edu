// models/ecoorbit-edu/Skill.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/* -------- Prerequisites (skill dependencies) -------- */
const PrerequisiteSchema = new Schema({
  skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
  minLevel: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

/* -------- Main Skill Schema -------- */
const SkillSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      maxlength: 100 
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 20,
      index: true, // e.g. ORB-101, ENV-202
      unique: true
    },

    category: {
      type: String,
      enum: [
        "orbital-mechanics",
        "rocket-design",
        "environmental-science",
        "mission-planning",
        "sustainability",
        "astronomy",
        "physics",
        "math",
        "tech",
        "critical-thinking",
        "collaboration",
        "other"
      ],
      default: "other",
      index: true
    },

    description: { type: String, trim: true, maxlength: 1000 },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "beginner"
    },

    maxLevel: { type: Number, min: 1, max: 100, default: 100 },

    prerequisites: [PrerequisiteSchema],

    tags: [String],

    isActive: { type: Boolean, default: true, index: true }
  },

  {
    timestamps: true,
    collection: "ecoorbit_skills"
  }
);

/* -------- Indexes -------- */
SkillSchema.index({ name: 1 });
SkillSchema.index({ code: 1 }, { unique: true });
SkillSchema.index({ category: 1 });
SkillSchema.index({ isActive: 1 });

/* -------- Export -------- */
module.exports = mongoose.model("Skill", SkillSchema);
