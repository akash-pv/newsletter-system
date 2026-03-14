// //server.js

// const express = require("express");
// const path = require("path");
// const multer = require("multer");
// const db = require("../config/db");
// const { authenticateToken } = require("../middleware/auth");

// const router = express.Router();

// // Utility: Promisify DB queries
// const runQuery = (sql, params) => {
//   return new Promise((resolve, reject) => {
//     db.query(sql, params, (err, results) => {
//       if (err) reject(err);
//       else resolve(results);
//     });
//   });
// };

// // Multer Storage Setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/"),
//   filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// const upload = multer({ storage });

// // 🔹 1. Submit an Article
// // Endpoint: POST /articles/submit
// // Body: title, content, category_id
// // File: file (optional)
// router.post("/submit", authenticateToken, upload.single("file"), async (req, res) => {
//   const { title, content, category_id } = req.body;
//   const submitted_by = req.user.userId;
//   const file = req.file;

//   if (!title || !content || !category_id) {
//     return res.status(400).json({ message: "Missing required fields" });
//   }

//   try {
//     // Insert article into the Article table
//     const result = await runQuery(
//       `
//       INSERT INTO Article (title, content, category_id, submitted_by, status_id, submitted_at) 
//       VALUES (?, ?, ?, ?, ?, NOW())
//       `,
//       [title, content, category_id, submitted_by, 1] // 1 = Submitted status
//     );

//     const articleId = result.insertId;

//     // If file is provided, save it in the ArticleMedia table
//     if (file) {
//       await runQuery(
//         `
//         INSERT INTO ArticleMedia (article_id, file_path, file_type, uploaded_at)
//         VALUES (?, ?, ?, NOW())
//         `,
//         [articleId, file.filename, file.mimetype]
//       );
//     }

//     res.status(201).json({
//       message: "Article submitted successfully",
//       articleId,
//     });
//   } catch (err) {
//     console.error("Error submitting article:", err.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // 🔹 2. Get Pending Articles (for Approver/Admin)
// // Endpoint: GET /articles/pending
// router.get("/pending", authenticateToken, async (req, res) => {
//   try {
//     const role = req.user.role;

//     if (role !== "Approver" && role !== "Admin") {
//       return res.status(403).json({ message: "Access denied." });
//     }

//     // Fetch pending articles for Approver/Admin
//     const articles = await runQuery(
//       `
//       SELECT 
//         a.id, 
//         a.title, 
//         a.content, 
//         ac.category_name, 
//         u.full_name AS submitted_by, 
//         a.submitted_at
//       FROM Article a
//       JOIN ArticleCategory ac ON a.category_id = ac.id
//       JOIN User u ON a.submitted_by = u.id
//       WHERE a.status_id = 1
//       `
//     );

//     res.json(articles);
//   } catch (err) {
//     console.error("Error fetching pending articles:", err);
//     res.status(500).json({ message: "Server error." });
//   }
// });

// // 🔹 3. Review Article (Approve / Reject / Return)
// // Endpoint: POST /articles/review
// // Body: article_id, action ("Approved", "Rejected", "Returned"), reason (optional)
// router.post("/review", authenticateToken, async (req, res) => {
//   const { article_id, action, reason } = req.body;
//   const approved_by = req.user.userId;

//   const statusMap = {
//     Approved: 2, // Status ID for Approved
//     Rejected: 3, // Status ID for Rejected
//     Returned: 4, // Status ID for Returned
//   };

//   const status_id = statusMap[action];

//   if (!article_id || !status_id) {
//     return res.status(400).json({ message: "Invalid request data" });
//   }

//   try {
//     // Insert article workflow action into ArticleWorkflow table
//     await runQuery(
//       `
//       INSERT INTO ArticleWorkflow (article_id, approved_by, action, action_reason, action_timestamp) 
//       VALUES (?, ?, ?, ?, NOW())
//       `,
//       [article_id, approved_by, action, reason || null]
//     );

//     // Update the article status in the Article table
//     await runQuery(
//       `UPDATE Article SET status_id = ? WHERE id = ?`,
//       [status_id, article_id]
//     );

//     res.status(200).json({ message: `Article ${action.toLowerCase()} successfully` });
//   } catch (err) {
//     console.error("Error reviewing article:", err.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // 🔹 4. Get Articles Submitted by Logged-in User
// // Endpoint: GET /articles/user
// router.get("/user", authenticateToken, async (req, res) => {
//   const userId = req.user.userId;

//   try {
//     // Fetch articles submitted by the logged-in user
//     const articles = await runQuery(
//       `
//       SELECT 
//         a.id,
//         a.title,
//         a.submitted_at,
//         s.status_name AS status,
//         (
//           SELECT w.action_reason 
//           FROM ArticleWorkflow w 
//           WHERE w.article_id = a.id 
//           ORDER BY w.action_timestamp DESC 
//           LIMIT 1
//         ) AS remarks
//       FROM Article a
//       JOIN ArticleStatus s ON a.status_id = s.id
//       WHERE a.submitted_by = ?
//       ORDER BY a.submitted_at DESC
//       `,
//       [userId]
//     );

//     res.json(articles);
//   } catch (err) {
//     console.error("Error fetching user articles:", err.message);
//     res.status(500).json({ message: "Server error." });
//   }
// });

// module.exports = router;
