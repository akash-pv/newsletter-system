// newsletter-backend/routes/faqRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Correct path to your db config
const { authenticateToken } = require("../middleware/auth"); // For protecting routes

// GET all FAQs
// This route is public, anyone can fetch FAQs.
router.get("/", async (req, res) => {
    try {
        const [results] = await db.promise().query("SELECT * FROM faq ORDER BY id DESC"); // Fetch all FAQs
        res.status(200).json(results);
    } catch (err) {
        console.error("Error fetching FAQs:", err);
        res.status(500).json({ message: "Failed to fetch FAQs", error: err.message });
    }
});

// POST new FAQ
// This route is protected and only accessible by authenticated users (e.g., Admin).
router.post("/", authenticateToken, async (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) {
        return res.status(400).json({ message: "Question and answer are required." });
    }
    try {
        // Assuming 'created_by' and 'updated_by' fields might exist to track who made changes.
        // If not, you can remove them. req.user.userId comes from authenticateToken middleware.
        // const created_by = req.user.userId; 

        const [result] = await db.promise().query(
            "INSERT INTO faq (question, answer) VALUES (?, ?)",
            [question, answer]
        );
        res.status(201).json({ message: "FAQ created successfully", faqId: result.insertId });
    } catch (err) {
        console.error("Error creating FAQ:", err);
        res.status(500).json({ message: "Failed to create FAQ", error: err.message });
    }
});

// PUT update FAQ by ID
// This route is protected.
router.put("/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
        return res.status(400).json({ message: "Question and answer are required for update." });
    }
    try {
        // const updated_by = req.user.userId; // Optional: track who updated
        const [result] = await db.promise().query(
            "UPDATE faq SET question = ?, answer = ? WHERE id = ?",
            [question, answer, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `FAQ with ID ${id} not found.` });
        }
        res.status(200).json({ message: `FAQ with ID ${id} updated successfully.` });
    } catch (err) {
        console.error(`Error updating FAQ with ID ${id}:`, err);
        res.status(500).json({ message: `Failed to update FAQ with ID ${id}`, error: err.message });
    }
});

// DELETE FAQ by ID
// This route is protected.
router.delete("/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.promise().query("DELETE FROM faq WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `FAQ with ID ${id} not found.` });
        }
        res.status(200).json({ message: `FAQ with ID ${id} deleted successfully.` });
    } catch (err) {
        console.error(`Error deleting FAQ with ID ${id}:`, err);
        res.status(500).json({ message: `Failed to delete FAQ with ID ${id}`, error: err.message });
    }
});

module.exports = router;
