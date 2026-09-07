const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const Task = require("./models/Task");
const { backfillDateKeys } = require("./utils/dateUtils");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const goalRoutes = require("./routes/goalRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

dotenv.config();

const app = express();

connectDB();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "DayFlow API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/analytics", analyticsRoutes);

module.exports = app;

// Only `app.listen` when this file is run directly (local dev), not when
// imported as a serverless function by Vercel.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Backfill dateKey for legacy tasks (idempotent).
    backfillDateKeys(Task)
      .then((count) => {
        if (count > 0) {
          console.log(`Backfilled dateKey for ${count} legacy tasks.`);
        }
      })
      .catch((err) => {
        console.error("Failed to backfill dateKey:", err.message);
      });
  });
}