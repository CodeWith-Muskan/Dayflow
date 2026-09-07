const mongoose = require("mongoose");
const { parse } = require("path");

(async () => {
  const uri = process.argv[2];
  const userId = process.argv[3];
  const pastDateKey = process.argv[4];
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
  const Task = mongoose.models.Task || require("./models/Task");
  const task = await Task.create({
    user: userId,
    title: "Legacy past task",
    dateKey: pastDateKey,
    taskDate: new Date(`${pastDateKey}T00:00:00.000Z`),
    category: null,
  });
  console.log(task._id.toString());
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});