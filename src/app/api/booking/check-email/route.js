// src/app/api/booking/check-email/route.js
import dbConnect from "../../../lib/mongoose";
import Booking from "../../../models/booking";

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) return new Response(JSON.stringify({ exists: false }), { status: 400 });

  const existing = await Booking.findOne({ email });
  return new Response(JSON.stringify({ exists: !!existing }), { status: 200 });
}
