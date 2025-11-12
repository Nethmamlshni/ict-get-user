// src/app/api/booking/route.js
import dbConnect from "../../lib/mongoose";
import Booking from "../../models/booking";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    // 1) DB connect
    await dbConnect();

    // 2) Parse body
    const body = await req.json();
    const { firstname, lastname, email, phone } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3) Create booking
    const booking = await Booking.create({
      firstname,
      lastname,
      email,
      phone,
      paymentStatus: "pending"
    });

    // 4) Create signed JWT token referencing booking id
    const token = jwt.sign(
      { id: booking._id.toString(), email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" } // change expiry to event date if needed
    );

    booking.qrToken = token;
    await booking.save();

    // 5) Create check-in URL and QR data URL (small size)
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const checkinUrl = `${base}/checkin?token=${token}`;
    const qrDataUrl = await QRCode.toDataURL(checkinUrl, { width: 300 }); // smaller image

    // 6) Prepare Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Optional: verify transporter (will throw if SMTP wrong)
    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.warn("SMTP verify failed:", verifyErr.message);
      // continue — we still attempt to send and will catch sendMail error below
    }

    // 7) Convert data-url -> buffer and attach as CID
    const base64 = qrDataUrl.split(",")[1];
    const imgBuffer = Buffer.from(base64, "base64");

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Your GateTogether QR Ticket",
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
          <p>Hi ${firstname || "Guest"},</p>
          <p>Thank you for registering. Please present this QR code at the gate.</p>
          <p><img src="cid:qr@gatetogether" style="max-width:300px; height:auto; display:block;" alt="QR Code" /></p>
          <p>If the image does not display, open this link: <a href="${checkinUrl}">Check-In</a></p>
          <p>Regards,<br/>GateTogether</p>
        </div>
      `,
      attachments: [
        {
          filename: "qrcode.png",
          content: imgBuffer,
          cid: "qr@gatetogether"
        }
      ]
    };

    // 8) Send email (catch errors separately)
    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error("Failed to send email:", mailErr);
      // optional: mark booking with emailFailure flag (requires schema change)
      // but return success with warning so user retains booking
      return new Response(
        JSON.stringify({
          ok: true,
          bookingId: booking._id,
          message: "Booking created but failed to send email: " + mailErr.message
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    // 9) Success response
    return new Response(
      JSON.stringify({ ok: true, bookingId: booking._id, qrDataUrl }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error /api/booking:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
