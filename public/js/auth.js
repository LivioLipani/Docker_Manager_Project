const errorMessage = document.getElementById("error-message");
const errorText = document.getElementById("error-text");
const loginBtn = document.getElementById("login-btn");
const loginText = document.getElementById("login-text");
const loginLoading = document.getElementById("login-loading");

const showRegister = document.getElementById("show-register");
const showLogin = document.getElementById("show-login");

const logoutBtn = document.getElementById("logout-btn");

let socket = null;

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

loginBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    console.log(username, password);
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

            //connect the socket
            socket = socketManager.connect();
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

logoutBtn.addEventListener('click', () => {
  AuthManager.removeToken();
  AuthManager.removeUser();
  socketManager.disconnect;

  changeView("app-container", "home-view");
})

document.addEventListener('DOMContentLoaded', async () => {
    const token = AuthManager.getToken();
    
    if (token) {
        try {
            // Verifica se il token è ancora valido
            const response = await fetch('/api/auth/verify_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`
                }
            });
            console.log(response);
            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    // Token valido, reindirizza alla dashboard
                    changeView("home-view", "app-container");
                }
            } else {
                // Token non valido o scaduto, rimuovilo
                AuthManager.removeToken();
            }
        } catch (error) {
            console.error('Errore nella verifica del token:', error);
            AuthManager.removeToken();
        }
    }
});