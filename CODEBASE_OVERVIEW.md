# Newsletter System - Complete Codebase Overview

## Table of Contents
1. [Database Schema & Tables](#database-schema--tables)
2. [Backend API Routes](#backend-api-routes)
3. [Backend Services & Middleware](#backend-services--middleware)
4. [Frontend Pages & Purposes](#frontend-pages--purposes)
5. [Frontend Components](#frontend-components)
6. [Data Flow & Architecture](#data-flow--architecture)

---

## Database Schema & Tables

### Core Tables (Main Newsletter System)

#### **User Table**
```
- id (INT, Primary Key, Auto-increment)
- full_name (VARCHAR)
- email (VARCHAR, Unique)
- password_hash (VARCHAR)
- is_approved (BOOLEAN, Default: 0)
- created_at (TIMESTAMP)
```
- Stores user account information
- `is_approved` flag controls whether a user can access system (Approvers/Admins require approval)

#### **Role Table**
```
- id (INT, Primary Key)
- role_name (VARCHAR) - "Admin", "Approver", "Employee", "User"
```
- Defines available user roles in the system

#### **User_Role Table**
```
- user_id (INT, Foreign Key → User)
- role_id (INT, Foreign Key → Role)
```
- Many-to-many relationship between users and roles
- Enables assigning multiple roles to a user

#### **Article Table**
```
- id (INT, Primary Key)
- title (VARCHAR)
- content (LONGTEXT)
- category_id (INT, Foreign Key → ArticleCategory)
- submitted_by (INT, Foreign Key → User)
- status_id (INT, Foreign Key → ArticleStatus)
- submitted_at (TIMESTAMP)
```
- Core table for newsletter articles
- `status_id` tracks workflow: Pending → Approved/Rejected/Returned

#### **ArticleCategory Table**
```
- id (INT, Primary Key)
- category_name (VARCHAR) - "ProductUpdate", "CustomerGoLive", "NewProductRelease", "BusinessUpdate", "HRDomainKnowledge"
```
- Article classification system

#### **ArticleStatus Table**
```
- id (INT, Primary Key)
- status_name (VARCHAR) - "Pending" (1), "Approved" (2), "Rejected" (3), "Returned" (4)
```
- Workflow states for articles

#### **ArticleMedia Table**
```
- id (INT, Primary Key)
- article_id (INT, Foreign Key → Article)
- file_path (VARCHAR)
- file_type (VARCHAR)
- uploaded_at (TIMESTAMP)
```
- Stores media files associated with articles (images, documents)

#### **ArticleWorkflow Table**
```
- id (INT, Primary Key)
- article_id (INT, Foreign Key → Article)
- approved_by (INT, Foreign Key → User)
- action (VARCHAR) - "Approved", "Rejected", "Returned"
- action_reason (TEXT)
- action_timestamp (TIMESTAMP)
```
- Audit trail for article review actions
- Tracks who approved/rejected articles and reasons

#### **Notification Table**
```
- id (INT, Primary Key)
- user_id (INT, Foreign Key → User)
- article_id (INT, Foreign Key → Article, Nullable)
- type (VARCHAR) - "submission", "approval", "rejection", "return"
- message (TEXT)
- is_read (BOOLEAN, Default: FALSE)
- created_at (TIMESTAMP)
```
- Real-time user notifications
- Notifies submitters when articles are reviewed, approvers of new submissions

#### **Newsletter Table**
```
- id (INT, Primary Key)
- title (VARCHAR)
- pdf_file (VARCHAR)
- published_date (TIMESTAMP)
```
- Generated newsletter PDFs
- Stores reference to PDF files in uploads/ directory

#### **FAQ Table**
```
- id (INT, Primary Key)
- question (TEXT)
- answer (TEXT)
```
- Frequently asked questions for the system
- Public read access, authenticated write access (Admin only)

---

### Analytics Tables (Optional - for reporting)

#### **newsletter_sends**
```
- id (INT, Primary Key)
- newsletter_id (INT, Foreign Key → Newsletter)
- title (VARCHAR)
- sent_by (INT, Foreign Key → User)
- sent_at (TIMESTAMP)
- total_recipients (INT)
- article_count (INT)
```
- Tracks each newsletter distribution event

#### **newsletter_opens**
```
- id (INT, Primary Key)
- newsletter_send_id (INT, Foreign Key → newsletter_sends)
- subscriber_email (VARCHAR)
- opened_at (TIMESTAMP)
```
- Tracks when subscribers open/read newsletters
- Index on `newsletter_send_id` for fast queries

#### **newsletter_clicks**
```
- id (INT, Primary Key)
- newsletter_send_id (INT, Foreign Key → newsletter_sends)
- subscriber_email (VARCHAR)
- article_title (VARCHAR)
- clicked_at (TIMESTAMP)
```
- Tracks link clicks within newsletters

#### **article_analytics**
```
- id (INT, Primary Key)
- article_id (INT, Foreign Key → Article)
- title (VARCHAR)
- created_by (INT, Foreign Key → User)
- is_ai_generated (BOOLEAN)
- submitted_at (TIMESTAMP)
- approved_at (TIMESTAMP)
- approval_time_minutes (INT) - computed
- creation_time_minutes (INT)
```
- Tracks article creation metadata
- Differentiates AI-generated vs. manual articles
- Calculates approval times

#### **weekly_analytics_summary**
```
- id (INT, Primary Key)
- week_start (DATE)
- week_end (DATE)
- total_newsletters_sent (INT)
- total_articles_submitted (INT)
- total_articles_approved (INT)
- total_articles_rejected (INT)
- avg_approval_time_minutes (DECIMAL)
- ai_generated_count (INT)
- manual_count (INT)
- avg_open_rate (DECIMAL)
- avg_click_rate (DECIMAL)
- created_at (TIMESTAMP)
```
- Weekly snapshots for analytics dashboard
- Populated by automated weekly export job

---

## Backend API Routes

### Authentication Routes (`/auth`)

#### **POST /auth/register**
- **Purpose**: Create new user account
- **Body**: `{ full_name, email, password, role_id }`
- **Validation**: 
  - Email must be unique
  - Password minimum 6 characters
  - Admin registration blocked (must be manually created)
- **Logic**:
  - Hash password with bcryptjs
  - Auto-approve Employees, require approval for Approvers
  - Create User_Role mapping
- **Response**: Success message, approval status flag
- **Access**: Public

#### **POST /auth/login**
- **Purpose**: Authenticate user and issue JWT
- **Body**: `{ email, password }`
- **Logic**:
  - Compare hashed password
  - Require approval for Admin/Approver roles
  - Generate JWT (1 hour expiry)
  - Include userId, email, role, full_name in token
- **Response**: JWT token, user details, role
- **Access**: Public

---

### Article Routes (`/articles`)

#### **POST /articles/generate**
- **Purpose**: Generate article content using OpenAI GPT-3.5
- **Auth**: Requires JWT token
- **Body**: `{ heading }`
- **Logic**: 
  - Calls OpenAI API with system prompt for newsletter writing
  - Returns up to 500 tokens of generated content
- **Response**: Generated article content
- **Used by**: UploadArticle page (Ollama fallback in frontend)

#### **POST /articles/submit**
- **Purpose**: Submit new article for approval
- **Auth**: Requires JWT token
- **Body**: `{ title, content, category_id }` + file upload
- **Middleware**: Multer file upload (destination: uploads/)
- **Logic**:
  - Insert article with status_id = 1 (Pending)
  - Store media file if provided
  - Send notifications to all Admin/Approver users
- **Response**: Article ID, success message
- **Notifications**: "New article submitted: {title} by {username}"

#### **GET /articles/approved**
- **Purpose**: Fetch all approved articles for newsletter generation
- **Auth**: Requires JWT token
- **Query**: Joins Article, ArticleCategory, User, ArticleMedia
- **Returns**: 
  ```json
  {
    "id": 1,
    "title": "Article Title",
    "content": "...",
    "category_name": "ProductUpdate",
    "submitted_at": "2024-01-15T10:30:00Z",
    "submitted_by": "John Doe",
    "image_url": "filename.jpg"
  }
  ```
- **Use**: GenerateNewsletter component fetches approved articles

#### **GET /articles/pending**
- **Purpose**: Fetch articles awaiting approval
- **Auth**: Requires JWT token (Approver/Admin only)
- **Returns**: List of pending articles with submitter names and categories

#### **POST /articles/review**
- **Purpose**: Approve, reject, or return article for revision
- **Auth**: Requires JWT token (Approver/Admin only)
- **Body**: `{ article_id, action, reason }`
  - action: "Approved" | "Rejected" | "Returned"
  - reason: Optional feedback
- **Logic**:
  - Insert into ArticleWorkflow table (audit trail)
  - Update article status_id (2=Approved, 3=Rejected, 4=Returned)
  - Notify original submitter with action and reason
- **Notifications**: Article #{id} was {action} by {approver_name}

#### **GET /articles/user**
- **Purpose**: Get all articles submitted by logged-in user
- **Auth**: Requires JWT token
- **Returns**: Articles with status, remarks from last workflow action

#### **GET /articles/approved** (duplicate endpoint)
- Fetch articles ready for newsletter inclusion

---

### Newsletter Routes (`/newsletter`)

#### **POST /newsletter/generate**
- **Purpose**: Create PDF newsletter from selected articles
- **Auth**: Requires JWT token (Admin only)
- **Body**:
  ```json
  {
    "title": "Newsletter Title",
    "date": "January 15, 2024",
    "articles": [
      { "id": 1, "title": "...", "content": "...", "image_url": "..." }
    ],
    "numColumns": 3
  }
  ```
- **Logic**:
  - Generate HTML template with Tailwind CSS styling
  - Add watermark (zinglogo.png at 6% opacity)
  - Use Puppeteer to convert HTML → PDF (A3 portrait)
  - Save PDF to uploads/ folder
  - Store reference in Newsletter table
- **PDF Features**:
  - Multi-column grid layout (1-4 columns configurable)
  - Float images alongside text
  - Page breaks handled properly
  - Professional footer with copyright
- **Response**: PDF filename for download

#### **GET /newsletter/download/:filename**
- **Purpose**: Download generated PDF newsletter
- **Returns**: PDF file (Content-Disposition: attachment)
- **Error**: 404 if file not found

---

### Admin Routes (`/admin`)

#### **GET /admin/api/pending-users**
- **Purpose**: List users awaiting approval
- **Auth**: Requires JWT token (Admin only)
- **Returns**:
  ```json
  [
    {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@zinghr.com",
      "role_name": "Approver"
    }
  ]
  ```

#### **PATCH /admin/api/approve/:userId**
- **Purpose**: Approve pending user account
- **Auth**: Requires JWT token (Admin only)
- **Logic**:
  - Set is_approved = 1
  - Send notification to user: "Your account has been approved"
- **Response**: Success message

#### **DELETE /admin/api/reject/:userId**
- **Purpose**: Reject and delete pending user
- **Auth**: Requires JWT token (Admin only)
- **Logic**:
  - Delete from User table
  - Send notification: "Your account registration has been rejected"
- **Response**: Success message

---

### Role Routes (`/roles`)

#### **GET /roles**
- **Purpose**: Fetch all available roles
- **Returns**:
  ```json
  [
    { "id": 1, "role_name": "Admin" },
    { "id": 2, "role_name": "Approver" },
    { "id": 3, "role_name": "Employee" }
  ]
  ```
- **Access**: Public (used during registration)

---

### Notification Routes (`/api/notifications`)

#### **GET /api/notifications**
- **Purpose**: Fetch user's notifications
- **Auth**: Requires JWT token
- **Query**: Latest 50 notifications ordered by created_at DESC
- **Returns**: 
  ```json
  [
    {
      "id": 1,
      "article_id": 5,
      "type": "submission",
      "message": "New article submitted: 'Q1 Update' by Sarah",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
  ```

#### **PATCH /api/notifications/:id/read**
- **Purpose**: Mark single notification as read
- **Auth**: Requires JWT token
- **Logic**: Set is_read = TRUE
- **Response**: 204 No Content

---

### FAQ Routes (`/api/faqs`)

#### **GET /api/faqs**
- **Purpose**: Fetch all FAQs
- **Returns**: Ordered by ID DESC
- **Access**: Public (no authentication required)

#### **POST /api/faqs**
- **Purpose**: Add new FAQ
- **Auth**: Requires JWT token (Admin only)
- **Body**: `{ question, answer }`
- **Response**: FAQ ID

#### **PUT /api/faqs/:id**
- **Purpose**: Update FAQ
- **Auth**: Requires JWT token (Admin only)
- **Body**: `{ question, answer }`

#### **DELETE /api/faqs/:id**
- **Purpose**: Delete FAQ
- **Auth**: Requires JWT token (Admin only)

---

## Backend Services & Middleware

### Middleware

#### **authenticateToken (auth.js)**
- **Purpose**: JWT verification middleware
- **Header**: `Authorization: Bearer {token}`
- **Logic**:
  - Extract token from "Bearer {token}" format
  - Verify with `process.env.JWT_SECRET`
  - Attach decoded user to `req.user`
- **Responses**:
  - 401: No token or invalid format
  - 403: Invalid or expired token
- **Attached to req.user**:
  ```javascript
  {
    userId: number,
    email: string,
    role: string,
    full_name: string
  }
  ```

---

### Services

#### **analyticsService.js**
Provides core analytics functions:

**`getDashboardSummary()`**
- **Returns**:
  ```json
  {
    "newsletters": {
      "total_sent": 5,
      "total_recipients": 250,
      "total_articles_delivered": 42,
      "last_sent": "15 Jan 2024"
    },
    "articles": {
      "total_submitted": 100,
      "total_approved": 85,
      "total_pending": 15,
      "ai_generated": 40,
      "manual": 60,
      "avg_approval_minutes": 45.5,
      "ai_time_saved_percent": 65
    },
    "engagement": {
      "avg_open_rate": 32.5,
      "avg_click_rate": 12.3
    }
  }
  ```

**`getNewsletterPerformance(limit = 10)`**
- Returns per-newsletter metrics:
  - Title, sent date, total recipients
  - Number of opens and clicks
  - Calculated open rate and click rate
- Used by analytics dashboard to show engagement trends

**`getArticleAnalytics()`**
- **Returns**:
  - By type: AI vs Manual (counts, avg creation time, approval time)
  - Top articles: Last 20 articles with creation/approval metrics
  - Weekly trend: Last 12 weeks of AI vs manual submissions

**`getTopSubscribers(limit = 10)`**
- Returns most engaged subscribers:
  - Email, number of newsletters opened
  - Last opened timestamp

**`getWeeklySummaryData()`**
- Generates weekly summary snapshot
- Inserts into `weekly_analytics_summary` table
- Returns all weekly records for CSV export

---

#### **weeklyExportJob.js**
Automated weekly analytics export via cron:

**`generateWeeklyCSV()`**
- Runs: Every Monday at 8:00 AM
- **CSV Fields**:
  - Week Start/End dates
  - Newsletters sent, articles submitted/approved/rejected
  - AI vs manual article counts
  - Approval times, open rates, click rates
- **Cleanup**: Deletes CSVs older than 90 days
- **Output**: `analytics/exports/weekly_analytics_YYYY-MM-DD.csv`

---

## Frontend Pages & Purposes

### Public Pages

#### **Login.js** (`/`)
- **Purpose**: User authentication
- **Features**:
  - Email and password input
  - Show/hide password toggle
  - Stores JWT token, role, and name in localStorage
  - Redirects to dashboard on success
  - Error handling for invalid credentials
- **UI**: Two-panel design (illustration + blue gradient form)

#### **Register.js** (`/register`)
- **Purpose**: Create new user account
- **Features**:
  - Full name, email, password inputs
  - Role selection (Approver, Employee, or custom roles)
  - Email validation: Only @zinghr.com domain allowed
  - Shows approval requirement message
- **Logic**: 
  - Employees auto-approved
  - Approvers require admin approval
  - Admins cannot self-register

---

### Dashboard Routes (Protected)

#### **Dashboard.js** (`/dashboard`)
- **Purpose**: Main hub with radial menu navigation
- **Role-specific menus**:
  - **Admin**: Requests, Upload, Approve, Generate, Previous, FAQs
  - **Approver**: Approve, Previous
  - **Employee/User**: Upload, Status, FAQs
- **Features**:
  - SVG radial buttons with gradient backgrounds
  - Smooth hover animations
  - Logout button always available
  - Displays 6-9 action buttons arranged in circular pattern

#### **UploadArticle.js** (`/upload`)
- **Purpose**: Submit new article with optional file
- **Features**:
  - Title input
  - Category dropdown (ProductUpdate, CustomerGoLive, etc.)
  - Content editor with AI-powered generation option
  - File upload (max 5MB)
  - Split-view preview mode
  - Image preview
- **AI Integration**: Calls Ollama Mistral API for content generation
- **On Submit**:
  - Uploads to `/articles/submit` endpoint
  - Redirects to dashboard on success
  - Shows toast notifications for feedback

#### **ApproveArticles.js** (`/approve`)
- **Purpose**: Review and approve/reject pending articles
- **Features**:
  - List of all pending articles
  - Filter by:
    - Date range (from/to)
    - Category
  - Sort by:
    - Date (ascending/descending)
    - Category (A-Z/Z-A)
  - Expandable article details
  - Three actions: Approve, Reject, Return for Revision
  - Modal for entering rejection/return reason
- **Workflow**: 
  - Approved articles shown to all users
  - Original submitter receives notification
  - Workflow history stored in ArticleWorkflow table

#### **GenerateNewsletter.js** (`/generate-newsletter`)
- **Purpose**: Build and publish newsletters
- **Features**:
  - **Sidebar**: Approved articles available for selection
  - **Canvas**: Drag-and-drop article arrangement
  - **Multi-column layout**: Configurable 1-4 column grid
  - **Article management**: Add/remove/reorder articles
  - **Newsletter metadata**: Title and date fields
  - **Preview**: Real-time PDF preview before generation
- **Libraries**: 
  - @dnd-kit for drag-and-drop
  - Puppeteer (backend) for PDF generation
- **On Generate**:
  - Creates HTML with watermark
  - Converts to PDF (A3 portrait)
  - Saves to database with PDF filename
  - Email capability via PreviousReleases

#### **PreviousReleases.js** (`/previous-releases`)
- **Purpose**: Access and distribute archived newsletters
- **Features**:
  - List all generated newsletters
  - Download PDF for each newsletter
  - Modal form to email newsletter to recipients
  - Pre-fills subject and body templates
  - Supports comma-separated email list
  - Direct PDF link in email body
- **Email Body Template**: Professional format with ZingHR signature

#### **ViewArticleStatus.js** (`/status`)
- **Purpose**: Track own article submissions
- **Features**:
  - Shows all articles submitted by current user
  - Search by title
  - Columns: Title, Submitted Date, Status, Remarks
  - Expandable details view
  - Status badges (color-coded):
    - Green: Approved
    - Yellow: Pending
    - Red: Rejected
  - Shows feedback/remarks from last review action

#### **PendingApprovalDashboard.js** (`/approval-requests`)
- **Purpose**: Admin user approval management
- **Features**:
  - Table of pending user registrations
  - Shows name, email, requested role
  - Two actions per user:
    - **Approve**: Enables account access
    - **Reject**: Deletes account
  - Confirmation dialog before rejection

#### **AnalyticsDashboard.jsx** (`/analytics`)
- **Purpose**: Business intelligence and reporting
- **Sections**:
  - **KPI Cards**: Newsletters sent, avg open/click rates, AI time saved
  - **Article Breakdown**: AI vs manual creation metrics
  - **Newsletter Performance**: Table of recent newsletters with engagement metrics
  - **Article Analytics**: Creation times, approval workflow metrics
  - **Engagement**: Top subscribers by opens
  - **CSV Export**: Download weekly summary (Monday 8 AM)
- **Data Flow**: Fetches from `/api/analytics/*` endpoints

#### **FAQPage.js** (`/faq`)
- **Purpose**: FAQ management and display
- **Features**:
  - **View**: All users can read FAQs
  - **Admin Only**:
    - Add new FAQ
    - Edit existing FAQ
    - Delete FAQ
  - Auto-resizing textareas
  - Toast notifications for actions
- **Public Read, Authenticated Write**: Most flexible permission model

---

## Frontend Components

### **Navbar.js**
- **Purpose**: Top navigation bar (present on all authenticated pages)
- **Features**:
  - ZingHR logo + "NEWSUPDATE" branding
  - Dashboard button
  - Notifications bell with unread count
  - User profile dropdown with:
    - Avatar (first letter of name)
    - Display name and role
    - Logout button
- **Responsive**: Fixed top position (z-50)
- **Styling**: 
  - Gradient background (blue-700 to indigo-600)
  - Shrinks on scroll (h-20 → h-16)

### **NotificationBell.js**
- **Purpose**: Real-time notification display
- **Features**:
  - Bell icon with unread count badge
  - Click to open dropdown
  - Shows last 50 notifications
  - Notifications auto-marked as read when viewed
  - Dismiss individual notifications
  - Auto-closes on outside click
- **Notification Types**:
  - `submission`: New article submitted
  - `approval`: Account/article approved
  - `rejection`: Account/article rejected
  - `return`: Article returned for revision
- **Data**: Fetches from `/api/notifications` endpoint

### **PrivateRoute.js**
- **Purpose**: Route protection component
- **Logic**:
  - Checks for JWT token in localStorage
  - Redirects to login if no token
  - Validates user role against allowed roles
  - Shows "Unauthorized Access" if role mismatch
- **Usage**: Wraps protected routes in App.js

### **BackgroundParticles.js**
- **Purpose**: Animated particle background
- **Implementation**: Uses particle.js library
- **Config**: Custom configuration for movement, colors, density

---

## Data Flow & Architecture

### User Registration & Login Flow
```
User Input (Register/Login)
    ↓
Frontend: Register.js / Login.js
    ↓
POST /auth/register OR /auth/login
    ↓
Backend: authRoutes.js
    ↓
DB: Insert/Query User, User_Role tables
    ↓
JWT Generation (1-hour expiry)
    ↓
Frontend: Store token, role, name in localStorage
    ↓
Redirect to /dashboard
```

### Article Submission Workflow
```
User clicks "Upload" on Dashboard
    ↓
UploadArticle.js form submission
    ↓
Optional: Generate content via Ollama/OpenAI
    ↓
POST /articles/submit (multipart: title, content, category_id, file)
    ↓
Backend: articleRoutes.js
    ↓
DB: Insert Article (status_id=1: Pending)
DB: Insert ArticleMedia if file provided
DB: Query Admin/Approver users
    ↓
Insert notifications for all approvers
    ↓
Frontend: Toast success → Redirect to dashboard
```

### Article Approval Workflow
```
Approver visits /approve
    ↓
ApproveArticles.js loads GET /articles/pending
    ↓
Display list with filters/sort
    ↓
Approver clicks Approve/Reject/Return
    ↓
Modal for optional reason (Reject/Return only)
    ↓
POST /articles/review { article_id, action, reason }
    ↓
Backend: articleRoutes.js
    ↓
DB: Insert ArticleWorkflow (audit trail)
DB: Update Article status_id
DB: Query original submitter user_id
    ↓
Insert notification for submitter
    ↓
Frontend: Toast success → Refresh pending list
```

### Newsletter Generation Flow
```
Admin visits /generate-newsletter
    ↓
GenerateNewsletter.js loads GET /articles/approved
    ↓
Display sidebar with approved articles
    ↓
Drag-and-drop articles to canvas
    ↓
Admin sets title, date, column layout
    ↓
Preview PDF rendering
    ↓
Click "Generate" button
    ↓
POST /newsletter/generate { title, date, articles, numColumns }
    ↓
Backend: newsletterRoutes.js
    ↓
Generate HTML with Tailwind CSS + watermark
Use Puppeteer to convert HTML → PDF (A3 portrait)
Save PDF to /uploads folder
DB: Insert Newsletter record with pdf_file reference
    ↓
Response: pdf_filename
    ↓
Frontend: Download or email newsletter
```

### Notification System Flow
```
Article submitted / Status changed
    ↓
Backend: Insert into notification table
    ↓
Frontend: NotificationBell component
    ↓
GET /api/notifications (periodic polling or WebSocket)
    ↓
Display unread count in bell icon
User clicks bell
    ↓
Show dropdown with last 50 notifications
    ↓
PATCH /api/notifications/:id/read
    ↓
Mark as read in DB
    ↓
Remove unread badge
```

### Analytics Data Flow (Weekly)
```
Monday 8:00 AM (cron job)
    ↓
weeklyExportJob.js: generateWeeklyCSV()
    ↓
analyticsService.js: getWeeklySummaryData()
    ↓
Execute complex queries:
  - Count newsletters sent this week
  - Count articles submitted/approved/rejected
  - Calculate average approval times
  - Fetch engagement metrics (opens, clicks)
    ↓
Insert snapshot row into weekly_analytics_summary table
    ↓
Generate CSV with json2csv library
    ↓
Save to /analytics/exports/weekly_analytics_YYYY-MM-DD.csv
    ↓
Clean up files older than 90 days
    ↓
Frontend AnalyticsDashboard can download via /api/analytics/export/csv
```

---

## Key Environment Variables

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=newsletter_db

# JWT
JWT_SECRET=your_secret_key

# OpenAI (optional, for AI article generation)
OPENAI_API_KEY=sk-...

# Server
PORT=5000
NODE_ENV=production|development
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with mysql2 package
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **PDF Generation**: Puppeteer
- **Scheduling**: node-cron (weekly analytics export)
- **File Upload**: Multer
- **CSV Export**: json2csv
- **Validation**: Joi

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP**: Axios
- **Styling**: Tailwind CSS
- **UI Components**: Heroicons
- **Notifications**: react-hot-toast
- **Drag-and-Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Utilities**: date-fns for date handling

---

## User Roles & Permissions Matrix

| Feature | Admin | Approver | Employee | User |
|---------|-------|----------|----------|------|
| Upload Articles | ✓ | ✗ | ✓ | ✓ |
| Approve Articles | ✓ | ✓ | ✗ | ✗ |
| Generate Newsletter | ✓ | ✗ | ✗ | ✗ |
| View Previous Releases | ✓ | ✓ | ✗ | ✗ |
| Email Newsletter | ✓ | ✓ | ✗ | ✗ |
| Approve Users | ✓ | ✗ | ✗ | ✗ |
| Manage FAQs | ✓ | ✗ | ✗ | ✗ |
| View Analytics | ✓ | ✗ | ✗ | ✗ |
| View Article Status | ✓ | ✓ | ✓ | ✓ |
| View Notifications | ✓ | ✓ | ✓ | ✓ |
| Requires Approval | No | Yes | No | No |

---

## Workflow States

### Article Lifecycle
```
Submitted (Pending)
    ↓
    ├─→ Approved ───→ Eligible for newsletter
    ├─→ Rejected ───→ Final state (end of workflow)
    └─→ Returned ───→ Back to submitter for revision
```

### User Lifecycle
```
Registered
    ↓
    ├─→ is_approved = 0 (Pending - for Approvers/Admins)
    └─→ is_approved = 1 (Approved)
        ├─→ Can login
        └─→ Can access system features
```

---

## API Response Patterns

### Success Response
```json
{
  "message": "Operation successful",
  "data": { /* optional */ }
}
```

### Error Response
```json
{
  "message": "Error description"
}
```

### Paginated Response (Future Implementation)
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}
```

---

## Security Considerations

1. **Authentication**: JWT tokens with 1-hour expiry
2. **Password**: bcryptjs hashing with 10 salt rounds
3. **Email Validation**: Only @zinghr.com domain allowed during registration
4. **Admin Registration**: Must be manually created (prevented via UI)
5. **Role-Based Access Control**: Enforced in routes and frontend
6. **File Upload**: Size limit 5MB, stored outside web root
7. **SQL Injection**: Parameterized queries using MySQL prepared statements
8. **CORS**: Enabled for frontend-backend communication

---

## Future Enhancement Opportunities

1. **WebSocket Notifications**: Real-time notifications instead of polling
2. **Email Integration**: Send articles/newsletters via email service
3. **Article Versioning**: Track content changes across revisions
4. **Advanced Search**: Full-text search for articles and FAQs
5. **Bulk Operations**: Approve/reject multiple articles at once
6. **Export Options**: DOCX, HTML formats alongside PDF
7. **User Analytics**: Track who read which articles
8. **Two-Factor Authentication**: Enhanced security for admins
9. **API Rate Limiting**: Prevent abuse of endpoints
10. **Audit Logging**: Comprehensive action logging for compliance

---

## File Structure Summary

```
newsletter-system/
├── newsletter-backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection
│   ├── middleware/
│   │   └── auth.js               # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   ├── Article.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── articleRoutes.js      # Article CRUD + approval
│   │   ├── newsletterRoutes.js   # PDF generation
│   │   ├── adminRoutes.js        # User approval
│   │   ├── roleRoutes.js         # Role listing
│   │   ├── faqRoutes.js          # FAQ CRUD
│   │   └── notificationRoutes.js # Notifications
│   ├── analytics/
│   │   ├── exports/
│   │   │   └── analytics_schema.sql
│   │   └── services/
│   │       ├── analyticsService.js
│   │       └── weeklyExportJob.js
│   ├── uploads/                  # Generated PDFs, media files
│   ├── index.js                  # Express app setup
│   ├── server.js                 # (Commented out, reference only)
│   └── package.json
│
├── newsletter-frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── images/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js
│   │   │   └── notificationApi.js
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── NotificationBell.js
│   │   │   ├── PrivateRoute.js
│   │   │   └── BackgroundParticles.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── UploadArticle.js
│   │   │   ├── ApproveArticles.js
│   │   │   ├── GenerateNewsletter.js
│   │   │   ├── PreviousReleases.js
│   │   │   ├── ViewArticleStatus.js
│   │   │   ├── PendingApprovalDashboard.js
│   │   │   ├── AnalyticsDashboard.jsx
│   │   │   └── FAQPage.js
│   │   ├── App.js                # Main routing
│   │   ├── index.js              # React entry point
│   │   └── particlesConfig.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── README.md
│
└── README.md
```

---

## Quick Start Guide

### Backend Setup
```bash
cd newsletter-backend
npm install
cp .env.example .env
# Configure DB credentials in .env
npm start
# Server runs at http://localhost:5000
```

### Frontend Setup
```bash
cd newsletter-frontend
npm install
npm start
# App runs at http://localhost:3000
```

### Database Setup
```sql
-- Create database
CREATE DATABASE newsletter_db;

-- Run schema from analytics/exports/analytics_schema.sql
-- Create other tables based on models/ descriptions
```

---

**Document Generated**: April 2026  
**Last Updated**: April 24, 2026  
**System Version**: 1.0
