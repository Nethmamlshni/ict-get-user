"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function BookForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);
    const body = Object.fromEntries(form);

    try {
      // Check if the email exists
      const checkEmailRes = await fetch(`/api/booking/check-email?email=${body.email}`);
      const { exists } = await checkEmailRes.json();

      if (exists) {
        toast.error("You already have a ticket with this email. Please check your inbox.");
        setLoading(false);
        return;
      }

      // Create a new booking
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: body.firstname,
          lastname: body.lastname,
          email: body.email,
          phone: body.phone,
          enrollmentnumber: body.enrollmentnumber,
          // Convert select string "true"/"false" to boolean
          campusbus: body.transport === "true",
          boarding: body.hostel === "true",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text}`);
      }

      const data = await res.json();
      toast.success("Booking successful! QR sent to your email.");
      e.target.reset();
    } catch (err) {
      console.error(err);
      toast.error("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 mt-5">
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
        <div className="relative h-40 sm:h-44 md:h-48">
          <Image
            src="/Screenshot 2025-11-13 at 02.48.24.png"
            alt="Design header"
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label htmlFor="firstname" className="text-xs font-semibold text-emerald-600 block mb-1">
              First name
            </label>
            <input id="firstname" name="firstname" placeholder="First name" required className="w-full p-2 border rounded-md mb-2" />
          </div>

          <div>
            <label htmlFor="lastname" className="text-xs font-semibold text-emerald-600 block mb-1">
              Last name
            </label>
            <input id="lastname" name="lastname" placeholder="Last name" required className="w-full p-2 border rounded-md mb-2" />
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-semibold text-emerald-600 block mb-1">
              Email
            </label>
            <input id="email" name="email" type="email" placeholder="Email" required className="w-full p-2 border rounded-md mb-2" />
          </div>

          <div>
            <label htmlFor="phone" className="text-xs font-semibold text-emerald-600 block mb-1">
              Phone
            </label>
            <input id="phone" name="phone" placeholder="Phone" required className="w-full p-2 border rounded-md mb-2" />
          </div>

          <div>
            <label htmlFor="enrollmentnumber" className="text-xs font-semibold text-emerald-600 block mb-1">
              Enrollment Number
            </label>
            <input id="enrollmentnumber" name="enrollmentnumber" placeholder="Enrollment Number" required className="w-full p-2 border rounded-md mb-2" />
          </div>

          <div className="flex justify-between gap-4">
            <div>
              <label htmlFor="transport" className="text-xs font-semibold text-emerald-600 mb-1">
                Do you need Transport?
              </label>
              <select id="transport" name="transport" required className="w-full p-2 border rounded-md mb-2">
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label htmlFor="hostel" className="text-xs font-semibold text-emerald-600 mb-1">
                Are you staying in hostel?
              </label>
              <select id="hostel" name="hostel" required className="w-full p-2 border rounded-md mb-2">
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-30 py-2 rounded-full bg-emerald-600 text-white font-semibold disabled:opacity-60 "
          >
            {loading ? "Sending..." : "Apply for Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}
