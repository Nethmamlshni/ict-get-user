// app/booking/details/page.jsx
"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import UserDetailsCard from "../details/details"; // adjust path if needed

const FIXED_DOMAIN = "gmail.com";

const validateLocalPart = (local) => {
  if (!local || !local.trim()) return "Email local part is required.";
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!re.test(local)) return "Use only valid characters (letters, numbers, . _ - + etc.) and no spaces.";
  if (local.startsWith(".") || local.endsWith(".")) return "Local part cannot start or end with a dot.";
  if (local.includes("..")) return "Local part cannot contain consecutive dots.";
  if (local.length > 64) return "Local part is too long.";
  return "";
};

export default function BookingDetailsPage() {
  const router = useRouter();

  // separate states for lookup and the main form's email local part
  const [lookupLocalPart, setLookupLocalPart] = useState("");
  const [formLocalPart, setFormLocalPart] = useState("");

  const [lookupEmail, setLookupEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phone, setPhone] = useState("");
  const [enrollmentnumber, setEnrollmentnumber] = useState("");
  const [paymentStatus, setpaymentStatus] = useState("");
  const [transport, setTransport] = useState(""); // "true" | "false" | ""
  const [hostel, setHostel] = useState(""); // "true" | "false" | ""
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const makeFullEmail = (local) => `${local}@${FIXED_DOMAIN}`;

  // Lookup (optional)
  const handleLookup = (e) => {
    e?.preventDefault();
    const local = (lookupLocalPart || "").trim();
    const err = validateLocalPart(local);
    if (err) {
      setEmailError(err);
      toast.error(err);
      return;
    }
    setEmailError("");
    setLookupEmail(makeFullEmail(local)); // triggers UserDetailsCard fetch & display
  };

  // called by UserDetailsCard when user clicks "Use these details"
  const handleUseDetails = (data) => {
    if (!data) return;
    setFirstname(data.firstname || "");
    setLastname(data.lastname || "");
    setPhone(data.phone || "");
    setEnrollmentnumber(data.enrollmentnumber || "");
    setTransport(typeof data.campusbus !== "undefined" ? String(data.campusbus) : "");
    setHostel(typeof data.boarding !== "undefined" ? String(data.boarding) : "");
    setpaymentStatus(data.paymentStatus !== undefined ? data.paymentStatus : "");
    if (data.email) setFormLocalPart((data.email || "").split("@")[0] || "");
    toast.success("Form prefilled with saved details.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setEmailError("");

    const local = (formLocalPart || "").trim(); // use formLocalPart here
    const localErr = validateLocalPart(local);
    if (localErr) {
      setEmailError(localErr);
      toast.error(localErr);
      setSubmitting(false);
      return;
    }
    const email = makeFullEmail(local);

    try {
      // check email duplicate
      const checkRes = await fetch(`/api/booking/check-email?email=${encodeURIComponent(email)}`);
      if (!checkRes.ok) {
        const txt = await checkRes.text();
        throw new Error(txt || "Failed to verify email");
      }
      const { exists } = await checkRes.json();
      if (exists) {
        toast.error("You already have a ticket with this email.");
        setSubmitting(false);
        return;
      }

      // submit booking
      const payload = {
        firstname,
        lastname,
        email,
        phone,
        enrollmentnumber,
        paymentStatus,
        campusbus: transport === "true",
        boarding: hostel === "true",
      };

      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Server error");
      }

      const data = await res.json();
      if (typeof data.emailSent !== "undefined" && !data.emailSent) {
        toast.error("Booking saved but confirmation email was NOT sent.");
        setSubmitting(false);
        return;
      }

      toast.success("Booking successful! QR sent to your email.");
      // reset
      setLookupLocalPart("");
      setLookupEmail("");
      setFormLocalPart("");
      setFirstname("");
      setLastname("");
      setPhone("");
      setpaymentStatus("");
      setEnrollmentnumber("");
      setTransport("");
      setHostel("");
      // optionally navigate: router.push('/booking/success')
    } catch (err) {
      console.error(err);
      toast.error("Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-5">
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
        <div className="relative h-40 sm:h-44 md:h-48">
          <Image src="/WhatsApp Image 2025-11-14 at 15.53.51.jpeg" alt="header" fill style={{ objectFit: "cover" }} />
        </div>

        <div className="p-5 space-y-4">
          <h3 className="text-base ">If you have reserved tickets, you can get the tickets from your email</h3>

          {/* Lookup form (optional) */}
          <form onSubmit={handleLookup} className=" items-end">
            <div >
              <label className="text-xs font-semibold text-gray-500 block mb-1">Email (lookup)</label>
              <div className="flex">
                <input
                  value={lookupLocalPart}
                  onChange={(e) => setLookupLocalPart((e.target.value || "").replace(/\s+/g, "").split("@")[0])}
                  name="lookupLocalPart"
                  className=" p-2 border rounded-l-md"
                  placeholder="email"
                />
                <div className="px-3 py-2 bg-gray-100 border rounded-r-md select-none">@{FIXED_DOMAIN}</div>
              </div>
              {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
            </div>

            <div className="mt-2">
              <button type="submit" className="px-4 py-2 rounded-full bg-emerald-600 text-white">Lookup</button>
            </div>
          </form>

          {lookupEmail ? (
            <UserDetailsCard email={lookupEmail} onUse={handleUseDetails} />
          ) : (
            <div className="text-sm text-gray-500">No lookup performed yet.</div>
          )}

          <h3 className="text-base   mt-4">If you have not booked tickets, fill the form first</h3>

          {/* Main booking form — uses formLocalPart */}
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <label className="text-xs font-semibold text-emerald-600 block mb-1">First name</label>
              <input value={firstname} onChange={(e) => setFirstname(e.target.value)} name="firstname" required className="w-full p-2 border rounded-md" />
            </div>

            <div>
              <label className="text-xs font-semibold text-emerald-600 block mb-1">Last name</label>
              <input value={lastname} onChange={(e) => setLastname(e.target.value)} name="lastname" required className="w-full p-2 border rounded-md" />
            </div>

            <div>
              <label className="text-xs font-semibold text-emerald-600 block mb-1">Email</label>
              <div className="flex">
                <input
                  value={formLocalPart}
                  onChange={(e) => setFormLocalPart((e.target.value || "").replace(/\s+/g, "").split("@")[0])}
                  name="formLocalPart"
                  required
                  className="flex-1 p-2 border rounded-l-md"
                  placeholder="email"
                />
                <div className="px-3 py-2 bg-gray-100 border rounded-r-md select-none">@{FIXED_DOMAIN}</div>
              </div>
              {/* show per-field error */}
              {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-emerald-600 block mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} name="phone" required className="w-full p-2 border rounded-md" />
            </div>

            <div>
              <label className="text-xs font-semibold text-emerald-600 block mb-1">Enrollment Number</label>
              <input value={enrollmentnumber} onChange={(e) => setEnrollmentnumber(e.target.value)} name="enrollmentnumber" required className="w-full p-2 border rounded-md" />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-emerald-600 block mb-1">Do you need Transport?</label>
                <select value={transport} onChange={(e) => setTransport(e.target.value)} name="transport" required className="w-full p-2 border rounded-md">
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="text-xs font-semibold text-emerald-600 block mb-1">Are you staying in hostel?</label>
                <select value={hostel} onChange={(e) => setHostel(e.target.value)} name="hostel" required className="w-full p-2 border rounded-md">
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            <div>
              <button disabled={submitting} className="w-full py-2 rounded-full bg-emerald-600 text-white">
                {submitting ? "Sending..." : "Apply for Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
