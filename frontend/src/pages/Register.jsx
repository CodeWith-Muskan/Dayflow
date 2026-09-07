import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckSquare,
  User,
  Mail,
  Lock,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { registerUser, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");

      return;
    }

    try {
      await registerUser(formData);

      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT SIDE */}
      <div className="auth-showcase">
        <div className="showcase-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <CheckSquare size={24} />
            </div>

            <span>DayFlow</span>
          </div>

          <div className="showcase-text">
            <span className="showcase-badge">
              PLAN • TRACK • GROW
            </span>

            <h1>
              Start building
              <br />
              better days.
            </h1>

            <p>
              Create your personal productivity workspace.
              Organize tasks, plan your schedule, and track
              your progress every day.
            </p>
          </div>

          <div className="showcase-stats">
            <div>
              <strong>Tasks</strong>
              <span>Stay organized</span>
            </div>

            <div>
              <strong>Progress</strong>
              <span>Track your growth</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-form-section">
        <div className="auth-form-wrapper">
          {/* Mobile Logo */}
          <div className="mobile-auth-brand">
            <div className="auth-brand-icon">
              <CheckSquare size={22} />
            </div>

            <span>DayFlow</span>
          </div>

          <div className="auth-heading">
            <h2>Create your account</h2>

            <p>
              Start organizing your days and achieving more.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            {/* NAME */}
            <div className="form-group">
              <label htmlFor="name">
                Full name
              </label>

              <div className="input-with-icon">
                <User size={19} />

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="form-group">
              <label htmlFor="email">
                Email address
              </label>

              <div className="input-with-icon">
                <Mail size={19} />

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <div className="password-input input-with-icon">
                <Lock size={19} />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  minLength="6"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?
            <Link to="/login"> Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;