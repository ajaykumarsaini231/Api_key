const mongoose = require("mongoose");

let isConnected = false; // Track connection status

const connectDB = async () => {
    if (isConnected) {
        console.log("Using existing MongoDB connection");
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Avoid infinite waiting
        });

        isConnected = conn.connections[0].readyState === 1;
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw new Error("Failed to connect to MongoDB");
    }
};

module.exports = connectDB;
