const DoseLog = require("../models/DoseLog");
const User = require("../models/User");

const slotTimes = {
  1: ['8:00 AM'],
  2: ['8:00 AM', '8:00 PM'],
  3: ['8:00 AM', '2:00 PM', '8:00 PM'],
  4: ['8:00 AM', '12:00 PM', '4:00 PM', '8:00 PM'],
};

const logDose = async (req, res) => {
  try {
    const { medicationName } = req.body;
    if (!medicationName) {
      return res.status(400).json({ message: "medicationName is required" });
    }
    const log = await DoseLog.create({
      user: req.user._id,
      medicationName,
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTodayStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("medications");
    if (!user) return res.status(404).json({ message: "User not found" });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const logs = await DoseLog.find({
      user: req.user._id,
      takenAt: { $gte: todayStart, $lte: todayEnd },
    });

    const medicationStatus = (user.medications || []).map((med) => {
      const loggedToday = logs.filter(
        (l) => l.medicationName === med.name,
      ).length;
      return {
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        dailyDoses: med.dailyDoses || 1,
        takenToday: loggedToday,
        completed: loggedToday >= (med.dailyDoses || 1),
      };
    });

    res.json(medicationStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOverview = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("medications");
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // All logs in the last 7 days
    const logs = await DoseLog.find({
      user: req.user._id,
      takenAt: { $gte: sevenDaysAgo, $lte: todayEnd },
    });

    const todayLogs = logs.filter(
      (l) => l.takenAt >= todayStart && l.takenAt <= todayEnd,
    );

    const medications = (user.medications || []).map((med) => {
      const dailyDoses = med.dailyDoses || 1;

      // Per-medication 7-day adherence
      const totalExpected7 = dailyDoses * 7;
      const totalActual7 = logs.filter((l) => l.medicationName === med.name).length;
      const adherence7 = totalExpected7 > 0
        ? Math.round((totalActual7 / totalExpected7) * 100)
        : 0;

      // Today's taken count
      const takenToday = todayLogs.filter((l) => l.medicationName === med.name).length;
      const completed = takenToday >= dailyDoses;

      // Missed doses this week
      const missedDoses = [];
      for (let d = 0; d < 7; d++) {
        const dayStart = new Date(sevenDaysAgo);
        dayStart.setDate(dayStart.getDate() + d);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const takenThatDay = logs.filter(
          (l) =>
            l.medicationName === med.name &&
            l.takenAt >= dayStart &&
            l.takenAt <= dayEnd,
        ).length;

        if (takenThatDay < dailyDoses) {
          missedDoses.push({
            date: dayStart.toISOString().slice(0, 10),
            expected: dailyDoses,
            taken: takenThatDay,
          });
        }
      }

      // Only keep recent missed doses (last 3)
      const recentMissed = missedDoses
        .filter((m) => m.taken < m.expected)
        .slice(-3)
        .reverse();

      // Determine adherence badge color
      let badge;
      if (adherence7 >= 95) badge = "good";
      else if (adherence7 >= 80) badge = "moderate";
      else badge = "low";

      // Schedule times derived from dailyDoses
      const schedule = slotTimes[dailyDoses] || slotTimes[1];

      return {
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        dailyDoses,
        purpose: med.purpose || "",
        refillDate: med.refillDate || null,
        schedule,
        takenToday,
        completed,
        adherence7,
        badge,
        recentMissed,
      };
    });

    // 7-day adherence total
    const totalExpected7 = medications.reduce((s, m) => s + m.dailyDoses * 7, 0);
    const totalActual7 = medications.reduce((s, m) => s + m.adherence7 * m.dailyDoses * 7 / 100, 0);
    const adherence7Day = totalExpected7 > 0
      ? Math.round((logs.length / totalExpected7) * 100)
      : 0;

    // Today's schedule grouped by time
    const timeSlotMap = {};
    medications.forEach((med) => {
      med.schedule.forEach((time, idx) => {
        if (!timeSlotMap[time]) {
          timeSlotMap[time] = { time, medications: [] };
        }
        const isTaken = idx < med.takenToday;
        const takenLog = isTaken ? todayLogs.find(
          (l) => l.medicationName === med.name,
        ) : null;
        timeSlotMap[time].medications.push({
          name: med.name,
          dosage: med.dosage,
          taken: isTaken,
          takenAt: takenLog?.takenAt || null,
        });
      });
    });
    const todaySchedule = Object.values(timeSlotMap).sort((a, b) => {
      const parse = (t) => {
        const [h, m, ap] = t.match(/(\d+):(\d+) (AM|PM)/).slice(1);
        let hour = parseInt(h);
        if (ap === 'PM' && hour !== 12) hour += 12;
        if (ap === 'AM' && hour === 12) hour = 0;
        return hour * 60 + parseInt(m);
      };
      return parse(a.time) - parse(b.time);
    });

    // All missed doses across medications (recent)
    const allMissed = [];
    medications.forEach((med) => {
      med.recentMissed.forEach((m) => {
        allMissed.push({
          medicationName: med.name,
          dosage: med.dosage,
          date: m.date,
          expected: m.expected,
          taken: m.taken,
        });
      });
    });

    // Refill warnings
    const refillSoon = medications
      .filter((m) => {
        if (!m.refillDate) return false;
        const diff = new Date(m.refillDate) - now;
        const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return daysUntil <= 7;
      })
      .map((m) => ({
        name: m.name,
        dosage: m.dosage,
        refillDate: m.refillDate,
        daysUntil: Math.ceil((new Date(m.refillDate) - now) / (1000 * 60 * 60 * 24)),
      }));

    res.json({
      adherence7Day,
      totalExpected7,
      totalActual7: logs.length,
      medications,
      todaySchedule,
      missedDoses: allMissed.slice(0, 5),
      refillSoon,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { logDose, getTodayStatus, getOverview };
