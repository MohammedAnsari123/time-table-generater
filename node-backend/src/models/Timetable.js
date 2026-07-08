const mongoose = require("mongoose");

const TimetableSlotSchema = new mongoose.Schema(
  {
    division: { type: String, required: true },
    day: { type: String, required: true },
    period: { type: Number, required: true },
    subject: { type: String, required: true },
    lecturer: { type: String, required: true },
    room: { type: String, required: true },
    type: { type: String, required: true },
  },
  { _id: false },
);

const TimetableSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    timetable_id: {
      type: String,
      required: true,
    },
    metadata: {
      institution_name: { type: String, required: true },
      department: { type: String, required: true },
      semester: { type: Number, required: true },
      academic_year: { type: String, required: true },
      working_days: {
        type: [String],
        default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
      periods_per_day: { type: Number, default: 7 },
      breaks: { type: [String], default: ["Lunch"] },
    },
    divisions: [
      {
        name: { type: String, required: true },
        strength: { type: Number, default: 60 },
        subjects: [mongoose.Schema.Types.Mixed], // Allow nested subject objects
      },
    ],
    lecturers: [mongoose.Schema.Types.Mixed], // Allow nested lecturer objects
    classrooms: [mongoose.Schema.Types.Mixed], // Allow nested classroom objects
    labs: [mongoose.Schema.Types.Mixed], // Allow nested laboratory objects
    slots: [TimetableSlotSchema],
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("Timetable", TimetableSchema, "timetables");
