// analytics/services/analyticsService.js
// Core analytics logic - plugs into your existing MySQL connection

const db = require('../../newsletter-backend/config/db'); // adjust path to your db config

// ── DASHBOARD SUMMARY ────────────────────────────────────────────────────────
// Returns top-level KPIs for the analytics dashboard
async function getDashboardSummary() {
    const [newsletters] = await db.promise().query(`
        SELECT 
            COUNT(*) AS total_sent,
            SUM(total_recipients) AS total_recipients,
            SUM(article_count) AS total_articles_delivered,
            DATE_FORMAT(MAX(sent_at), '%d %b %Y') AS last_sent
        FROM newsletter_sends
    `);

    const [articles] = await db.promise().query(`
        SELECT
            COUNT(*) AS total_submitted,
            SUM(CASE WHEN approved_at IS NOT NULL THEN 1 ELSE 0 END) AS total_approved,
            SUM(CASE WHEN approved_at IS NULL THEN 1 ELSE 0 END) AS total_pending,
            SUM(CASE WHEN is_ai_generated = TRUE THEN 1 ELSE 0 END) AS ai_generated,
            SUM(CASE WHEN is_ai_generated = FALSE THEN 1 ELSE 0 END) AS manual,
            ROUND(AVG(approval_time_minutes), 1) AS avg_approval_minutes,
            ROUND(AVG(CASE WHEN is_ai_generated = TRUE THEN creation_time_minutes END), 1) AS avg_ai_creation_minutes,
            ROUND(AVG(CASE WHEN is_ai_generated = FALSE THEN creation_time_minutes END), 1) AS avg_manual_creation_minutes
        FROM article_analytics
    `);

    const [engagement] = await db.promise().query(`
        SELECT
            ns.id,
            ns.title,
            ns.total_recipients,
            COUNT(DISTINCT no2.id) AS opens,
            COUNT(DISTINCT nc.id) AS clicks,
            ROUND((COUNT(DISTINCT no2.id) / ns.total_recipients) * 100, 1) AS open_rate,
            ROUND((COUNT(DISTINCT nc.id) / ns.total_recipients) * 100, 1) AS click_rate
        FROM newsletter_sends ns
        LEFT JOIN newsletter_opens no2 ON ns.id = no2.newsletter_send_id
        LEFT JOIN newsletter_clicks nc ON ns.id = nc.newsletter_send_id
        GROUP BY ns.id
    `);

    const avgOpenRate = engagement.length
        ? (engagement.reduce((s, r) => s + parseFloat(r.open_rate || 0), 0) / engagement.length).toFixed(1)
        : 0;
    const avgClickRate = engagement.length
        ? (engagement.reduce((s, r) => s + parseFloat(r.click_rate || 0), 0) / engagement.length).toFixed(1)
        : 0;

    // Calculate time saved by AI (vs manual average)
    const aiSaved = articles[0].avg_manual_creation_minutes && articles[0].avg_ai_creation_minutes
        ? Math.round(
            ((articles[0].avg_manual_creation_minutes - articles[0].avg_ai_creation_minutes)
            / articles[0].avg_manual_creation_minutes) * 100
          )
        : 0;

    return {
        newsletters: newsletters[0],
        articles: { ...articles[0], ai_time_saved_percent: aiSaved },
        engagement: { avg_open_rate: avgOpenRate, avg_click_rate: avgClickRate },
    };
}

// ── NEWSLETTER PERFORMANCE ───────────────────────────────────────────────────
// Returns per-newsletter open rate, click rate, recipients
async function getNewsletterPerformance(limit = 10) {
    const [rows] = await db.promise().query(`
        SELECT
            ns.id,
            ns.title,
            DATE_FORMAT(ns.sent_at, '%d %b %Y') AS sent_date,
            ns.total_recipients,
            ns.article_count,
            COUNT(DISTINCT no2.id) AS opens,
            COUNT(DISTINCT nc.id) AS clicks,
            ROUND((COUNT(DISTINCT no2.id) / NULLIF(ns.total_recipients, 0)) * 100, 1) AS open_rate,
            ROUND((COUNT(DISTINCT nc.id) / NULLIF(ns.total_recipients, 0)) * 100, 1) AS click_rate
        FROM newsletter_sends ns
        LEFT JOIN newsletter_opens no2 ON ns.id = no2.newsletter_send_id
        LEFT JOIN newsletter_clicks nc ON ns.id = nc.newsletter_send_id
        GROUP BY ns.id
        ORDER BY ns.sent_at DESC
        LIMIT ?
    `, [limit]);

    return rows;
}

