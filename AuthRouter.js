const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userValidation = require("../validation/userValidation");
const userModel = require("../Model/UserModel");
const genrateToken = require("../utills/genratetoken");
router.post("/signup", async (req, res, next) => {
  try {
    const { error } = userValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "enter the data correctly",
      });
    }
    const { name, email, password } = req.body;
    const exist = await userModel.findOne({ email });
    if (exist) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashpassword = await bcrypt.hash(password, 10);
    const user = new userModel({
      name: name,
      email: email,
      password: hashpassword,
    });
    await user.save();
    const token = genrateToken(user._id);
    res.status(200).json({
      success: true,
      message: "user is created",
      token: token,
      data: user,
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      const err = new Error("user not found");
      err.status = 400;
      return next(err);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("Wrong Password");
      err.status = 400;
      return next(err);
    }
    const token = genrateToken(user._id);
    res.status(200).json({
      success: true,
      message: "login succesfully",
      token: token,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
