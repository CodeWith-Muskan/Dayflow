import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

import ThemeToggle from "../common/ThemeToggle";

const pageTitles = {
  "/": { title: "Dashboard", subtitle: "Here's what's happening today." },
  "/tasks": { title: "My Tasks", subtitle: "Plan and manage your daily tasks." },
  "/categories": { title: "Categories", subtitle: "Organize your work your way." },
  "/schedule": { title: "Schedule", subtitle: "Plan your day with clarity." },
  "/analytics": { title: "Analytics", subtitle: "Understand your productivity." },
  "/history": { title: "History", subtitle: "Review your past days." },
  "/settings": { title: "Settings", subtitle: "Manage your preferences." },
};

const Header = ({ toggleSidebar }) => {
  const location = useLocation();
  const currentPage = pageTitles[location.pathname] || pageTitles["/"];

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-button" onClick={toggleSidebar} aria-label="Open menu">
          <Menu size={22} />
        </button>

        <div className="header-text">
          <h1>{currentPage.title}</h1>
          <p>{currentPage.subtitle}</p>
        </div>
      </div>

      <div className="header-actions">
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;