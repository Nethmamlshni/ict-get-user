"use client";
import { useEffect, useState } from "react";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch("/api/admin/bookings");
        const data = await res.json();

        if (res.ok) {
          setBookings(data.bookings);
          setFilteredBookings(data.bookings);
        } else {
          setError(data.message || "Failed to fetch bookings");
        }
      } catch (err) {
        setError("Error fetching bookings");
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  // 🔍 Search filter
  useEffect(() => {
    if (!search) {
      setFilteredBookings(bookings);
    } else {
      const lower = search.toLowerCase();
      setFilteredBookings(
        bookings.filter(
          (b) =>
            b.firstname.toLowerCase().includes(lower) ||
            b.lastname.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, bookings]);

  // 💳 Payment status update
  async function handleMarkPaid(bookingId) {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });

      const data = await res.json();
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId ? { ...b, paymentStatus: "paid" } : b
          )
        );
      } else {
        alert(data.message || "Failed to update payment status");
      }
    } catch (err) {
      alert("Error updating payment status");
      console.error(err);
    }
  }

  if (loading) return <p>Loading bookings...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // only relevant part shown - ensure no stray spaces between tags
return (
  <div className="p-4 max-w-5xl mx-auto mt-10">
    <h1 className="text-2xl font-bold mb-4">All Bookings</h1>

    <div className="mb-4">
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded w-full"
      />
    </div>

    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 w-16">No</th>
          <th className="border p-2">Firstname</th>
          <th className="border p-2">Lastname</th>
          <th className="border p-2">Email</th>
          <th className="border p-2">Phone</th>
          <th className="border p-2">Payment Status</th>
        </tr>
      </thead>

      <tbody>
        {filteredBookings.map((b, index) => (
          <tr key={b._id} className="text-center">
            <td className="border p-2">{index + 1}</td>
            <td className="border p-2">{b.firstname}</td>
            <td className="border p-2">{b.lastname}</td>
            <td className="border p-2">{b.email}</td>
            <td className="border p-2">{b.phone}</td>
            <td className="border p-2">
              {b.paymentStatus}
              {b.paymentStatus === "pending" && (
                <button
                  onClick={() => handleMarkPaid(b._id)}
                  className="ml-2 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                >
                  Mark Paid
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

}
