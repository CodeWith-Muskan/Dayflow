import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { loginUser, loading } = useAuth();

  const [formData, setFormData] = useState({
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

    try {
      await loginUser(formData);
      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="auth-page">
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
              ORGANIZE • FOCUS • ACHIEVE
            </span>

            <h1>
              Make every day
              <br />
              count.
            </h1>

            <p>
              Plan your tasks, organize your priorities,
              and track your productivity in one beautiful
              workspace.
            </p>
          </div>

          <div className="showcase-stats">
            <div>
              <strong>100%</strong>
              <span>Your control</span>
            </div>

            <div>
              <strong>Daily</strong>
              <span>Focused planning</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-form-wrapper">
          <div className="mobile-auth-brand">
            <div className="auth-brand-icon">
              <CheckSquare size={22} />
            </div>
            <span>DayFlow</span>
          </div>

          <div className="auth-heading">
            <h2>Welcome back</h2>
            <p>Enter your details to access your workspace.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>

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

            <div className="form-group">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
              </div>

              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?
            <Link to="/register"> Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;