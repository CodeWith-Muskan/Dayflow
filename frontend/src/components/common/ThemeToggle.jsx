import { Moon, Sun, ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ThemeToggle = ({ compact = false, className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isNight = theme === "night";

  return (
    <button
      type="button"
      className={`theme-toggle ${isNight ? "is-night" : "is-day"} ${compact ? "theme-toggle-compact" : ""} ${className}`}
      onClick={toggleTheme}
      title={isNight ? "Switch to day theme" : "Switch to night theme"}
    >
      <span className="theme-toggle-icon">{isNight ? <Moon size={16} /> : <Sun size={16} />}</span>

      <span className="theme-toggle-label">Theme</span>

      <ChevronDown size={13} className="theme-toggle-chevron" />
    </button>
  );
};

export default ThemeToggle;