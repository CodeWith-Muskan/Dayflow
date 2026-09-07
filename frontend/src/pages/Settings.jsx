import { Moon, Sun, User } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isNight = theme === "night";

  const initials = (user?.name || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="df-page settings-page">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <div className="page-head">
        <div>
          <span className="page-eyebrow">
            <User size={13} />
            SETTINGS
          </span>
          <h1>Settings</h1>
          <p>Make DayFlow feel like yours.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-card theme-card">
          <div className="settings-card-head">
            <span className="settings-icon">
              {isNight ? <Moon size={18} /> : <Sun size={18} />}
            </span>
            <div>
              <h2>Theme</h2>
              <p>Choose an atmosphere for DayFlow.</p>
            </div>
          </div>

          <div className="theme-options">
            <button
              type="button"
              className={`theme-option ${!isNight ? "selected" : ""}`}
              onClick={() => {
                if (isNight) toggleTheme();
              }}
            >
              <span className="theme-preview day-preview">
                <span className="preview-sun" />
                <span className="preview-sky" />
              </span>
              <span className="theme-option-label">
                <strong>Day</strong>
                <small>Soft morning light</small>
              </span>
              <span className="theme-option-check">{!isNight && <span />}</span>
            </button>

            <button
              type="button"
              className={`theme-option ${isNight ? "selected" : ""}`}
              onClick={() => {
                if (!isNight) toggleTheme();
              }}
            >
              <span className="theme-preview night-preview">
                <span className="preview-moon" />
                <span className="preview-stars" />
              </span>
              <span className="theme-option-label">
                <strong>Night</strong>
                <small>Calm late-night workspace</small>
              </span>
              <span className="theme-option-check">{isNight && <span />}</span>
            </button>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-head">
            <span className="settings-icon">
              <User size={18} />
            </span>
            <div>
              <h2>Profile</h2>
              <p>Your personal details.</p>
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-avatar">{initials}</div>

            <div className="profile-details">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;