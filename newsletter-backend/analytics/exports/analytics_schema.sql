-- ============================================================
-- Newsletter Analytics Module - Schema
-- Add these tables to your existing newsletter MySQL database
-- ============================================================

-- Tracks every newsletter that gets sent out
CREATE TABLE IF NOT EXISTS newsletter_sends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    newsletter_id INT NOT NULL,          -- references your existing newsletter table
    title VARCHAR(255) NOT NULL,
    sent_by INT NOT NULL,                -- user_id of admin who sent it
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_recipients INT DEFAULT 0,
    article_count INT DEFAULT 0
);

-- Tracks open/read events per subscriber per newsletter
CREATE TABLE IF NOT EXISTS newsletter_opens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    newsletter_send_id INT NOT NULL,
    subscriber_email VARCHAR(255) NOT NULL,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (newsletter_send_id) REFERENCES newsletter_sends(id) ON DELETE CASCADE
);

-- Tracks link clicks inside newsletters
CREATE TABLE IF NOT EXISTS newsletter_clicks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    newsletter_send_id INT NOT NULL,
    subscriber_email VARCHAR(255) NOT NULL,
    article_title VARCHAR(255),
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (newsletter_send_id) REFERENCES newsletter_sends(id) ON DELETE CASCADE
);

-- Tracks article-level metadata for analytics (creation time, AI vs manual)
CREATE TABLE IF NOT EXISTS article_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,             -- references your existing articles table
    title VARCHAR(255) NOT NULL,
    created_by INT NOT NULL,             -- user_id
    is_ai_generated BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approval_time_minutes INT,           -- computed: approved_at - submitted_at
    creation_time_minutes INT DEFAULT 0  -- how long it took to write (manual tracking)
);

-- Weekly summary snapshots (populated by the weekly export job)
CREATE TABLE IF NOT EXISTS weekly_analytics_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_newsletters_sent INT DEFAULT 0,
    total_articles_submitted INT DEFAULT 0,
    total_articles_approved INT DEFAULT 0,
    total_articles_rejected INT DEFAULT 0,
    avg_approval_time_minutes DECIMAL(10,2) DEFAULT 0,
    ai_generated_count INT DEFAULT 0,
    manual_count INT DEFAULT 0,
    avg_open_rate DECIMAL(5,2) DEFAULT 0,
    avg_click_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX idx_newsletter_sends_sent_at ON newsletter_sends(sent_at);
CREATE INDEX idx_newsletter_opens_send_id ON newsletter_opens(newsletter_send_id);
CREATE INDEX idx_newsletter_clicks_send_id ON newsletter_clicks(newsletter_send_id);
CREATE INDEX idx_article_analytics_submitted ON article_analytics(submitted_at);
CREATE INDEX idx_weekly_summary_week ON weekly_analytics_summary(week_start);
