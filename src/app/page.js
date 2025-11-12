import Image from "next/image";
import BookForm from "../../components/booking/book";
import AdminBookings from "../../components/admin/AdminBookings";
export default function Home() {
  return (
    <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <BookForm />
    </div>
  );
}
