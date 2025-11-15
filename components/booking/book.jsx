"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function BookForm() {
  const [loading, setLoading] = useState(false);
  const [localPart, setLocalPart] = useState(""); // editable part before @gmail.com
  const [emailError, setEmailError] = useState(""); // inline validation message

  const FIXED_DOMAIN = "gmail.com";

  // Validate only the local part (user-editable) and final email
  const validateLocalPart = (local) => {
    if (!local || !local.trim()) return "Email local part is required.";
    // Disallow spaces and '@'. Allow common chars in local part.
    // Adjust regex if you want to allow/disallow more characters.
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
    if (!re.test(local)) {
      return "Use only valid characters (letters, numbers, . _ - + etc.) and no spaces.";
    }
    // local part must not start or end with a dot, and no consecutive dots
    if (local.startsWith(".") || local.endsWith(".")) {
      return "Local part cannot start or end with a dot.";
    }
    if (local.includes("..")) {
      return "Local part cannot contain consecutive dots.";
    }
    // length check: RFC allows up to 64 chars for local part
    if (local.length > 64) return "Local part is too long.";
    return "";
  };

  // returns full enforced email
  const makeFullEmail = (local) => `${local}@${FIXED_DOMAIN}`;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setEmailError("");

    const form = new FormData(e.target);
    // but we'll use localPart state to create final email
    const local = (localPart || form.get("localPart") || "").trim();

    // client-side validation
    const localErr = validateLocalPart(local);
    if (localErr) {
      setEmailError(localErr);
      toast.error(localErr);
      setLoading(false);
      return;
    }

    const email = makeFullEmail(local);

    // Keep your existing server-side check flow
    try {
      // Check if the email exists
      const checkEmailRes = await fetch(`/api/booking/check-email?email=${encodeURIComponent(email)}`);
      if (!checkEmailRes.ok) {
        const text = await checkEmailRes.text();
        console.error("Check email failed:", checkEmailRes.status, text);
        toast.error("Unable to verify email at the moment. Please try again.");
        setLoading(false);
        return;
      }
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
          firstname: form.get("firstname"),
          lastname: form.get("lastname"),
          email: email,
          phone: form.get("phone"),
          enrollmentnumber: form.get("enrollmentnumber"),
          campusbus: form.get("transport") === "true",
          boarding: form.get("hostel") === "true",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text}`);
      }

      const data = await res.json();

      if (typeof data.emailSent !== "undefined" && !data.emailSent) {
        toast.error("Booking saved but confirmation email was NOT sent. Please provide a correct email.");
        setLoading(false);
        return;
      }

      toast.success("Booking successful! QR sent to your email.");
      e.target.reset();
      setLocalPart("");
    } catch (err) {
      console.error(err);
      toast.error("Booking failed or confirmation email not sent. Please check the email and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 mt-5">
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
        <div className="relative h-40 sm:h-44 md:h-48">
          <Image
            src="/WhatsApp Image 2025-11-14 at 15.53.51.jpeg"
            alt="Design header"
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3" noValidate>
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

          {/* Email row: editable local part + fixed domain */}
          <div>
            <label className="text-xs font-semibold text-emerald-600 block mb-1">
              Email
            </label>

            <div className={`flex items-stretch w-full mb-1 border rounded-md overflow-hidden ${emailError ? "border-red-500" : ""}`}>
              <input
                id="localPart"
                name="localPart"
                type="text"
                aria-label={`Email local part (the domain is fixed as @${FIXED_DOMAIN})`}
                placeholder="yourname"
                value={localPart}
                onChange={(e) => {
                  // strip any @ or domain if user pastes full email
                  let v = e.target.value || "";
                  // if user pasted a full email like "foo@bar.com", take only left of '@'
                  if (v.includes("@")) v = v.split("@")[0];
                  // remove spaces
                  v = v.replace(/\s+/g, "");
                  setLocalPart(v);
                }}
                onBlur={() => {
                  const err = validateLocalPart(localPart.trim());
                  setEmailError(err);
                }}
                className="flex-1 p-2 border-none outline-none"
                required
              />
              <span className="px-3 py-2 select-none text-sm bg-gray-100 border-l border-gray-200">@{FIXED_DOMAIN}</span>
            </div>

            {/* hidden input that will be sent if the form is submitted traditionally; we still construct email in JS for fetch */}
            <input type="hidden" name="email" value={makeFullEmail(localPart.trim())} />

            {emailError ? (
              <p className="text-red-600 text-xs mb-2">{emailError}</p>
            ) : (
              <p className="text-gray-500 text-xs mb-2">Only <strong>@{FIXED_DOMAIN}</strong> addresses are allowed. You may enter just the part before <code>@{FIXED_DOMAIN}</code>.</p>
            )}
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
            className="flex-1 px-20 py-2 rounded-full bg-emerald-600 text-white font-semibold disabled:opacity-60 "
          >
            {loading ? "Sending..." : "Apply for Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}
