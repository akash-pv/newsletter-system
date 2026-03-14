//routes/roleRoutes.js

const express = require("express");
const db = require("../config/db"); // ✅ Ensure correct DB connection path

const router = express.Router();

// ✅ GET /roles - Fetch all roles from the 'role' table
router.get("/", (req, res) => {
  const query = "SELECT id, role_name FROM role"; // ✅ Use lowercase 'role' as per your DB table

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching roles:", err.message);
      return res.status(500).json({ message: "Error fetching roles" });
    }

    // ✅ Success: send roles as response
    res.status(200).json(results);
  });
});

module.exports = router;
