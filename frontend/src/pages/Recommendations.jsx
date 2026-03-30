import { useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";

export default function Recommendations() {
  const [city, setCity] = useState("");
  const [data, setData] = useState(null);
  const userId = localStorage.getItem("user_id");

  const fetchRecommendations = async () => {
    try {
      const res = await API.post("/recommendations/recommend", {
        user_id: userId,
        city,
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch recommendations");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6">Recommendations</h2>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Enter city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border p-3 rounded w-80"
          />
          <button
            onClick={fetchRecommendations}
            className="bg-green-600 text-white px-5 py-3 rounded"
          >
            Get Recommendations
          </button>
        </div>

        {data && (
          <div className="bg-white shadow rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">Weather</h3>
            <p>{JSON.stringify(data.weather)}</p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Reasoning</h3>
            <p>{data.reasoning}</p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Recommendations</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(data.recommendations, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}