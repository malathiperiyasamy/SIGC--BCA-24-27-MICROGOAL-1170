const express = require("express");
const router = express.Router();
const goalModel = require("../Model/GoalModel");
const authmiddleware = require("../Middlewares/authMiddleware");

router.post("/create", authmiddleware, async (req, res, next) => {
  try {
    const { title } = req.body;
    const goal = new goalModel({
      title: title,
      user: req.user,
    });
    await goal.save();
    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", authmiddleware, async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await goalModel.findOne({
      _id: id,
      user: req.user,
    });
    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", authmiddleware, async (req, res, next) => {
  try {
    const goal = await goalModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      { completed: req.body.completed },
      { new: true },
    );
    res.status(200).json({
      success: true,
      message: "the goal is completed",
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", authmiddleware, async (req, res, next) => {
  try {
    await goalModel.findOneAndDelete({
      _id: req.params.id,
    });

    res.status(200).json({ message: "Goal deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
