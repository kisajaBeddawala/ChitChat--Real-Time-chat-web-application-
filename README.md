# ChitChat - real time chat web application

## Project Overview
ChitChat is a real-time chat web application that allows users to communicate instantly with each other. Built using modern web technologies, ChitChat provides a seamless and interactive chatting experience.

This project is built to understand how real-time communication works on the web using WebSockets and to practice building a full-stack web application.


## Features
- user authentication (sign up, log in, log out)
- secure authentication using JWT (JSON Web Tokens)
- real-time messaging using WebSockets
- online/offline user handling


## Tech Stack

### Frontend
- React.js
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Socket.io (WebSocket)

### Database
- MongoDB

### Tools
- Git & GitHub
- Postman (API testing)
- VSCode (Code editor)


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
    ```

5. **Start the backend server**
    ```bash
    cd backend
    npm start
    ```

6. **Start the frontend development server**
    ```bash
    cd frontend
    npm start
    ```

7. **Access the application**
    
    Open your browser and navigate to `http://localhost:3000`


## Project Structure
```
chitchat/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── socket/
│   ├── .env.example
│   ├── .gitignore
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```


## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Messages
- `GET /api/messages/:userId` - Get messages between current user and specified user
- `POST /api/messages/send/:userId` - Send a message to specified user


## WebSocket Events

### Client to Server
- `connection` - User connects to the server
- `disconnect` - User disconnects from the server
- `sendMessage` - Send a message to another user

### Server to Client
- `newMessage` - Receive a new message
- `userOnline` - Notification when a user comes online
- `userOffline` - Notification when a user goes offline

## Contact
- **Developer**: Kisaja Beddawala
- **Email**: kisajab72@gmail.com
- **GitHub**: [@kisajaBeddawala](https://github.com/kisajaBeddawala)
- **Project Link**: [https://github.com/kisajaBeddawala/ChitChat--Real-Time-chat-web-application-]


if this project helped you, please give a star ⭐ on GitHub!