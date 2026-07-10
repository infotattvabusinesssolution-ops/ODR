const mongoose = require("mongoose");

// Auto-increment counter for request IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const serviceRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userRole: {
      type: String,
      enum: ["claimant", "neutral", "respondent"],
      required: true,
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
    adminResponse: { type: String, default: "" },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-generate requestId before save
serviceRequestSchema.pre("save", async function (next) {
  if (!this.requestId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        "serviceRequestId",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.requestId = `SR-${counter.seq}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
