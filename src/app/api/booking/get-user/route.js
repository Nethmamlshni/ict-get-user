// src/app/api/booking/get-user/route.js
import dbConnect from "../../../lib/mongoose";
import Booking from "../../../models/booking";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return new Response(JSON.stringify({ found: false, message: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const booking = await Booking.findOne(
      { email },
      {
        firstname: 1,
        lastname: 1,
        email: 1,
        phone: 1,
        enrollmentnumber: 1,
        boarding: 1,
        campusbus: 1,
        paymentStatus: 1,
        qrToken: 1,
        createdAt: 1,
        _id: 0,
      }
    ).lean();

    if (!booking) {
      return new Response(JSON.stringify({ found: false, message: "Booking not found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ found: true, data: booking }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching booking by email:", err);
    return new Response(JSON.stringify({ found: false, message: err.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
