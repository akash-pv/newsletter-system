//middleware/auth.js

const jwt = require("jsonwebtoken");

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");

    // Check for Bearer token format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token." });
        }

        // Add decoded user payload to request object
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };
