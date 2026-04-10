const state = {
    token: localStorage.getItem("token") || "",
    session: null,
    currentUser: null,
    users: [],
    editingUserId: null
};

const API_BASE = (() => {
    const host = window.location.hostname || "127.0.0.1";
    const protocol = window.location.protocol === "file:" ? "http:" : window.location.protocol;

    if (window.location.port === "3000") {
        return `${window.location.origin}/api`;
    }

    return `${protocol}//${host}:3000/api`;
})();

const elements = {
    apiStatus: document.getElementById("api-status"),
    baseUrl: document.getElementById("base-url"),
    tokenStatus: document.getElementById("token-status"),
    notification: document.getElementById("notification"),
    authView: document.getElementById("auth-view"),
    appView: document.getElementById("app-view"),
    adminPanel: document.getElementById("admin-panel"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    updateForm: document.getElementById("update-form"),
    usersTableBody: document.getElementById("users-table-body"),
    sessionEmail: document.getElementById("session-email"),
    metricId: document.getElementById("metric-id"),
    metricRole: document.getElementById("metric-role"),
    profileId: document.getElementById("profile-id"),
    profileEmail: document.getElementById("profile-email"),
    profileRole: document.getElementById("profile-role"),
    editTitle: document.getElementById("edit-title"),
    updateEmail: document.getElementById("update-email"),
    updatePassword: document.getElementById("update-password"),
    resetEditButton: document.getElementById("reset-edit-button")
};

const getErrorMessage = (error) => {
    if (error?.payload?.message) return error.payload.message;
    if (error?.payload?.error) return error.payload.error;
    if (error?.message) return error.message;
    return "Ocurrio un error inesperado";
};

const showNotification = (message, type = "success") => {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type}`;
};

const clearNotification = () => {
    elements.notification.textContent = "";
    elements.notification.className = "notification";
};

const setToken = (token) => {
    state.token = token || "";
    if (state.token) {
        localStorage.setItem("token", state.token);
        elements.tokenStatus.textContent = "Guardado";
    } else {
        localStorage.removeItem("token");
        elements.tokenStatus.textContent = "No cargado";
    }
};

const apiFetch = async (url, options = {}) => {
    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(state.token ? { Authorization: state.token } : {}),
        ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw { status: response.status, payload };
    }

    return payload;
};

const updateAuthView = (loggedIn) => {
    elements.authView.classList.toggle("hidden", loggedIn);
    elements.appView.classList.toggle("hidden", !loggedIn);
};

const applyEditingContext = (user) => {
    state.editingUserId = user.id;
    elements.editTitle.textContent =
        state.session?.role === "admin" && user.id !== state.session.id
            ? `Editar usuario #${user.id}`
            : "Actualizar mi usuario";
    elements.updateEmail.value = user.email || "";
    elements.updatePassword.value = "";
    elements.resetEditButton.classList.toggle(
        "hidden",
        !state.session || state.session.id === user.id
    );
};

const renderSession = (profile) => {
    elements.sessionEmail.textContent = profile.email;
    elements.metricId.textContent = profile.id;
    elements.metricRole.textContent = profile.role || "user";
    elements.profileRole.textContent = profile.role || "user";
    elements.adminPanel.classList.toggle("hidden", profile.role !== "admin");
};

const renderCurrentUser = (user) => {
    state.currentUser = user;
    elements.profileId.textContent = user.id;
    elements.profileEmail.textContent = user.email;
    elements.profileRole.textContent = state.session?.role || "user";

    if (!state.editingUserId || state.editingUserId === user.id) {
        applyEditingContext(user);
    }
};

