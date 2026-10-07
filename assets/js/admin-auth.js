const ADMIN_PASSWORD = "esma-2026";
const AUTH_KEY = "esma-admin-auth";

const isAuthenticated = () => localStorage.getItem(AUTH_KEY) === "true";
const setAuthenticated = (value) => localStorage.setItem(AUTH_KEY, String(value));

const showLogin = () => {
  const loginShell = document.querySelector("[data-login-shell]");
  const dashboardShell = document.querySelector("[data-admin-shell]");

  if (loginShell) loginShell.hidden = false;
  if (dashboardShell) dashboardShell.hidden = true;
};

const showDashboard = () => {
  const loginShell = document.querySelector("[data-login-shell]");
  const dashboardShell = document.querySelector("[data-admin-shell]");

  if (loginShell) loginShell.hidden = true;
  if (dashboardShell) dashboardShell.hidden = false;
};

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#admin-login-form");
  const loginStatus = document.querySelector("#admin-login-status");
  const logoutButton = document.querySelector("#admin-logout");

  if (!loginForm && !logoutButton) return;

  if (isAuthenticated()) {
    showDashboard();
  } else {
    showLogin();
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const passwordValue = document.querySelector("#admin-password")?.value || "";

      if (passwordValue === ADMIN_PASSWORD) {
        setAuthenticated(true);
        showDashboard();
        if (loginStatus) {
          loginStatus.textContent = "Akses diberikan.";
          loginStatus.dataset.state = "success";
        }
        return;
      }

      if (loginStatus) {
        loginStatus.textContent = "Password salah. Coba lagi.";
        loginStatus.dataset.state = "error";
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      setAuthenticated(false);
      showLogin();
      if (loginStatus) {
        loginStatus.textContent = "Anda telah logout.";
        loginStatus.dataset.state = "neutral";
      }
    });
  }
});
