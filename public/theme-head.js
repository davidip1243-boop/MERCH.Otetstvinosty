(() => {
  const root = document.documentElement;
  let theme = "auto";
  try {
    theme = localStorage.getItem("merch-theme") || "auto";
  } catch {}
  const isDark =
    theme === "dark" ||
    (theme !== "light" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  if (theme === "light" || theme === "dark") {
    root.dataset.theme = theme;
  }
  root.style.backgroundColor = isDark ? "#050607" : "#f5f5f2";
})();
