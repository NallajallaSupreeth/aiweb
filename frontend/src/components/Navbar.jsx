import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const logout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
  };

  return (
    <div className="bg-black text-white px-6 py-4 flex justify-between items-center">
      <h1 className="font-bold text-xl">AI Stylist</h1>

      <div className="flex gap-4 items-center">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/recommendations">Recommendations</Link>
        <span className="text-sm text-gray-300">{userId}</span>
        <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">
          Logout
        </button>
      </div>
    </div>
  );
}