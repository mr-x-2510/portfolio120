const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email and message are all required." });
    }

    const contact = await Contact.create({ name, email, message });
    return res.status(201).json({ message: "Message received.", data: contact });
  } catch (err) {
    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: firstError });
    }
    console.error("Error saving contact message:", err);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
});

router.get("/", async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    return res.json({ count: messages.length, data: messages });
  } catch (err) {
    console.error("Error fetching contact messages:", err);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
});

module.exports = router;