import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();

    if (!email || !username || !password || !confirmPassword) {
      return alert("Fill all fields");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match");
    }

    // 🔥 Store user
    localStorage.setItem("user_id", username);

    // 👉 later connect backend API
    navigate("/dashboard");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        <div className="auth-logo">
          <h1>FASHION</h1>
          <h1>HUB</h1>
          <div className="auth-logo-divider"></div>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email Address"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Username"
            className="auth-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="auth-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-button">
            Sign Up →
          </button>
        </form>

        <div className="auth-footer" style={{ justifyContent: "center" }}>
          <span style={{ fontSize: "12px", color: "#555" }}>
            Already have an account?{" "}
            <Link to="/" className="auth-link" style={{ fontWeight: "bold" }}>
              Login
            </Link>
          </span>
        </div>

      </div>
    </div>
  );
};

export default Signup;