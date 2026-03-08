const goalSchema = require("../Schema/GoalSchema");
const mongoose = require("mongoose");
const model = mongoose.model;

const goalModel = new model("goal", goalSchema);

module.exports = goalModel;
