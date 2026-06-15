const express = require("express");
const router = express.Router();
const { logDose, getTodayStatus } = require("../controllers/medicationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/log", logDose);
router.get("/today", getTodayStatus);

module.exports = router;
