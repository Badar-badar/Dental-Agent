import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  { sessionId: { type: String, unique: true }, history: String },
  { timestamps: true }
);

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);

export default Session;
