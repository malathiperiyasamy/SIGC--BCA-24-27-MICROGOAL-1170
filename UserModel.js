const mongoose = require("mongoose");
const model = mongoose.model;
const userSchema = require("../Schema/User");
const userModel = new model("User", userSchema);

module.exports = userModel;
