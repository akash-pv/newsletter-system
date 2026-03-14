// routes/adminRoutes.js

const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const { insertNotification } = require("../models/Notification");
const router = express.Router();

// 🔐 Protect all admin routes
router.use(authenticateToken);

/**
 * ✅ Get all pending users (not approved)
 */
router.get("/api/pending-users", (req, res) => {
  const query = `
    SELECT u.id, u.full_name, u.email, r.role_name 
    FROM user u
    JOIN user_role ur ON u.id = ur.user_id
    JOIN role r ON ur.role_id = r.id
    WHERE u.is_approved = 0
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching pending users:", err);
      return res.status(500).json({ message: "Error fetching pending users" });
    }
    res.status(200).json(results);
  });
});

/**
 * ✅ Approve a user by setting is_approved = 1
 */
router.patch("/api/approve/:userId", (req, res) => {
  const { userId } = req.params;
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const query = "UPDATE user SET is_approved = 1 WHERE id = ?";
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("❌ Error approving user:", err);
      return res.status(500).json({ message: "Failed to approve user" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔔 Notify the user that they’ve been approved
    insertNotification(
      {
        user_id:    Number(userId),
        article_id: null,
        type:       "approval",
        message:    `Your account has been approved by ${req.user.email}`,
      },
      (notifyErr) => {
        if (notifyErr) console.error("Notification error:", notifyErr);
      }
    );

    res.status(200).json({ message: "User approved successfully" });
  });
});

/**
 * ❌ Reject and delete a user
 */
router.delete("/api/reject/:userId", (req, res) => {
  const { userId } = req.params;
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const query = "DELETE FROM user WHERE id = ?";
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("❌ Error deleting user:", err);
      return res.status(500).json({ message: "Failed to reject/delete user" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔔 Notify the user that they’ve been rejected
    insertNotification(
      {
        user_id:    Number(userId),
        article_id: null,
        type:       "rejection",
        message:    `Your account registration has been rejected by ${req.user.email}`,
      },
      (notifyErr) => {
        if (notifyErr) console.error("Notification error:", notifyErr);
      }
    );

    res.status(200).json({ message: "User rejected and deleted successfully" });
  });
});

/**
 * ✅ Get all articles with Pending status
 */
router.get("/api/articles/pending", (req, res) => {
  const query = `
    SELECT a.*, ac.category_name, u.full_name AS submitted_by_name
    FROM article a
    JOIN articlecategory ac ON a.category_id = ac.id
    JOIN user u ON a.submitted_by = u.id
    WHERE a.status_id = (
      SELECT id FROM articlestatus WHERE status_name = 'Pending'
    )
    ORDER BY a.submitted_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching pending articles:", err);
      return res.status(500).json({ message: "Failed to fetch pending articles" });
    }
    res.status(200).json(results);
  });
});

module.exports = router;
