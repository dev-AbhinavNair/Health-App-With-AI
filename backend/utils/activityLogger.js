const ActivityLog = require("../models/ActivityLog");

function logActivity({ action, category, severity = "info", actor, target, ipAddress, details }) {
  return ActivityLog.create({
    action,
    category,
    severity,
    actor: { name: actor?.name, id: actor?.id },
    target: { name: target?.name, id: target?.id },
    ipAddress,
    details,
  });
}

module.exports = { logActivity };
