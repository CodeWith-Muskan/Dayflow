/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "dayflow-theme";

const readInitialTheme = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "night" ? "night" : "day";
  } catch {
    return "day";
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage unavailable — theme still applies for this session.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((previous) => (previous === "day" ? "night" : "day"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isNight: theme === "night",
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }

  return context;
};