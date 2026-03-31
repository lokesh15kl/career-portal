import { useState } from "react";
import { getCurrentTheme, toggleTheme } from "../services/theme";
import { getCurrentMotion, toggleMotion } from "../services/motion";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() => getCurrentTheme());
  const [motion, setMotion] = useState(() => getCurrentMotion());

  const onToggle = () => {
    const nextTheme = toggleTheme();
    setTheme(nextTheme);
  };

  const onToggleMotion = () => {
    const nextMotion = toggleMotion();
    setMotion(nextMotion);
  };

  return (
    <div className={`theme-toggle-group ${className}`.trim()}>
      <button
        type="button"
        className="theme-toggle theme-toggle-theme"
        onClick={onToggle}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
        <span className="theme-toggle-label">{theme === "dark" ? "Light" : "Dark"}</span>
      </button>

      <button
        type="button"
        className="theme-toggle motion-toggle"
        onClick={onToggleMotion}
        aria-label={motion === "reduced" ? "Enable normal motion" : "Enable reduced motion"}
        title={motion === "reduced" ? "Enable normal motion" : "Enable reduced motion"}
      >
        <span className="theme-toggle-icon" aria-hidden="true">{motion === "reduced" ? "🟢" : "🟣"}</span>
        <span className="theme-toggle-label">{motion === "reduced" ? "Motion Off" : "Motion On"}</span>
      </button>
    </div>
  );
}
