// src/app/api/checkin/route.js
import dbConnect from "../../lib/mongoose";
import Booking from "../../models/booking";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    await dbConnect();

    // Extract token from URL query ?token=xxxx
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Token missing" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify token (catch invalid/expired)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT verify failed:", err);
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = decoded;
    if (!id) {
      return new Response(JSON.stringify({ error: "Invalid token payload" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find the booking in the DB
    const booking = await Booking.findById(id);
    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Optional extra safety: ensure token matches stored qrToken (if you saved it)
    if (booking.qrToken && booking.qrToken !== token) {
      return new Response(JSON.stringify({ error: "Token mismatch" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If not yet checked-in, mark as checked-in now (auto check-in on scan)
    if (!booking.checkedIn) {
      booking.checkedIn = true;
      booking.checkedInAt = new Date();
      // you can also store who scanned (if you have user info) or gate id
      await booking.save();
    }

    // Prepare response (only safe/public fields)
    const resp = {
      success: true,
      message: "Booking found",
      data: {
        firstname: booking.firstname,
        lastname: booking.lastname,
        email: booking.email,
        phone: booking.phone,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
        checkedIn: booking.checkedIn || false,
        checkedInAt: booking.checkedInAt || null,
      },
    };

    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Check-in error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
