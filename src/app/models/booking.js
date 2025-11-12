// models/Booking.js
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: { type: String, required: true },
  phone: String,
  paymentStatus: { type: String, enum: ["pending","paid"], default: "pending" },
  qrToken: String,
  checkedIn: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
