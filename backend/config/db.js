const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("MONGO_URI is not defined in environment variables");
}

// Cache the connection across serverless invocations so we don't reconnect
// on every request. `global.mongoose` survives warm cycles on Vercel.
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// If the socket drops between invocations, drop the cached connection so the
// next request reconnects.
mongoose.connection.on("disconnected", () => {
  cached.conn = null;
});

const connectDB = async () => {
  // Reuse the connection only if it is genuinely still alive.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: true,
        bufferTimeoutMS: 15000,
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongooseInstance) => {
        console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error("MongoDB connection failed:", error.message);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  cached.promise = null;
  return cached.conn;
};

module.exports = connectDB;
module.exports.mongoose = mongoose;