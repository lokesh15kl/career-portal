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
        className="theme-toggle"
        onClick={onToggle}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>

      <button
        type="button"
        className="theme-toggle motion-toggle"
        onClick={onToggleMotion}
        aria-label={motion === "reduced" ? "Enable normal motion" : "Enable reduced motion"}
        title={motion === "reduced" ? "Enable normal motion" : "Enable reduced motion"}
      >
        {motion === "reduced" ? "🟢 Motion Off" : "🟣 Motion On"}
      </button>
    </div>
  );
}
