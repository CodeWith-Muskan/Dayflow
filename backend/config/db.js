const mongoose = require("mongoose");

let connected = false;

const connectDB = async () => {
  if (connected && mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: true,
      serverSelectionTimeoutMS: 10000,
    });
    connected = true;
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    // Do not exit the process (serverless functions must not call
    // process.exit). Mongoose will buffer commands while disconnected.
    console.error("MongoDB connection failed:", error.message);
  }
};

module.exports = connectDB;
module.exports.connected = () => connected;