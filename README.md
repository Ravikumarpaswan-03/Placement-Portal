#  Placement Portal

A modern, full-stack **Student Placement Management System** designed to streamline the recruitment process. It bridges the gap between **Students**, **Companies**, **Mentors**, and **Administrators** by offering an end-to-end recruitment drive workflow, qualification checking, profile updates, and real-time portal metrics.

---

##  Technology Stack

The Placement Portal is built using a clean and modular **MERN-adjacent architecture** (using Vanilla HTML/CSS/JS instead of React for the frontend to maintain maximum performance and load speeds):

###  Frontend
- **HTML5:** Semantic architecture for layout, SEO friendliness, and accessibility.
- **CSS3:** Premium, custom-tailored responsive design featuring a **Glassmorphic theme**, HSL color palettes, custom gradients, smooth micro-animations, and the modern **Outfit** Google Font.
- **JavaScript (ES6+):** Pure vanilla JavaScript featuring async/await Fetch API for server-client communication, dynamic DOM updates, and client-side token management.
- **Storage:** Web LocalStorage API used for stateful, secure token persistence.

###  Backend
- **Node.js:** Server runtime environment.
- **Express.js:** Lightweight and fast REST API routing framework.
- **Mongoose:** Object Data Modeling (ODM) library for MongoDB.

###  Database
- **MongoDB:** Flexible, schema-less NoSQL database.

---

## Third-Party Libraries & Dependencies

All project dependencies are configured to maximize speed, security, and developer efficiency.

### Backend Dependencies (`backend/package.json`)
*   **`express` (`^5.2.1`):** Web server framework to structure routes and middleware.
*   **`mongoose` (`^9.6.3`):** Interface to MongoDB for structured schema definitions.
*   **`bcryptjs` (`^3.0.3`):** Password hashing functions to secure accounts.
*   **`jsonwebtoken` (`^9.0.3`):** JSON Web Token (JWT) generator and verification utility for stateless session authorization.
*   **`cors` (`^2.8.6`):** Cross-Origin Resource Sharing helper to permit frontend connections.
*   **`dotenv` (`^17.4.2`):** Loader to feed configuration parameters from `.env` to `process.env`.
*   **`nodemon` (`^3.1.14` - *DevDependency*):** Automated server reloader for a fast developer loop.

---

##  Role-Based Features

The system adapts to four distinct user roles, each offering targeted portals and capabilities:

### 1.  Students
- **Profile Management:** Edit and update name, email, skills, CGPA, and resume link.
- **Account Self-Deletion:** Delete their profile and user account permanently from the update profile UI.
- **Job Discovery:** Browse jobs with CTC details, skills, location, and eligibility.
- **Automatic Eligibility Checks:** Compares CGPA against requirements; displays status and manages application buttons accordingly.
- **One-Click Applications:** Apply for eligible jobs and track application status.

### 2.  Companies
- **Company Profile CRUD:** Register, edit, update, or delete corporate profiles directly from the UI directory.
- **Job Listings CRUD:** Post new opportunities, edit existing details, and delete obsolete listings directly from the Job board.
- **Applicant Management:** View all applications and update hiring statuses.

### 3.  Mentors & Trainers
- **Comprehensive Directories:** Complete view access to **Students**, **Companies**, and **Jobs** directories to manage readiness.
- **Placement Analytics:** Monitor totals and placement ratios.
- **Hiring Tracking:** View all job application reports to guide students.

### 4.  Administrators
- **System-Wide Control:** Complete access to analytics, metrics, and directories.
- **Full CRUD Authority:** Administrative capabilities to register, update, edit, and delete any Student, Company, Job, or Application.

---

##  Project Architecture & Directory Structure

