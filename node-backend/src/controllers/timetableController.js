const axios = require('axios');
const { randomUUID } = require('crypto');
const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');
const Staff = require('../models/Staff');

exports.getStats = async (req, res) => {
  try {
    // 1. Total Timetables
    const total_timetables = await Timetable.countDocuments({});

    // 2. Active Classes (Total Slots size sum)
    const classesResult = await Timetable.aggregate([
      { $project: { count: { $size: "$slots" } } },
      { $group: { _id: null, total_classes: { $sum: "$count" } } }
    ]);
    const total_classes = classesResult.length > 0 ? classesResult[0].total_classes : 0;

    // 3. Active Lecturers (Unique Lecturers in Slots)
    const lecturersResult = await Timetable.aggregate([
      { $unwind: "$slots" },
      { $group: { _id: null, unique_lecturers: { $addToSet: "$slots.lecturer" } } }
    ]);
    const total_lecturers = lecturersResult.length > 0 ? lecturersResult[0].unique_lecturers.length : 0;

    return res.status(200).json({
      total_timetables,
      active_classes: total_classes,
      active_lecturers: total_lecturers
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(500).json({ detail: "Server error getting dashboard statistics" });
  }
};

exports.listTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find().sort({ created_at: -1 }).limit(100);
    return res.status(200).json(timetables);
  } catch (error) {
    console.error("List timetables error:", error);
    return res.status(500).json({ detail: "Server error listing timetables" });
  }
};

exports.getTimetable = async (req, res) => {
  try {
    const { timetableId } = req.params;
    let timetable;

    if (timetableId === "latest") {
      timetable = await Timetable.findOne().sort({ created_at: -1 });
      if (!timetable) {
        timetable = await Timetable.findOne();
      }
    } else {
      timetable = await Timetable.findOne({ timetable_id: timetableId });
    }

    if (!timetable) {
      return res.status(404).json({ detail: "Timetable not found" });
    }

    return res.status(200).json(timetable);
  } catch (error) {
    console.error("Get timetable error:", error);
    return res.status(500).json({ detail: "Server error getting timetable" });
  }
};

exports.deleteTimetable = async (req, res) => {
  try {
    const { timetableId } = req.params;
    const result = await Timetable.deleteOne({ timetable_id: timetableId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: "Timetable not found" });
    }

    return res.status(200).json({ message: "Timetable deleted successfully" });
  } catch (error) {
    console.error("Delete timetable error:", error);
    return res.status(500).json({ detail: "Server error deleting timetable" });
  }
};

exports.updateTimetableSlots = async (req, res) => {
  try {
    const { timetableId } = req.params;
    const { slots } = req.body;

    if (!slots || !Array.isArray(slots)) {
      return res.status(400).json({ detail: "Slots array is required" });
    }

    const updated = await Timetable.findOneAndUpdate(
      { timetable_id: timetableId },
      { $set: { slots } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ detail: "Timetable not found" });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update slots error:", error);
    return res.status(500).json({ detail: "Server error updating slots" });
  }
};

exports.generate = async (req, res) => {
  try {
    const timetableRequestData = req.body;

    console.log("Forwarding generation request to Python microservice...");
    const pythonUrl = `${process.env.PYTHON_BACKEND_URL}/timetable/generate`;
    
    // Call Python backend
    const response = await axios.post(pythonUrl, timetableRequestData, {
      timeout: 180000 // 3 minutes timeout for LLM generation
    });

    const generatedData = response.data;
    
    // Generate UUIDs for Node DB persistence
    const timetableId = generatedData.timetable_id || randomUUID();
    
    const newTimetable = new Timetable({
      ...generatedData,
      _id: timetableId,
      timetable_id: timetableId,
      created_at: new Date()
    });

    await newTimetable.save();
    return res.status(200).json(newTimetable);
  } catch (error) {
    console.error("Generate timetable error:", error.message);
    if (error.response) {
      console.error("Python response error:", error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ detail: `Server error during generation: ${error.message}` });
  }
};

