// components/UserDetailsCard.jsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react"; 

export default function UserDetailsCard({ email, showIfEmpty = true }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) {
      setError("");
      setData(null);
      return;
    }

    let mounted = true;
    async function fetchData() {
      setLoading(true);
      setError("");
      setData(null);
      try {
        const res = await fetch(`/api/booking/get-user?email=${encodeURIComponent(email)}`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!mounted) return;
        if (json.found && json.data) {
          setData(json.data);
        } else {
          setData(null);
          setError(json.message || "No saved details found for this email.");
        }
      } catch (err) {
        console.error("UserDetailsCard fetch error:", err);
        if (!mounted) return;
        setError("Failed to load details.");
        toast.error("Failed to fetch details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, [email]);

  if (!email) {
    if (!showIfEmpty) return null;
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
        Enter an email to see your booking details.
      </div>
    );
  }

  if (loading) return <div className="p-3 text-sm text-gray-600">Loading details for <strong>{email}</strong> …</div>;
  if (error) return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
      <div className="text-sm text-gray-700 mb-1"><strong>{email}</strong></div>
      <div className="text-sm text-red-600">{error}</div>
    </div>
  );
  if (!data) return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
      No saved details found for <strong>{email}</strong>.
    </div>
  );

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-gray-500">Record</div>
          <div className="text-lg font-semibold">{`${data.firstname || ""} ${data.lastname || ""}`.trim() || "-"}</div>
          <div className="text-sm text-gray-600">{data.email}</div>
        </div>
        <div className="text-sm text-right">
          <div className="text-gray-500">Enrollment</div>
          <div className="font-medium">{data.enrollmentnumber || "-"}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
        <div>
          <div className="text-xs text-gray-400">Phone</div>
          <div>{data.phone || "-"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-400">Transport</div>
          <div>{typeof data.campusbus !== "undefined" ? (data.campusbus ? "Yes" : "No") : "-"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-400">Boarding</div>
          <div>{typeof data.boarding !== "undefined" ? (data.boarding ? "Yes" : "No") : "-"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-400">Created</div>
          <div>{data.createdAt ? new Date(data.createdAt).toLocaleString() : "-"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-400">Payment Status</div>
          <div className={`font-medium ${data.paymentStatus === "paid" ? "text-green-600" : "text-red-600"}`}>
            {data.paymentStatus || "pending"}
          </div>
        </div>

        {data.qrToken && (
          <div className="col-span-2 mt-3 text-center">
            <div className="text-xs text-gray-400 mb-1">QR Code</div>
            <QRCodeCanvas value={`${process.env.NEXT_PUBLIC_BASE_URL}/checkin?token=${data.qrToken}`} size={150} />
          </div>
        )}
      </div>
    </div>
  );
}
