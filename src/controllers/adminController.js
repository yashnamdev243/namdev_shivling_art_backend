const jwt = require("jsonwebtoken");

const ADMIN = {
  username: "yash",
  password: "yash",
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      username !== ADMIN.username ||
      password !== ADMIN.password
    ) {
      return res.status(401).json({
        status: false,
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        username: ADMIN.username,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      status: true,
      message: "Login Successful",
      token,
      admin: {
        username: ADMIN.username,
        role: "admin",
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.logout = async (req, res) => {
  return res.json({
    status: true,
    message: "Logout Successful",
  });
};