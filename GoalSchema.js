const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const goalSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  completed: {
    type: Boolean,
    default: false,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports=goalSchema;
