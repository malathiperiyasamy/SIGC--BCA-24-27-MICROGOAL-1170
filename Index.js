require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const errormiddleware = require("./Middlewares/errormiddleware");

const PORT = process.env.PORT;
const Mongo_Url = process.env.MONGO_URL;

const authRoute = require("./Router/AuthRouter");
const GoalRouter = require("./Router/GoalRouter");

mongoose
  .connect(Mongo_Url)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/", authRoute);
app.use("/", GoalRouter);

app.use(errormiddleware);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});