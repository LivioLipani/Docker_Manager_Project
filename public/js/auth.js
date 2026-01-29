const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById('login-btn');
const loginText = document.getElementById("login-text");
const loginLoading = document.getElementById("login-loading");

const registerForm = document.getElementById("register-form");
const registerBtn = document.getElementById("register-btn");
const registerText = document.getElementById("register-text");
const registerLoading = document.getElementById("register-loading");

const errorMessage = document.getElementById("error-message")
const errorText = document.getElementById("error-text");

const showRegister = document.getElementById("show-register");
const showLogin = document.getElementById("show-login");

const logoutBtn = document.getElementById("logout-btn");

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

function setLoadingLogin(loading) {
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

function setLoadingRegister(loading) {
  if (loading) {
    registerBtn.disabled = true;
    registerText.classList.add("hidden");
    registerLoading.classList.remove("hidden");
  } else {
    registerBtn.disabled = false;
    registerText.classList.remove("hidden");
    registerLoading.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const credentials = {
      username: formData.get('username'),
      password: formData.get('password')
    };
    hideError();
    setLoadingLogin(true);

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.ok) {
            AuthManager.setToken(data.token);
            AuthManager.setUser(data.user);
            
            changeView("home-view", "app-container");

            socketManager.connect();
            chartManager.init(); 
        }else{
          showError(data.error || "Login failed");
        }
    }catch (error) {
        showError("Errore di connessione al server");
        console.error(error);
    }finally {
        setLoadingLogin(false);
    }
});

registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const registrationData = {
      username: formData.get('username'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    };
    hideError();
    setLoadingRegister(true);

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registrationData),
        });

        const data = await response.json();

        if (response.ok) {
            AuthManager.setToken(data.token);
            AuthManager.setUser(data.user);
            
            changeView("home-view", "app-container");

            socketManager.connect();
            chartManager.init();
        } else {
            showError(data.error || "Register failed");
        }
    }catch (error) {
        showError("Errore di connessione al server");
        console.error(error);
    }finally {
        setLoadingRegister(false);
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
  socketManager.disconnect();

  changeView("app-container", "home-view");
})

document.addEventListener('DOMContentLoaded', async () => {
    const token = AuthManager.getToken();
    if (token) {
        try {
            const response = await fetch('/api/auth/verify_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    socketManager.connect();
                    changeView("home-view", "app-container");
                    chartManager.init(); 
                }
            } else {
                AuthManager.removeToken();
            }
        } catch (error) {
            console.error('Error token verify:', error);
            AuthManager.removeToken();
        }
    }
});
