const loginForm = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");
const errorText = document.getElementById("error-text");
const loginBtn = document.getElementById("login-btn");
const loginText = document.getElementById("login-text");
const loginLoading = document.getElementById("login-loading");

const showRegister = document.getElementById("show-register");
const showLogin = document.getElementById("show-login");

function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.remove("hidden");
}

function changeView(active, target) {
  const actualView = document.getElementById(active);
  actualView.classList.add("hidden");
  const newView = document.getElementById(target);
  newView.classList.remove("hidden");
}

function hideError() {
  errorMessage.classList.add("hidden");
}

function setLoading(loading) {
  if (loading) {
    loginBtn.disabled = true;
    loginText.classList.add("hidden");
    loginLoading.classList.remove("hidden");
  } else {
    loginBtn.disabled = false;
    loginText.classList.remove("hidden");
    loginLoading.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const username = formData.get("username");
    const password = formData.get("password");

    hideError();
    setLoading(true);

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            AuthManager.setToken(data.token);
            AuthManager.setUser(data.user);
            
            changeView("home-view", "app-container");
        } else {
            showError(data.error || "Login failed");
        }
    }catch (error) {
        showError("Errore di connessione al server");
        console.error(error);
    }finally {
        setLoading(false);
    }
});

showRegister.addEventListener("click", () => {
    changeView("login-form", "register-form");
})

showLogin.addEventListener("click", () => {
    changeView("register-form", "login-form");
})