// ── ARTICLE ANALYTICS ────────────────────────────────────────────────────────
// Returns article approval times, AI vs manual breakdown
async function getArticleAnalytics() {
    const [byType] = await db.promise().query(`
        SELECT
            CASE WHEN is_ai_generated THEN 'AI Generated' ELSE 'Manual' END AS type,
            COUNT(*) AS count,
            ROUND(AVG(creation_time_minutes), 1) AS avg_creation_minutes,
            ROUND(AVG(approval_time_minutes), 1) AS avg_approval_minutes
        FROM article_analytics
        GROUP BY is_ai_generated
    `);

    const [topArticles] = await db.promise().query(`
        SELECT
            aa.title,
            CASE WHEN aa.is_ai_generated THEN 'AI' ELSE 'Manual' END AS type,
            aa.creation_time_minutes,
            aa.approval_time_minutes,
            DATE_FORMAT(aa.submitted_at, '%d %b %Y') AS submitted_date
        FROM article_analytics aa
        ORDER BY aa.submitted_at DESC
        LIMIT 20
    `);

    const [weeklyTrend] = await db.promise().query(`
        SELECT
            DATE_FORMAT(submitted_at, '%Y-W%u') AS week,
            COUNT(*) AS total,
            SUM(CASE WHEN is_ai_generated THEN 1 ELSE 0 END) AS ai_count,
            SUM(CASE WHEN NOT is_ai_generated THEN 1 ELSE 0 END) AS manual_count
        FROM article_analytics
        WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
        GROUP BY week
        ORDER BY week ASC
    `);

    return { byType, topArticles, weeklyTrend };
}

// ── SUBSCRIBER ENGAGEMENT ────────────────────────────────────────────────────
// Returns most engaged subscribers
async function getTopSubscribers(limit = 10) {
    const [rows] = await db.promise().query(`
        SELECT
            subscriber_email,
            COUNT(DISTINCT newsletter_send_id) AS newsletters_opened,
            MAX(opened_at) AS last_opened
        FROM newsletter_opens
        GROUP BY subscriber_email
        ORDER BY newsletters_opened DESC
        LIMIT ?
    `, [limit]);

    return rows;
}

// ── WEEKLY CSV EXPORT ────────────────────────────────────────────────────────
// Generates weekly summary data for CSV export
async function getWeeklySummaryData() {
    // Save snapshot to weekly_analytics_summary table
    await db.promise().query(`
        INSERT INTO weekly_analytics_summary (
            week_start, week_end,
            total_newsletters_sent, total_articles_submitted,
            total_articles_approved, ai_generated_count, manual_count,
            avg_approval_time_minutes, avg_open_rate, avg_click_rate
        )
        SELECT
            DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AS week_start,
            DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY) AS week_end,
            (SELECT COUNT(*) FROM newsletter_sends WHERE WEEK(sent_at) = WEEK(NOW())) AS newsletters_sent,
            (SELECT COUNT(*) FROM article_analytics WHERE WEEK(submitted_at) = WEEK(NOW())) AS articles_submitted,
            (SELECT COUNT(*) FROM article_analytics WHERE approved_at IS NOT NULL AND WEEK(submitted_at) = WEEK(NOW())) AS articles_approved,
            (SELECT COUNT(*) FROM article_analytics WHERE is_ai_generated = TRUE AND WEEK(submitted_at) = WEEK(NOW())) AS ai_count,
            (SELECT COUNT(*) FROM article_analytics WHERE is_ai_generated = FALSE AND WEEK(submitted_at) = WEEK(NOW())) AS manual_count,
            (SELECT ROUND(AVG(approval_time_minutes),2) FROM article_analytics WHERE WEEK(submitted_at) = WEEK(NOW())) AS avg_approval_mins,
            0 AS avg_open_rate,
            0 AS avg_click_rate
    `);

    // Return all weekly summaries for CSV
    const [rows] = await db.promise().query(`
        SELECT * FROM weekly_analytics_summary ORDER BY week_start DESC
    `);

    return rows;
}

module.exports = {
    getDashboardSummary,
    getNewsletterPerformance,
    getArticleAnalytics,
    getTopSubscribers,
    getWeeklySummaryData,
};
