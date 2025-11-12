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

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600 font-medium">{error}</div>;
  if (!details) return <div className="p-6 text-center">No booking details available.</div>;

  const formattedCreated = details.createdAt ? new Date(details.createdAt).toLocaleString() : "—";
  const formattedCheckedInAt = details.checkedInAt ? new Date(details.checkedInAt).toLocaleString() : null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      {/* Ticket Card */}
      <div className="relative bg-white rounded-2xl shadow-lg max-w-lg w-full border border-gray-200 overflow-hidden">

        {/* Header Section */}
        <div className="flex justify-between items-center px-6 pt-6">
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-800">🎉 Annual Get-Together</h2>
            <p className="text-sm text-gray-500">Badull Sri Lanka</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Ticket No.</p>
            <p className="text-lg font-semibold text-gray-800">{details.ticketNumber }</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-300 my-4 mx-6"></div>

        {/* Event Info Section */}
        <div className="px-6 pb-6 space-y-2 text-sm text-gray-700">
          <p><strong>Attendee:</strong> {details.firstname} {details.lastname}</p>
          <p><strong>Email:</strong> {details.email}</p>
          <p><strong>Phone:</strong> {details.phone || "—"}</p>
          <p><strong>Payment Status:</strong> {details.paymentStatus || "—" }</p>
          <p><strong>Registered On:</strong> {formattedCreated}</p>

          {/* Check-in Status */}
          <div
            className={`mt-3 p-3 rounded-lg text-sm font-semibold ${
              details.checkedIn ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {details.checkedIn
              ? `Checked-in ${formattedCheckedInAt ? `at ${formattedCheckedInAt}` : ""}`
              : "⏳ Verified — Not yet checked-in"}
          </div>
        </div>

        {/* Footer note */}
        <div className="px-6 pb-4 border-t border-gray-200 text-xs text-gray-500">
          Please present this digital ticket at the entrance.  
          If there is an issue, contact the event staff.
        </div>
      </div>
    </div>
  );
}
