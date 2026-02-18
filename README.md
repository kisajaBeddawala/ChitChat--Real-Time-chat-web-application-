# ChitChat - real time chat web application

## Project Overview
ChitChat is a real-time chat web application that allows users to communicate instantly with each other. Built using modern web technologies, ChitChat provides a seamless and interactive chatting experience.

This project is built to understand how real-time communication works on the web using WebSockets and to practice building a full-stack web application.


## Features
- User authentication (sign up, log in, log out)
- Secure authentication using JWT (JSON Web Tokens)
- Real-time messaging using Socket.io
- Online/offline user status tracking
- Profile picture upload with Cloudinary
- User profile management


## Tech Stack

### Frontend
- React.js (v19.2.0)
- Tailwind CSS (v4.1.18)
- Vite (build tool)
- React Router DOM (routing)
- Axios (HTTP client)
- React Hot Toast (notifications)
- Socket.io Client

### Backend
- Node.js
- Express.js (v5.2.1)
- Socket.io (v4.8.3)
- MongoDB with Mongoose
- Cloudinary (image upload)
- bcrypt (password hashing)

### Database
- MongoDB

### Tools
- Git & GitHub
- Postman (API testing)
- VSCode (Code editor)
- Vercel (deployment)


## Installation and Setup Instructions
### Prerequisites
- Node.js (v14 or higher)
- MongoDB installed and running locally or a MongoDB Atlas account
- npm or yarn package manager

### Steps to Run Locally

1. **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/chitchat.git
    cd chitchat
    ```

2. **Install dependencies for backend**
    ```bash
    cd backend
    npm install
    ```

3. **Install dependencies for frontend**
    ```bash
    cd ../frontend
    npm install
    ```

4. **Configure environment variables**
    
    Create a `.env` file in the backend directory with the following variables:
    ```
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    PORT=5000
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    ```

5. **Start the backend server**
    ```bash
    cd backend
    npm run dev
    ```

6. **Start the frontend development server**
    ```bash
    cd frontend
    npm run dev
    ```

7. **Access the application**
    
    Open your browser and navigate to `http://localhost:5173` (Vite default port)


## Project Structure
```
ChitChat web application/
├── backend/
│   ├── controllers/
│   │   ├── messageController.js
│   │   └── userController.js
│   ├── lib/
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   └── utils.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Message.js
│   │   └── User.js
│   ├── routes/
│   │   ├── messageRoutes.js
│   │   └── userRoutes.js
│   ├── package.json
│   ├── server.js
│   └── vercel.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   └── assets.js
│   │   ├── components/
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── RightSidebar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ChatContext.jsx
│   │   ├── lib/
│   │   │   └── utils.js
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
└── README.md
```


## API Endpoints

### Authentication & Users
- `POST /api/users/signup` - Register a new user
- `POST /api/users/login` - Login user
- `PUT /api/users/update-profile` - Update user profile (requires authentication)
- `GET /api/users/check` - Check authentication status

### Messages
- `GET /api/messages/:userId` - Get messages between current user and specified user
- `POST /api/messages/send/:userId` - Send a message to specified user


## Socket.io Events

### Client to Server
- `connection` - User connects to the server (with userId in query)
- `disconnect` - User disconnects from the server

### Server to Client
- `getOnlineUsers` - Receive list of currently online users
- `newMessage` - Receive a new message in real-time

### Real-time Features
- Online/offline user status tracking
- Instant message delivery
- Live user presence indicators

## Contact
- **Developer**: Kisaja Beddawala
- **Email**: kisajab72@gmail.com
- **GitHub**: [@kisajaBeddawala](https://github.com/kisajaBeddawala)
- **Project Link**: [https://github.com/kisajaBeddawala/ChitChat--Real-Time-chat-web-application-]


if this project helped you, please give a star ⭐ on GitHub!