const express = require('express');
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require('dotenv').config();
const connectDB = require('./connection'); // Import database connection function

const app = express();
const authRouter = require('./routers/authrouter');
const postsRouter = require('./routers/postsrouter');

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database Before Handling Requests
app.use(async (req, res, next) => {
    try {
        await connectDB(); // Ensure MongoDB connection
        next();
    } catch (error) {
        console.error("Database connection failed", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// Routes
app.get('/', (req, res) => {
    res.json({ message: "Hello from the server" });
});

app.use("/api/auth", authRouter);
app.use("/api/posts",postsRouter)
// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