```
Placement-Portal/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── applicationController.js  # Job applications logic
│   │   ├── authController.js         # User registration & login
│   │   ├── companyController.js      # Company profiles logic
│   │   ├── dashboardController.js    # Statistics aggregator
│   │   ├── jobController.js          # Job postings logic
│   │   └── studentController.js      # Student profile logic
│   ├── middlewares/
│   │   └── authMiddleware.js     # JWT authorization parser
│   ├── models/
│   │   ├── Application.js        # Job Application Mongoose schema
│   │   ├── Company.js            # Company Mongoose schema
│   │   ├── Job.js                # Job Mongoose schema
│   │   ├── Student.js            # Student Mongoose schema
│   │   └── User.js               # User Mongoose schema
│   ├── routes/
│   │   ├── applicationRoutes.js  # /api/applications router
│   │   ├── authRoutes.js         # /api/auth router
│   │   ├── companyRoutes.js      # /api/companies router
│   │   ├── dashboardRoutes.js    # /api/dashboard router
│   │   ├── jobRoutes.js          # /api/jobs router
│   │   └── studentRoutes.js      # /api/students router
│   ├── .env                      # Local server configuration
│   ├── server.js                 # Main Express server entry point
│   └── package.json              # Node.js manifest & scripts
│
├── frontend/
│   ├── css/
│   │   └── style.css             # Glassmorphic responsive styling
│   ├── js/
│   │   ├── index.js              # Auth & root landing scripts
│   │   ├── admin-dashboard.js    # Admin dashboard logic
│   │   ├── company-dashboard.js  # Company dashboard logic
│   │   ├── mentor-dashboard.js   # Mentor dashboard logic
│   │   ├── student-dashboard.js  # Student dashboard logic
│   │   ├── student.js            # Student profile updates/lists
│   │   ├── company.js            # Company creation & view lists
│   │   ├── job.js                # Job listing, checking & applying
│   │   └── application.js        # Application list & status changes
│   ├── pages/
│   │   ├── admin-dashboard.html
│   │   ├── company-dashboard.html
│   │   ├── mentor-dashboard.html
│   │   ├── student-dashboard.html
│   │   ├── student.html
│   │   ├── companies.html
│   │   ├── jobs.html
│   │   ├── create-job.html
│   │   └── applications.html
│   └── index.html                # Entry portal page (Login/Register)
│
├── Placement-Portal.postman_collection.json # API endpoints testing collection
├── DRY_RUN_TEST_PLAN.md          # Comprehensive CLI / Curl validation guide
└── README.md                     # Project documentation
```

---

##  Database Schemas (Mongoose)

### 1. User Schema (`User.js`)
*   `name` (String, Required)
*   `email` (String, Required, Unique)
*   `passwordHash` (String, Required)
*   `role` (String, Enum: `["student", "company", "admin", "mentor"]`, Default: `student`)

### 2. Student Schema (`Student.js`)
*   `userId` (ObjectId ref User, Unique)
*   `name` (String, Required)
*   `email` (String, Required, Unique)
*   `skills` (Array of Strings)
*   `cgpa` (Number)
*   `resumeLink` / `resumeUrl` (String)

### 3. Company Schema (`Company.js`)
*   `name` (String, Required)
*   `website` (String)
*   `sector` (String)
*   `contactEmail` (String, Required)
*   `location` (String)
*   `description` (String)

### 4. Job Schema (`Job.js`)
*   `title` (String, Required)
*   `companyName` (String, Required)
*   `companyId` (String)
*   `location` (String)
*   `salary` / `package` (String)
*   `skills` (Array of Strings)
*   `deadline` (Date)
*   `minCgpa` (Number, Default: `0`)
*   `description` (String)

### 5. Application Schema (`Application.js`)
*   `studentId` (String)
*   `jobId` (String)
*   `studentName` (String)
*   `jobTitle` (String)
*   `status` (String, Default: `"Applied"`, Enum: `["Applied", "Shortlisted", "Selected", "Rejected"]`)
*   `appliedAt` / `date` (Date, Default: `Date.now`)

---

##  Guide to Setup and Run the Project

Follow these instructions to run the Placement Portal on your local environment:

### Prerequisites
1.  **Node.js** installed (v16+ recommended).
2.  **MongoDB** running locally on port `27017` (or access to a MongoDB Atlas cluster URI).
3.  A modern web browser.

---

### Step 1: Start MongoDB
Ensure MongoDB is running on your machine. In most terminal instances, you can start local MongoDB via:
```bash
mongod
```
Or check that the service is running in your Windows Services panel.

---

