const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getUsers,
  toggleBanStatus,
  deleteUser,
} = require("../controllers/adminController");
const {
  getApplications,
  approveApplication,
  rejectApplication,
  saveAdminNotes,
} = require("../controllers/doctorApplicationController");
const { getReports, updateReport } = require("../controllers/reportController");
const { getLogs, exportLogs } = require("../controllers/activityLogController");
const {
  getMetrics,
  getFlagged,
  updateFlaggedStatus,
} = require("../controllers/aiMonitoringController");
const {
  getActivePrompt,
  updatePrompt,
} = require("../controllers/aiPromptController");

router.use(protect);
router.use(authorize("admin"));

router.get("/users", getUsers);
router.put("/users/:id/ban", toggleBanStatus);
router.delete("/users/:id", deleteUser);

router.get("/doctor-applications", getApplications);
router.put("/doctor-applications/:id/approve", approveApplication);
router.put("/doctor-applications/:id/reject", rejectApplication);
router.put("/doctor-applications/:id/notes", saveAdminNotes);

router.get("/reports", getReports);
router.put("/reports/:id", updateReport);

router.get("/activity-logs", getLogs);
router.get("/activity-logs/export", exportLogs);

router.get("/ai-monitoring/metrics", getMetrics);
router.get("/ai-monitoring/flagged", getFlagged);
router.put("/ai-monitoring/flagged/:id/action", updateFlaggedStatus);

router.get("/ai-prompt", getActivePrompt);
router.put("/ai-prompt", updatePrompt);

module.exports = router;
