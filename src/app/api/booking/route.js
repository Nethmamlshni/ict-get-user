// src/app/api/booking/route.js
import dbConnect from "../../lib/mongoose";
import Booking from "../../models/booking";
import Counter from "../../models/counter";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import nodemailer from "nodemailer";

function formatTicketNumber(seq) {
  // Example: GT2025-000123  -> prefix + year + zero-padded seq
  const year = new Date().getFullYear();
  return `GT${year}-${String(seq).padStart(6, "0")}`;
}
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

    const counterDoc = await Counter.findOneAndUpdate(
      { _id: "booking" },         // counter key
      { $inc: { seq: 1 } },      // atomic increment
      { new: true, upsert: true } // create if missing and return the updated doc
    ).lean();

    const seq = counterDoc.seq || 1;
    const ticketNumber = formatTicketNumber(seq);
    // 3) Create booking
    const booking = await Booking.create({
      firstname,
      lastname,
      email,
      phone,
      paymentStatus: "pending",
      ticketNumber
    });

    // 4) Create signed JWT token referencing booking id
    const token = jwt.sign(
      { id: booking._id.toString(), email },
      process.env.JWT_SECRET,
      { expiresIn: "300d" } // change expiry to event date if needed
    );

    booking.qrToken = token;
    await booking.save();

    // 5) Create check-in URL and QR data URL (small size)
    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://ict-gettogether.vercel.app";
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

    // 8) HTML design — email-safe (tables + inline styles). Keeps your variables unchanged.
    const htmlBody = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width" />
        </head>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family: Arial, Helvetica, sans-serif;color:#111;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center" style="padding:28px 12px;">
                <!-- Card container -->
                <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:12px;box-shadow:0 6px 18px rgba(16,24,40,0.08);overflow:hidden;">
                  <tr>
                    <td style="padding:22px 24px;">
                      <!-- Header -->
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="font-size:18px;font-weight:600;color:#0f172a;padding-bottom:8px;">
                            Hi ${firstname || "Guest"},
                          </td>
                          <td align="right" style="font-size:12px;color:#9ca3af;">
                            GateTogether
                          </td>
                        </tr>
                      </table>

                      <!-- Body text -->
                      <p style="margin:12px 0 20px;line-height:1.5;color:#334155;font-size:15px;">
                        Thank you for registering. Please present this QR code at the gate.
                      </p>

                      <!-- Centered QR block -->
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border-radius:10px;padding:16px;text-align:center;">
                        <tr>
                          <td style="padding:8px 0;">
                            <img
                              src="cid:qr@gatetogether"
                              alt="QR Code"
                              style="display:block;margin:0 auto;max-width:260px;height:auto;border-radius:8px;border:1px solid rgba(2,6,23,0.06);"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top:10px;font-size:13px;color:#64748b;">
                            Present this QR at the gate for check-in
                          </td>
                        </tr>
                      </table>

                      <!-- Fallback link -->
                      <p style="margin:18px 0 0;font-size:14px;color:#475569;line-height:1.45;">
                        If the image does not display, open this link:
                        <a href="${checkinUrl}" style="color:#0369a1;text-decoration:none;font-weight:600;">Check-In</a>
                      </p>

                      <!-- Signature -->
                      <p style="margin:18px 0 0;color:#475569;font-size:14px;line-height:1.4;">
                        Regards,<br/>
                        <strong style="color:#0f172a;">GateTogether</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer small note -->
                  <tr>
                    <td align="center" style="padding:12px 16px;background:#fbfdff;font-size:12px;color:#9ca3af;">
                      Please present this QR at the gate. If you have questions, reply to this email.
                    </td>
                  </tr>
                </table>
                <!-- end card -->
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Your GateTogether QR Ticket",
      html: htmlBody,
      attachments: [
        {
          filename: "qrcode.png",
          content: imgBuffer,
          cid: "qr@gatetogether"
        }
      ]
    };

    // 9) Send email (catch errors separately)
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

    // 10) Success response
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
