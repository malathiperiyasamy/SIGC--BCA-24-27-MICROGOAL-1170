const jwt = require("jsonwebtoken");
require("dotenv").config();
const genrateToken = (userId) => {
  const token = jwt.sign({ userId: userId }, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });
  return token;
};
module.exports = genrateToken;
