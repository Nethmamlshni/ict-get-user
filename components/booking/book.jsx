"use client";
import { useState } from "react";
import Image from "next/image"; // keep if using Next.js; otherwise replace <Image /> with <img />
import toast from "react-hot-toast";
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
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text}`);
      }

      const data = await res.json();
      console.log("Booking created:", data);
      toast("Booking successful! QR sent to your email.", { type: "success" });
      e.target.reset();
    } catch (err) {
      console.error(err);
      toast("Booking failed: " + err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
        {/* Top design image — put hotel-card.png in /public */}
        <div className="relative h-40 sm:h-44 md:h-48">
          <Image
            src="/Screenshot 2025-11-13 at 02.48.24.png"
            alt="Design header"
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 100vw, 768px"
          />
          {/* If not using next/image, replace above with:
              <img src="/hotel-card.png" alt="Design header" className="w-full h-full object-cover" />
          */}
        </div>

        {/* Form (keeps your original inputs + submit logic) */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label htmlFor="firstname" className="text-xs font-semibold text-emerald-600 block mb-1">
              First name
            </label>
            <input
              id="firstname"
              name="firstname"
              placeholder="First name"
              className="w-full p-2 border rounded-md mb-2"
            />
          </div>

          <div>
            <label htmlFor="lastname" className="text-xs font-semibold text-emerald-600 block mb-1">
              Last name
            </label>
            <input
              id="lastname"
              name="lastname"
              placeholder="Last name"
              className="w-full p-2 border rounded-md mb-2"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-semibold text-emerald-600 block mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full p-2 border rounded-md mb-2"
            />
          </div>

          <div>
            <label htmlFor="phone" className="text-xs font-semibold text-emerald-600 block mb-1">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              placeholder="Phone"
              className="w-full p-2 border rounded-md mb-2"
            />
          </div>

          {/* Keep the same button text and disabled behavior */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold disabled:opacity-60"
            >
              {loading ? "Sending..." : "Apply for Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
