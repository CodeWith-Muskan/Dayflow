const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("MONGO_URI is not defined in environment variables");
}

// Cache the connection across warm serverless invocations so we don't
// re-connect on every request. `global.mongoose` survives cold/warm cycles
// on Vercel.
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 1,
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
  return cached.conn;
};

module.exports = connectDB;
module.exports.mongoose = mongoose;
