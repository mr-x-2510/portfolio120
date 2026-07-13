const mongoose = require("mongoose");

// ── MongoDB connection (cached across warm invocations) ──────────────────────
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
}

// ── Inline schema (no separate models/ dir needed for a single function) ─────
const contactSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true, maxlength: 100 },
    email:   { type: String, required: true, trim: true, lowercase: true,
               match: [/^\S+@\S+\.\S+$/, "Invalid email"] },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// Prevent "Cannot overwrite model" errors on hot-reload
const Contact =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);

// ── Vercel Serverless Handler ─────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS headers (Vercel handles the domain, but explicit is safer)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Pre-flight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    await connectDB();

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
    console.error("Contact handler error:", err);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};
