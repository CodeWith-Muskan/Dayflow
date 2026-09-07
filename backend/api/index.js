const connectDB = require("../config/db");
const app = require("../server");

// Vercel serverless entry. Ensure the database is connected before the
// Express app begins handling requests (avoids buffered-query timeouts).
let serverPromise;

async function handler(req, res) {
  if (!serverPromise) {
    serverPromise = connectDB().catch((err) => {
      // Don't permanently cache a failed connection.
      serverPromise = undefined;
      throw err;
    });
  }
  try {
    await serverPromise;
  } catch {
    // Let Express (no DB needed) respond; DB-dependent routes will still
    // surface a clear error via their controllers.
  }
  return app(req, res);
}

module.exports = handler;
