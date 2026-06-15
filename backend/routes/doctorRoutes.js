const express = require("express");
const router = express.Router();
const {
  getMyPatients,
  getPatientDetail,
  getUrgentCases,
  getArchivedCases,
  getSymptomTrends,
  getMedicationHistory,
} = require("../controllers/doctorPatientController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("doctor", "admin"));

router.get("/patients", getMyPatients);
router.get("/patients/:id", getPatientDetail);
router.get("/urgent-cases", getUrgentCases);
router.get("/archived-cases", getArchivedCases);
router.get("/symptom-trends", getSymptomTrends);
router.get("/medication-history", getMedicationHistory);

module.exports = router;