const renderUsersTable = () => {
    if (!state.users.length) {
        elements.usersTableBody.innerHTML = `
            <tr>
                <td colspan="4">No hay usuarios para mostrar.</td>
            </tr>
        `;
        return;
    }

    elements.usersTableBody.innerHTML = state.users
        .map(
            (user) => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.email}</td>
                    <td>${user.role || "user"}</td>
                    <td>
                        <button type="button" data-action="edit" data-id="${user.id}">Editar</button>
                        <button type="button" data-action="delete" data-id="${user.id}">Eliminar</button>
                    </td>
                </tr>
            `
        )
        .join("");
};

const fetchApiStatus = async () => {
    try {
        const data = await apiFetch("");
        elements.apiStatus.textContent = data.message;
    } catch (error) {
        elements.apiStatus.textContent = "Sin conexion";
        showNotification("No se pudo conectar con la API.", "error");
    }
};

const loadOwnUser = async () => {
    const user = await apiFetch(`/users/${state.session.id}`);
    renderCurrentUser(user);
};

const loadUsers = async () => {
    if (state.session?.role !== "admin") return;
    state.users = await apiFetch("/users");
    renderUsersTable();
};

const refreshSession = async () => {
    const profileData = await apiFetch("/auth/profile");
    state.session = profileData.user;
    renderSession(profileData.user);
    await loadOwnUser();
    if (state.session.role === "admin") {
        await loadUsers();
    }
    updateAuthView(true);
};

const resetSession = () => {
    state.session = null;
    state.currentUser = null;
    state.users = [];
    state.editingUserId = null;
    setToken("");
    elements.usersTableBody.innerHTML = `
        <tr>
            <td colspan="4">No hay datos cargados.</td>
        </tr>
    `;
    updateAuthView(false);
};

const login = async (credentials) => {
    const data = await apiFetch("/auth/login", {
        method: "POST",
        body: credentials
    });
    setToken(data.token);
    await refreshSession();
};

const register = async (payload) => {
    await apiFetch("/auth/register", {
        method: "POST",
        body: payload
    });
};

document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
        const tab = button.dataset.tab;
        document.querySelectorAll(".tab-button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        elements.loginForm.classList.toggle("hidden", tab !== "login");
        elements.registerForm.classList.toggle("hidden", tab !== "register");
        clearNotification();
    });
});

elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotification();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
        await login(payload);
        showNotification("Sesion iniciada correctamente.");
        event.currentTarget.reset();
    } catch (error) {
        showNotification(getErrorMessage(error), "error");
    }
});

elements.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotification();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
        await register(payload);
        await login(payload);
        showNotification("Usuario registrado y autenticado.");
        event.currentTarget.reset();
    } catch (error) {
        showNotification(getErrorMessage(error), "error");
    }
});

elements.updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotification();

    if (!state.editingUserId) return;

    const email = elements.updateEmail.value.trim();
    const password = elements.updatePassword.value.trim();
    const payload = password ? { email, password } : { email };

    try {
        await apiFetch(`/users/${state.editingUserId}`, {
            method: "PUT",
            body: payload
        });

        if (state.editingUserId === state.session.id) {
            await loadOwnUser();
        }

        if (state.session.role === "admin") {
            await loadUsers();
        }

        showNotification("Usuario actualizado correctamente.");
    } catch (error) {
        showNotification(getErrorMessage(error), "error");
    }
});

document.getElementById("logout-button").addEventListener("click", () => {
    resetSession();
    showNotification("Sesion cerrada.");
});

document.getElementById("refresh-profile-button").addEventListener("click", async () => {
    try {
        await refreshSession();
        showNotification("Datos sincronizados con la API.");
    } catch (error) {
        showNotification(getErrorMessage(error), "error");
    }
});

document.getElementById("load-users-button").addEventListener("click", async () => {
    try {
        await loadUsers();
        showNotification("Lista de usuarios actualizada.");
    } catch (error) {
        showNotification(getErrorMessage(error), "error");
    }
});

elements.resetEditButton.addEventListener("click", () => {
    if (state.currentUser) {
        applyEditingContext(state.currentUser);
        showNotification("Formulario restaurado a tu propio perfil.");
    }
});

elements.usersTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const userId = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit") {
        try {
            const user = await apiFetch(`/users/${userId}`);
            applyEditingContext(user);
            showNotification(`Editando el usuario #${userId}.`);
        } catch (error) {
            showNotification(getErrorMessage(error), "error");
        }
    }

    if (action === "delete") {
        const confirmed = window.confirm(`Vas a eliminar el usuario #${userId}. Deseas continuar?`);
        if (!confirmed) return;

        try {
            await apiFetch(`/users/${userId}`, { method: "DELETE" });
            if (state.editingUserId === userId && state.currentUser) {
                applyEditingContext(state.currentUser);
            }
            await loadUsers();
            showNotification(`Usuario #${userId} eliminado.`);
        } catch (error) {
            showNotification(getErrorMessage(error), "error");
        }
    }
});

const bootstrap = async () => {
    setToken(state.token);
    elements.baseUrl.textContent = API_BASE;
    await fetchApiStatus();

    if (!state.token) {
        updateAuthView(false);
        return;
    }

    try {
        await refreshSession();
        showNotification("Sesion recuperada desde el navegador.");
    } catch (error) {
        resetSession();
        showNotification("Tu token ya no es valido. Inicia sesion de nuevo.", "error");
    }
};

bootstrap();
