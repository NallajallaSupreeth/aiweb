import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
      return alert("Please fill all fields");
    }

    // 🔥 For now (MVP): store user_id
    localStorage.setItem("user_id", username);

    // 👉 later you will connect real backend auth
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

        <form className="auth-form" onSubmit={handleLogin}>
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

          <div className="auth-options">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember Me</label>
          </div>

          <button type="submit" className="auth-button">
            Login →
          </button>
        </form>

        <div className="auth-footer">
          <span className="auth-link">Forgot Password?</span>

          {/* 🔥 IMPORTANT: use Link (NOT <a>) */}
          <Link to="/signup" className="auth-link">
            Sign Up
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;