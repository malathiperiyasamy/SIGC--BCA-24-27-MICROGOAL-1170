const errormiddleware = (err, req, res, next) => {
  console.log(err);
  const status = err.status|| 500;
  const message = err.message || "server error";
  res.status(status).json({
    success: false,
    message: message,
  });
};

module.exports = errormiddleware;