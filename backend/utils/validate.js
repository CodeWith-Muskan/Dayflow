const mongoose = require("mongoose");

const isValidObjectId = (id) =>
  id != null && mongoose.isValidObjectId(String(id));

module.exports = { isValidObjectId };