exports.regenerate = async (req, res) => {
  try {
    const { timetable_id, additional_constraints } = req.body;

    if (!timetable_id) {
      return res.status(400).json({ detail: "timetable_id is required" });
    }

    // 1. Fetch original timetable from MongoDB
    const originalTimetable = await Timetable.findOne({ timetable_id });
    if (!originalTimetable) {
      return res.status(404).json({ detail: "Original timetable not found" });
    }

    // Convert mongoose doc to plain object
    const originalTimetableObj = originalTimetable.toObject();

    // 2. Forward request to Python backend
    console.log("Forwarding regeneration request to Python microservice...");
    const pythonUrl = `${process.env.PYTHON_BACKEND_URL}/timetable/regenerate`;
    
    const response = await axios.post(pythonUrl, {
      original_timetable: originalTimetableObj,
      additional_constraints: additional_constraints || ""
    }, {
      timeout: 180000 // 3 minutes
    });

    const generatedData = response.data;

    // 3. Save new timetable with a new ID
    const newTimetableId = generatedData.timetable_id || randomUUID();

    const newTimetable = new Timetable({
      ...generatedData,
      _id: newTimetableId,
      timetable_id: newTimetableId,
      created_at: new Date()
    });

    await newTimetable.save();
    return res.status(200).json(newTimetable);
  } catch (error) {
    console.error("Regenerate timetable error:", error.message);
    if (error.response) {
      console.error("Python response error:", error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ detail: `Server error during regeneration: ${error.message}` });
  }
};

exports.autoAllocate = async (req, res) => {
  try {
    const { department, semester, divisions } = req.body;

    if (!department || !semester || !divisions || !Array.isArray(divisions)) {
      return res.status(400).json({ detail: "department, semester, and divisions are required" });
    }

    // 1. Fetch subjects for this department and semester
    const subjects = await Subject.find({
      department: { $regex: new RegExp(`^${department}$`, 'i') },
      semesters: parseInt(semester)
    });

    // 2. Fetch active staff for this department and semester
    const lecturers = await Staff.find({
      department: { $regex: new RegExp(`^${department}$`, 'i') },
      semesters: parseInt(semester),
      status: 'Active'
    });

    // Workload tracking map: lecturerId -> currentPeriods
    const workload = {};
    lecturers.forEach(l => {
      workload[l.id] = 0;
    });

    const updatedDivisions = divisions.map(div => {
      const allocatedSubjects = [];

      subjects.forEach(sub => {
        // Find eligible lecturers who can teach this subject
        let eligible = lecturers.filter(l => 
          (l.subjects && (l.subjects.includes(sub.code) || l.subjects.includes(sub.name))) ||
          l.id === sub.assigned_lecturer_id
        );

        let chosenLecturerId = null;

        if (eligible.length > 0) {
          // Sort by current workload (ascending) to balance workload equally
          eligible.sort((a, b) => (workload[a.id] || 0) - (workload[b.id] || 0));
          
          // Select the one with the lowest workload who hasn't exceeded max_periods_per_week
          const best = eligible.find(l => {
            const currentWork = workload[l.id] || 0;
            return currentWork + sub.periods_per_week <= (l.max_periods_per_week || 20);
          });

          if (best) {
            chosenLecturerId = best.id;
            workload[best.id] = (workload[best.id] || 0) + sub.periods_per_week;
          } else {
            // Fallback to the first eligible if all are overloaded
            chosenLecturerId = eligible[0].id;
            workload[eligible[0].id] = (workload[eligible[0].id] || 0) + sub.periods_per_week;
          }
        } else {
          // Fallback to default database assigned lecturer if no custom match found
          chosenLecturerId = sub.assigned_lecturer_id || null;
        }

        allocatedSubjects.push({
          code: sub.code,
          name: sub.name,
          type: sub.type,
          periods_per_week: sub.periods_per_week,
          assigned_lecturer_id: chosenLecturerId,
          semester: sub.semester,
          department: sub.department,
          credits: sub.credits,
          lab_requirement: sub.lab_requirement
        });
      });

      return {
        ...div,
        subjects: allocatedSubjects
      };
    });

    return res.status(200).json({ divisions: updatedDivisions });
  } catch (error) {
    console.error("Auto allocate error:", error);
    return res.status(500).json({ detail: `Server error during auto-allocation: ${error.message}` });
  }
};
