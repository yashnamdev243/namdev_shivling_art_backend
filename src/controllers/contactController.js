// controllers/contactController.js

const Contact = require("../models/Contact");

exports.send = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const contact = await Contact.create({
      name,
      phone,
      email,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your inquiry has been sent successfully.",
      data: contact,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to send message.",
    });
  }
};