# Village Connect - Full Stack Platform

A comprehensive full-stack web application for connecting village communities, reporting problems, proposing solutions, and fostering community discussions.

## Features

- **User Authentication**: Secure registration and login system with JWT tokens
- **Problem Reporting**: Report community issues with categories, priorities, and locations
- **Solution Proposals**: Propose and upvote solutions for reported problems
- **Community Forum**: Engage in discussions, share announcements, and connect with villagers
- **Admin Dashboard**: Manage users, problems, solutions, and forum posts

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- express-validator for input validation

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- React Icons for icons
- Modern CSS with responsive design

## Project Structure

```
Village_Connect/
├── backend/
│   ├── models/          # MongoDB models (User, Problem, Solution, ForumPost)
│   ├── routes/          # API routes (auth, problems, solutions, forum, admin)
│   ├── middleware/      # Authentication middleware
│   ├── server.js        # Express server entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/  # Reusable components (Navbar, PrivateRoute, etc.)
│   │   ├── pages/       # Page components
│   │   ├── context/     # React Context (AuthContext)
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/villageconnect
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

4. Start MongoDB (if running locally):
```bash
# On Windows (if MongoDB is installed as a service, it should start automatically)
# On macOS/Linux:
mongod
```

5. Start the backend server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Problems
- `GET /api/problems` - Get all problems (with filters)
- `GET /api/problems/:id` - Get single problem
- `POST /api/problems` - Create a problem (protected)
- `PUT /api/problems/:id` - Update problem (protected)
- `POST /api/problems/:id/upvote` - Upvote problem (protected)
- `PUT /api/problems/:id/status` - Update status (admin only)

### Solutions
- `GET /api/solutions` - Get all solutions
- `GET /api/solutions/:id` - Get single solution
- `POST /api/solutions` - Create a solution (protected)
- `POST /api/solutions/:id/upvote` - Upvote solution (protected)
- `POST /api/solutions/:id/comments` - Add comment (protected)
- `PUT /api/solutions/:id/status` - Update status (admin only)

### Forum
- `GET /api/forum` - Get all forum posts
- `GET /api/forum/:id` - Get single post
- `POST /api/forum` - Create a post (protected)
- `POST /api/forum/:id/upvote` - Upvote post (protected)
- `POST /api/forum/:id/comments` - Add comment (protected)
- `PUT /api/forum/:id/pin` - Pin/unpin post (admin only)

### Admin
- `GET /api/admin/stats` - Get dashboard statistics (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id/role` - Update user role (admin only)

## Default Admin Account

To create an admin account, you can either:
1. Register a new account and update the role in the database
2. Use MongoDB shell to create an admin user directly

Example MongoDB command:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Usage

1. **Register/Login**: Create an account or login to access all features
2. **Report Problems**: Click "Report Problem" to submit community issues
3. **Propose Solutions**: View problems and propose solutions with cost and time estimates
4. **Forum**: Participate in community discussions and announcements
5. **Admin Dashboard**: Admins can manage all content and users

## Features in Detail

### Problem Reporting
- Categorize problems (infrastructure, health, education, etc.)
- Set priority levels (low, medium, high, urgent)
- Track status (open, in-progress, resolved, closed)
- Upvote important problems
- View solutions for each problem

### Solution Proposals
- Propose detailed solutions with descriptions
- Include cost and time estimates
- Upvote best solutions
- Comment on solutions
- Track implementation status

### Community Forum
- Create posts in different categories
- Pin important announcements (admin)
- Comment and upvote posts
- Engage in discussions

### Admin Dashboard
- View statistics and analytics
- Manage user roles
- Update problem and solution statuses
- Monitor all platform activity

## Development

### Running in Development Mode

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

The build folder will contain the production-ready static files.

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000/api)

## License

This project is open source and available for use.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

