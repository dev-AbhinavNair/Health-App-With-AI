const express = require("express");
const router = express.Router();
const { logDose, getTodayStatus, getOverview } = require("../controllers/medicationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/log", logDose);
router.get("/today", getTodayStatus);
router.get("/overview", getOverview);

module.exports = router;
