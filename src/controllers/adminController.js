const jwt = require("jsonwebtoken");

const ADMIN = {
    email: "yash@vidyagxp.com",
    password: "yash"
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email !== ADMIN.email ||
      password !== ADMIN.password
    ) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        email: ADMIN.email,
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
      user: {
        name: "Admin",
        email: ADMIN.email,
        role: "admin",
      },
    });
  } catch (err) {
    res.status(500).json({
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