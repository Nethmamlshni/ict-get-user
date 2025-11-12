import dbConnect from "../../../../lib/mongoose";
import Booking from "../../../../models/booking";

export async function PUT(req, context) {
  try {
    await dbConnect();

  // `context.params` may be a Promise in Next.js app routes; await it
  const params = await context.params;
  const { id } = params;
  console.log("Updating booking ID:", id); // should print real ID

    const body = await req.json();
    const { paymentStatus } = body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    );

    if (!booking) {
      return new Response(
        JSON.stringify({ message: "Booking not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Payment status updated", booking }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ message: err.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
