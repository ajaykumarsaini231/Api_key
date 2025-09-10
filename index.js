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
const allowedOrigins = [
  "http://localhost:5173", // local dev frontend
  "https://my-app-sigma-ivory-19.vercel.app", // deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // allow cookies
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database Before Handling Requests
// app.use(async (req, res, next) => {
//     try {
//         await connectDB(); // Ensure MongoDB connection
//         console.log("hello")
//         next();
//     } catch (error) {
//         console.error("Database connection failed", error);
//         return res.status(500).json({ message: "Internal Server Error" });
//     }
// });

// Routes
app.get('/', (req, res) => {
    res.json({ message: "Hello from the server" });
});

app.use("/api/auth", authRouter);
app.use("/api/posts",postsRouter)
// Start Server
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Could not start server:", err);
    process.exit(1);
  });
