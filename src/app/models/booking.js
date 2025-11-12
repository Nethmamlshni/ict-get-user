// models/Booking.js
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      trim: true,
    },
    lastname: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true, // Prevent duplicate registrations (optional)
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    qrToken: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
    },
    ticketNumber: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Ensure timestamps and schema-level security
    timestamps: true,
    versionKey: false,
  }
);

// Prevent Mongoose OverwriteModelError during hot reloads in Next.js
export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
