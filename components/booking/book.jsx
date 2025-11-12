"use client";
import { useState } from "react";

export default function BookForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);
    const body = Object.fromEntries(form);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: body.firstname,
          lastname: body.lastname,
          email: body.email,
          phone: body.phone,
          ticketType: body.ticketType
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text}`);
      }

      const data = await res.json();
      console.log("Booking created:", data);
      alert("Booking successful! QR sent to your email.");
      e.target.reset();
    } catch (err) {
      console.error(err);
      alert("Booking failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4">
      <input name="firstname" placeholder="First name" className="w-full p-2 border mb-2" />
      <input name="lastname" placeholder="Last name" className="w-full p-2 border mb-2" />
      <input name="email" type="email" placeholder="Email" className="w-full p-2 border mb-2" required />
      <input name="phone" placeholder="Phone" className="w-full p-2 border mb-2" />
      <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? "Sending..." : "Apply for Ticket"}
      </button>
    </form>
  );
}
