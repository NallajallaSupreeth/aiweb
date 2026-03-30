import Navbar from "../components/Navbar";

export default function Dashboard() {
  const userId = localStorage.getItem("user_id");

  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
        <p className="text-lg">Welcome, {userId}</p>
      </div>
    </div>
  );
}