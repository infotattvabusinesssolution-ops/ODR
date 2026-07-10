const mongoose = require("mongoose");

// Counter for Transaction IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 },
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const paymentSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate transactionId TXN-XXXX
paymentSchema.pre("save", async function (next) {
  if (!this.transactionId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        "paymentTransactionId",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.transactionId = `TXN-${counter.seq}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