### Step 2: Configure and Start the Backend Server
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Create/verify the `.env` configuration file inside the `backend` directory.
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/placementportal
   JWT_SECRET=mysecretkey
   ```
4. Start the backend:
   - For **Development mode** (with hot-reloads):
     ```bash
     npm run dev
     ```
   - For **Production mode**:
     ```bash
     npm start
     ```
5. You should see confirmation logs:
   ```
   Server Running on Port 5000
   MongoDB Connected
   ```

---

### Step 3: Run the Frontend Application
The frontend consists of lightweight static assets and can be opened in two ways:

#### Option A: Direct Browser Access
- Locate the file `frontend/index.html` on your desktop/folder structure.
- Double-click `index.html` to open it in Chrome, Edge, Firefox, or Safari.

#### Option B: Live Server (Recommended)
If using VS Code, install the **Live Server** extension, right-click `frontend/index.html`, and select **"Open with Live Server"**. This serves the app on `http://127.0.0.1:5500` or a similar port and dynamically updates with any custom tweaks.

---

##  Testing API Endpoints

A Postman collection is supplied in the root of the project: [Placement-Portal.postman_collection.json](./Placement-Portal.postman_collection.json) featuring pre-configured request blocks with hardcoded local URLs (`http://localhost:5000/api`).

### Complete Route Map

| HTTP Method | Route Endpoint | Headers Required | Description |
|---|---|---|---|
| **`POST`** | `/api/auth/register` | `Content-Type: application/json` | Registers a new user (student, company, mentor, admin) |
| **`POST`** | `/api/auth/login` | `Content-Type: application/json` | Logs in user and returns a JWT access token |
| **`GET`** | `/api/students` | None | Lists all students (for admin/mentor review) |
| **`POST`** | `/api/students` | `Content-Type: application/json` | Creates a new student profile |
| **`GET`** | `/api/students/profile` | `Authorization: Bearer <token>` | Returns the logged-in student's personal profile |
| **`PUT`** | `/api/students/profile` | `Authorization: Bearer <token>` | Updates the logged-in student's profile details |
| **`DELETE`** | `/api/students/:id` | `Authorization: Bearer <token>` | Deletes student profile and corresponding login credentials |
| **`GET`** | `/api/companies` | None | Lists all corporate company profiles |
| **`GET`** | `/api/companies/:id` | None | Returns a single company's details by database ID |
| **`POST`** | `/api/companies` | `Content-Type: application/json` | Registers a new corporate company profile |
| **`PUT`** | `/api/companies/:id` | `Content-Type: application/json` | Updates an existing company's profile details |
| **`DELETE`** | `/api/companies/:id` | None | Deletes a company profile from the database |
| **`GET`** | `/api/jobs` | None | Browses job listings (supports `search`, `company`, `location` queries) |
| **`GET`** | `/api/jobs/:id` | None | Returns a single job listing's details |
| **`POST`** | `/api/jobs` | `Content-Type: application/json` | Creates a new job posting (with min CGPA, package, skills) |
| **`PUT`** | `/api/jobs/:id` | `Content-Type: application/json` | Updates an existing job posting's parameters |
| **`DELETE`** | `/api/jobs/:id` | None | Deletes a job listing from the board |
| **`GET`** | `/api/applications` | `Authorization: Bearer <token>` | Returns application list (filtered for student, full for staff/mentor) |
| **`POST`** | `/api/applications` | `Authorization: Bearer <token>` | Submits a job application for a specific posting |
| **`PUT`** | `/api/applications/:id` | `Authorization: Bearer <token>` | Updates application progress status (Applied, Shortlisted, Selected, Rejected) |
| **`DELETE`** | `/api/applications/:id` | `Authorization: Bearer <token>` | Deletes a job application from tracking records |
| **`GET`** | `/api/dashboard/stats` | None | Aggregates system metrics (placed counts, shortlisted, totals) |

### ID Format Validation
All route endpoints taking an `:id` parameter run through a validation middleware (`validateIdMiddleware.js`). 
- If you pass an invalid 24-character hexadecimal MongoDB ID format (e.g. placeholders like `company_id_here` or invalid text), the API will immediately return a clean **`400 Bad Request`** response:
  ```json
  {
    "success": false,
    "message": "Invalid ID format"
  }
  ```
  This prevents database-level query crashes and guarantees that a standard, robust JSON message is returned to the client rather than an unhandled 500 error.

---

##  Security & Middleware Details
All protected routes (like posting profiles, checking applications, and applying for jobs) are secured using standard bearer authorization middleware (`authMiddleware.js`). 
- When an API request is fired to a protected route, the middleware intercepts the header `Authorization`.
- It slices the string to isolate the JWT string, verifying it against the server-side `JWT_SECRET`.
- Once verified, the request is annotated with `req.user`, letting controllers identify user roles (`req.user.role`) and IDs (`req.user.id`).
