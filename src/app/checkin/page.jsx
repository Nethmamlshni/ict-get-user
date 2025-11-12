
import CheckInPage from "../../../components/checkin/checkin";

export default function Page({ searchParams }) {
  const { token } = searchParams; // ?token=... capture කරයි

  return <CheckInPage token={token} />;
}
