import dbConnect from "../../../lib/mongoose";
import Booking from "../../../models/booking";

export async function GET(req) {
  try {
    await dbConnect();

    const bookings = await Booking.find().sort({ createdAt: -1 }); // latest first

    return new Response(
      JSON.stringify({ bookings }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ message: err.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
