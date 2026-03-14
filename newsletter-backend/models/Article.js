
// models/Article.js

const db = require("../db");

const getAllArticles = (callback) => {
    db.query("SELECT * FROM articles", callback);
};

const insertArticle = (article, callback) => {
    const sql = `INSERT INTO articles (heading, content, category, status, file_path, submitted_by, submitted_on)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`;
    const values = [
        article.heading,
        article.content,
        article.category,
        "pending",
        article.file_path,
        article.submitted_by,
    ];
    db.query(sql, values, callback);
};

module.exports = {
    getAllArticles,
    insertArticle,
};
