# Backend API for Team 10 Practicum
This is the backend repository for Team 1 of the Baboon/Bald Eagle Practicum. It provides APIs for user authentication and progress tracking, built with Node.js, TypeScript, Express, and MongoDB. The API documentation is available via Swagger UI.
Prerequisites
Before running the backend, ensure you have the following installed:
Node.js: Version 16.x or higher (tested with 18.x)

npm: Version 8.x or higher (comes with Node.js)

MongoDB: A running MongoDB instance (local or cloud, e.g., MongoDB Atlas)

Setup Instructions
Follow these steps to get the backend running locally and view the API documentation.
1. Clone the Repository

git clone <repository-url>
cd bb-practicum-team-1-back

2. Install Dependencies
   Install the required Node.js packages:

npm install

3. Configure Environment Variables
   Create a .env file in the root directory (bb-practicum-team-1-back/) and add the following variables:

PORT=8000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-secret-key>
BASE_URL_FRONT=http://localhost:5173

MONGO_URI: Replace <your-mongodb-connection-string> with your MongoDB connection string (e.g., mongodb://localhost:27017/yourdb for local or a MongoDB Atlas URI).

JWT_SECRET: A secure string for JWT signing (e.g., mysecretkey123).

BASE_URL_FRONT: The frontend URL (default is http://localhost:5173 for Vite/React apps).

Example .env:

PORT=8000
MONGO_URI=mongodb://localhost:27017/practicum_db
JWT_SECRET=mysecretkey123
BASE_URL_FRONT=http://localhost:5173

4. Run the Backend
   Start the development server with hot-reloading:
   bash

npm run dev

This uses nodemon and ts-node to run src/server.ts.

The server will start on http://localhost:8000 (or your PORT if changed).

You’ll see Server is listening on port 8000... in the console if successful.

5. View API Documentation
   Open your browser and go to:

http://localhost:8000/api-docs

The Swagger UI displays interactive documentation for the following endpoints:
Auth:
POST /api/v1/auth/register/user: Register a new user

POST /api/v1/auth/login: Log in a user

User:
GET /api/v1/user/{id}/progress: Fetch user progress (requires JWT)

POST /api/v1/user/{id}/progress: Update user progress (requires JWT)

Use the "Authorize" button in Swagger UI to input a Bearer token (obtained from the login endpoint).

6. Test the API
   Register a User:
   bash

curl -X POST http://localhost:8000/api/v1/auth/register/user \
-H "Content-Type: application/json" \
-d '{"name":"Alex","email":"alex@gmail.com","password":"secret","verifyPassword":"secret"}'

Login:
bash

curl -X POST http://localhost:8000/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"alex@gmail.com","password":"secret"}'

Copy the token from the login response and use it in Swagger UI or cURL for protected routes (e.g., /api/v1/user/{id}/progress).

Project Structure

bb-practicum-team-1-back/
├── src/
│   ├── app.ts              # Express app setup
│   ├── server.ts           # Server entry point
│   ├── swagger.ts          # Swagger configuration
│   ├── routes/             # API route definitions
│   ├── controllers/        # Route handlers
│   ├── models/             # Mongoose schemas
│   ├── middleware/         # Custom middleware (e.g., auth)
│   ├── errors/             # Custom error classes
│   └── db/                 # Database connection
├── public/                 # Static files (e.g., profile pictures)
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration

Notes for Frontend Engineers
CORS: Configured to allow requests from BASE_URL_FRONT (default: http://localhost:5173). Update .env if your frontend runs on a different port.

Authentication: Protected endpoints (/api/v1/user/*) require a Bearer token in the Authorization header.

Profile Pictures: Served from /public/ (e.g., http://localhost:8000/3.png).

Progress Data: Returned as { progress: { css, html, jsChallenges, jsTheory } }, where values are percentages (0-100).

Troubleshooting
Swagger UI Blank: Ensure swagger.ts is in src/ and the server logs show a populated Swagger Spec. Restart with npm run dev.

MongoDB Connection: Verify MONGO_URI is correct and MongoDB is running.

Port Conflict: Change PORT in .env if 8000 is in use.

For issues, contact the backend team with logs from npm run dev.

