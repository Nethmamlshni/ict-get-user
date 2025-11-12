"use client";

import { useEffect, useState } from "react";

export default function CheckInPage() {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setError("No token provided in URL.");
      setLoading(false);
      return;
    }

    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/checkin?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) {
          // API returned error
          setError(data.error || "Invalid QR code or server error.");
          setLoading(false);
          return;
        }

        if (data && data.success) {
          setDetails(data.data);
        } else {
          setError(data.error || "Unexpected response from server.");
        }
      } catch (err) {
        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600 font-medium">{error}</div>;
  if (!details) return <div className="p-6">No booking details available.</div>;

  const formattedCreated = details.createdAt ? new Date(details.createdAt).toLocaleString() : "—";
  const formattedCheckedInAt = details.checkedInAt ? new Date(details.checkedInAt).toLocaleString() : null;

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">🎟️ Booking Details</h2>

      <div className="space-y-2">
        <p><strong>Name:</strong> {details.firstname} {details.lastname}</p>
        <p><strong>Email:</strong> {details.email}</p>
        <p><strong>Phone:</strong> {details.phone || "—"}</p>
        <p><strong>Payment Status:</strong> {details.paymentStatus || "—"}</p>
        <p><strong>Registered On:</strong> {formattedCreated}</p>
      </div>

      <div className={`mt-3 p-3 rounded ${details.checkedIn ? "bg-green-50" : "bg-yellow-50"}`}>
        {details.checkedIn ? (
          <div className="text-green-700 font-semibold">
            ✅ QR Verified — Checked in{formattedCheckedInAt ? ` at ${formattedCheckedInAt}` : ""}
          </div>
        ) : (
          <div className="text-orange-700 font-semibold">
            ⏳ QR Verified — Not yet checked-in
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        If this is incorrect, please contact the event staff.
      </div>
    </div>
  );
}
