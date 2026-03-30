import { useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("");
  const userId = localStorage.getItem("user_id");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Choose image");

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("category", category);
    formData.append("file", file);

    try {
      const res = await API.post("/wardrobe/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-8 max-w-xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Upload Clothing</h2>

        <form onSubmit={handleUpload} className="bg-white shadow p-6 rounded-xl">
          <input
            type="text"
            placeholder="Category (optional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border p-3 rounded mb-4"
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border p-3 rounded mb-4"
          />

          <button className="w-full bg-blue-600 text-white p-3 rounded">
            Upload
          </button>
        </form>
      </div>
    </div>
  );
}