// ─────────────────────────────────────────────
// ESTADO GLOBAL
// Objeto centralizado que guarda toda la información
// de la sesión activa durante el ciclo de vida de la página.
// ─────────────────────────────────────────────
const state = {
    token: localStorage.getItem("token") || "", // Token JWT recuperado del almacenamiento local al cargar la página
    session: null,       // Datos del perfil autenticado (id, email, role)
    currentUser: null,   // Usuario que se está visualizando/editando actualmente
    users: [],           // Lista de todos los usuarios (solo visible para admins)
    editingUserId: null  // ID del usuario que está siendo editado en el formulario
};

// ─────────────────────────────────────────────
// URL BASE DE LA API
// Se construye dinámicamente según el entorno:
// - Si el frontend corre en el puerto 3000, usa /api relativo (mismo servidor)
// - Si no, apunta a http://<host>:3000/api (dev con servidores separados)
// ─────────────────────────────────────────────
const API_BASE = (() => {
    const host = window.location.hostname || "127.0.0.1";
    const protocol = window.location.protocol === "file:" ? "http:" : window.location.protocol;

    if (window.location.port === "3000") {
        return `${window.location.origin}/api`;
    }

    return `${protocol}//${host}:3000/api`;
})();

// ─────────────────────────────────────────────
// REFERENCIAS AL DOM
// Se guardan en un objeto para evitar querySelector repetitivos
// y centralizar el acceso a los elementos de la interfaz.
// ─────────────────────────────────────────────
const elements = {
    apiStatus: document.getElementById("api-status"),           // Indicador de conexión con la API
    baseUrl: document.getElementById("base-url"),               // Muestra la URL base detectada
    tokenStatus: document.getElementById("token-status"),       // Muestra si el token está cargado
    notification: document.getElementById("notification"),      // Área de mensajes al usuario
    authView: document.getElementById("auth-view"),             // Vista de login/registro
    appView: document.getElementById("app-view"),               // Vista principal tras autenticarse
    adminPanel: document.getElementById("admin-panel"),         // Panel exclusivo para admins
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    updateForm: document.getElementById("update-form"),         // Formulario de edición de usuario
    usersTableBody: document.getElementById("users-table-body"),
    sessionEmail: document.getElementById("session-email"),
    metricId: document.getElementById("metric-id"),
    metricRole: document.getElementById("metric-role"),
    profileId: document.getElementById("profile-id"),
    profileEmail: document.getElementById("profile-email"),
    profileRole: document.getElementById("profile-role"),
    editTitle: document.getElementById("edit-title"),           // Título dinámico del formulario de edición
    updateEmail: document.getElementById("update-email"),
    updatePassword: document.getElementById("update-password"),
    resetEditButton: document.getElementById("reset-edit-button") // Botón para restaurar edición al propio perfil
};

// ─────────────────────────────────────────────
// UTILIDADES DE ERRORES Y NOTIFICACIONES
// ─────────────────────────────────────────────

// Extrae el mensaje de error más útil desde distintas estructuras de respuesta
const getErrorMessage = (error) => {
    if (error?.payload?.message) return error.payload.message;
    if (error?.payload?.error) return error.payload.error;
    if (error?.message) return error.message;
    return "Ocurrio un error inesperado";
};

// Muestra una notificación coloreada según el tipo ("success" o "error")
const showNotification = (message, type = "success") => {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type}`;
};

// Borra la notificación visible
const clearNotification = () => {
    elements.notification.textContent = "";
    elements.notification.className = "notification";
};

// ─────────────────────────────────────────────
// GESTIÓN DEL TOKEN JWT
// Sincroniza el token en el estado y en localStorage.
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// CAPA DE COMUNICACIÓN CON LA API
// Wrapper sobre fetch que agrega automáticamente:
// - Content-Type si hay body
// - Authorization con el token JWT si existe
// Lanza un error estructurado { status, payload } si la respuesta no es OK.
// ─────────────────────────────────────────────
const apiFetch = async (url, options = {}) => {
    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(state.token ? { Authorization: state.token } : {}),
        ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined // Serializa el body si existe
    });

    const payload = await response.json().catch(() => ({})); // Intenta parsear JSON; devuelve {} si falla

    if (!response.ok) {
        throw { status: response.status, payload }; // Error estructurado para getErrorMessage
    }

    return payload;
};

// ─────────────────────────────────────────────
// CONTROL DE VISTAS
// Alterna entre la vista de autenticación y la vista principal
// según si el usuario está logueado o no.
// ─────────────────────────────────────────────
const updateAuthView = (loggedIn) => {
    elements.authView.classList.toggle("hidden", loggedIn);
    elements.appView.classList.toggle("hidden", !loggedIn);
};

// ─────────────────────────────────────────────
// CONTEXTO DE EDICIÓN
// Carga los datos de un usuario en el formulario de edición.
// Si el admin está editando a otro usuario, muestra su ID en el título.
// El botón "reset" solo aparece si se está editando a alguien distinto al usuario actual.
// ─────────────────────────────────────────────
const applyEditingContext = (user) => {
    state.editingUserId = user.id;
    elements.editTitle.textContent =
        state.session?.role === "admin" && user.id !== state.session.id
            ? `Editar usuario #${user.id}`
            : "Actualizar mi usuario";
    elements.updateEmail.value = user.email || "";
    elements.updatePassword.value = ""; // El campo de contraseña siempre comienza vacío
    elements.resetEditButton.classList.toggle(
        "hidden",
        !state.session || state.session.id === user.id // Ocultar si se edita el propio perfil
    );
};

// ─────────────────────────────────────────────
// RENDERIZADO DE LA SESIÓN
// Actualiza la UI con los datos del perfil autenticado.
// Muestra u oculta el panel de admin según el rol.
// ─────────────────────────────────────────────
const renderSession = (profile) => {
    elements.sessionEmail.textContent = profile.email;
    elements.metricId.textContent = profile.id;
    elements.metricRole.textContent = profile.role || "user";
    elements.profileRole.textContent = profile.role || "user";
    elements.adminPanel.classList.toggle("hidden", profile.role !== "admin"); // Panel visible solo para admins
};

// ─────────────────────────────────────────────
// RENDERIZADO DEL USUARIO ACTUAL
// Actualiza la tarjeta de perfil del usuario logueado.
// Solo carga el formulario de edición si no se está editando otro usuario.
// ─────────────────────────────────────────────
const renderCurrentUser = (user) => {
    state.currentUser = user;
    elements.profileId.textContent = user.id;
    elements.profileEmail.textContent = user.email;
    elements.profileRole.textContent = state.session?.role || "user";

    // Solo actualiza el formulario si no hay otro usuario siendo editado activamente
    if (!state.editingUserId || state.editingUserId === user.id) {
        applyEditingContext(user);
    }
};

// ─────────────────────────────────────────────
// TABLA DE USUARIOS (solo admins)
// Construye las filas de la tabla con botones de editar y eliminar.
// ATENCIÓN: usa innerHTML con datos del servidor, riesgo de XSS si no se sanean en backend.
// ─────────────────────────────────────────────
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
                        <!-- data-action y data-id usados en el delegado de eventos de la tabla -->
                        <button type="button" data-action="edit" data-id="${user.id}">Editar</button>
                        <button type="button" data-action="delete" data-id="${user.id}">Eliminar</button>
                    </td>
                </tr>
            `
        )
        .join("");
};

// ─────────────────────────────────────────────
// VERIFICACIÓN DE ESTADO DE LA API
// Consulta el endpoint raíz y muestra el mensaje de respuesta.
// ─────────────────────────────────────────────
const fetchApiStatus = async () => {
    try {
        const data = await apiFetch("");
        elements.apiStatus.textContent = data.message;
    } catch (error) {
        elements.apiStatus.textContent = "Sin conexion";
        showNotification("No se pudo conectar con la API.", "error");
    }
};

// Carga el perfil completo del usuario logueado desde /users/:id
const loadOwnUser = async () => {
    const user = await apiFetch(`/users/${state.session.id}`);
    renderCurrentUser(user);
};

// Carga la lista de todos los usuarios (solo si el rol es admin)
const loadUsers = async () => {
    if (state.session?.role !== "admin") return;
    state.users = await apiFetch("/users");
    renderUsersTable();
};

// ─────────────────────────────────────────────
// REFRESCO DE SESIÓN
// Obtiene el perfil desde /auth/profile, actualiza el estado
// y carga los datos adicionales según el rol del usuario.
// ─────────────────────────────────────────────
const refreshSession = async () => {
    const profileData = await apiFetch("/auth/profile");
    state.session = profileData.user;
    renderSession(profileData.user);
    await loadOwnUser();
    if (state.session.role === "admin") {
        await loadUsers(); // Carga la tabla de usuarios solo para admins
    }
    updateAuthView(true);
};

// ─────────────────────────────────────────────
// CIERRE DE SESIÓN
// Limpia todo el estado local, el token y la UI.
// ─────────────────────────────────────────────
const resetSession = () => {
    state.session = null;
    state.currentUser = null;
    state.users = [];
    state.editingUserId = null;
    setToken(""); // Elimina el token del localStorage
    elements.usersTableBody.innerHTML = `
        <tr>
            <td colspan="4">No hay datos cargados.</td>
        </tr>
    `;
    updateAuthView(false);
};

// ─────────────────────────────────────────────
// AUTENTICACIÓN
// ─────────────────────────────────────────────

// Envía credenciales a /auth/login, guarda el token y refresca la sesión
const login = async (credentials) => {
    const data = await apiFetch("/auth/login", {
        method: "POST",
        body: credentials
    });
    setToken(data.token);
    await refreshSession();
};

// Registra un nuevo usuario en /auth/register (sin login automático aquí)
const register = async (payload) => {
    await apiFetch("/auth/register", {
        method: "POST",
        body: payload
    });
};

// ─────────────────────────────────────────────
// TABS DE LOGIN / REGISTRO
// Alterna la visibilidad de los formularios según la pestaña activa.
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// FORMULARIO DE LOGIN
// ─────────────────────────────────────────────
elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotification();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries()); // Convierte FormData a objeto plano

    try {
        await login(payload);
        showNotification("Sesion iniciada correctamente.");
        event.currentTarget.reset();
    } catch (error) {
        showNotification(getErrorMessage(error), "error");
    }
});

// ─────────────────────────────────────────────
// FORMULARIO DE REGISTRO
// Registra al usuario y lo autentica automáticamente.
// ─────────────────────────────────────────────
elements.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotification();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
        await register(payload);
        await login(payload); // Login inmediato tras registro exitoso
        showNotification("Usuario registrado y autenticado.");
        event.currentTarget.reset();
    } catch (error) {
        showNotification(getErrorMessage(error), "error");
    }
});

// ─────────────────────────────────────────────
// FORMULARIO DE ACTUALIZACIÓN DE USUARIO
// Envía solo los campos con valor; la contraseña es opcional.
// ─────────────────────────────────────────────
elements.updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotification();

    if (!state.editingUserId) return; // Guardia: no procede si no hay usuario en edición

    const email = elements.updateEmail.value.trim();
    const password = elements.updatePassword.value.trim();
    const payload = password ? { email, password } : { email }; // Solo incluye password si se ingresó

    try {
        await apiFetch(`/users/${state.editingUserId}`, {
            method: "PUT",
            body: payload
        });

        // Recarga el perfil propio si se editó el usuario actual
        if (state.editingUserId === state.session.id) {
            await loadOwnUser();
        }

        // Refresca la tabla de usuarios si el actor es admin
        if (state.session.role === "admin") {
            await loadUsers();
        }

        showNotification("Usuario actualizado correctamente.");
    } catch (error) {
        showNotification(getErrorMessage(error), "error");
    }
});

// ─────────────────────────────────────────────
// BOTONES DE ACCIÓN GLOBAL
// ─────────────────────────────────────────────

// Cierra la sesión limpiando estado y token
document.getElementById("logout-button").addEventListener("click", () => {
    resetSession();
    showNotification("Sesion cerrada.");
});

// Vuelve a consultar la API para sincronizar datos del perfil y usuarios
document.getElementById("refresh-profile-button").addEventListener("click", async () => {
    try {
        await refreshSession();
        showNotification("Datos sincronizados con la API.");
    } catch (error) {
        showNotification(getErrorMessage(error), "error");
    }
});

// Recarga la tabla de usuarios manualmente (acción de admin)
document.getElementById("load-users-button").addEventListener("click", async () => {
    try {
        await loadUsers();
        showNotification("Lista de usuarios actualizada.");
    } catch (error) {
        showNotification(getErrorMessage(error), "error");
    }
});

// Restaura el formulario de edición al propio perfil del usuario logueado
elements.resetEditButton.addEventListener("click", () => {
    if (state.currentUser) {
        applyEditingContext(state.currentUser);
        showNotification("Formulario restaurado a tu propio perfil.");
    }
});

// ─────────────────────────────────────────────
// DELEGADO DE EVENTOS EN LA TABLA DE USUARIOS
// Un solo listener maneja todos los botones de la tabla usando
// event delegation: se detecta el botón más cercano y su data-action.
// ─────────────────────────────────────────────
elements.usersTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return; // Ignorar clics fuera de un botón

    const userId = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit") {
        try {
            // Obtiene los datos actuales del usuario desde la API y los carga en el formulario
            const user = await apiFetch(`/users/${userId}`);
            applyEditingContext(user);
            showNotification(`Editando el usuario #${userId}.`);
        } catch (error) {
            showNotification(getErrorMessage(error), "error");
        }
    }

    if (action === "delete") {
        // Confirma la acción destructiva antes de proceder
        const confirmed = window.confirm(`Vas a eliminar el usuario #${userId}. Deseas continuar?`);
        if (!confirmed) return;

        try {
            await apiFetch(`/users/${userId}`, { method: "DELETE" });

            // Si el usuario eliminado estaba en edición, restaura el formulario al perfil propio
            if (state.editingUserId === userId && state.currentUser) {
                applyEditingContext(state.currentUser);
            }

            await loadUsers(); // Actualiza la tabla tras la eliminación
            showNotification(`Usuario #${userId} eliminado.`);
        } catch (error) {
            showNotification(getErrorMessage(error), "error");
        }
    }
});

// ─────────────────────────────────────────────
// INICIALIZACIÓN (bootstrap)
// Punto de entrada al cargar la página:
// 1. Muestra la URL base y el estado del token
// 2. Verifica si la API responde
// 3. Si hay token guardado, intenta recuperar la sesión automáticamente
// ─────────────────────────────────────────────
const bootstrap = async () => {
    setToken(state.token);             // Sincroniza el token con la UI
    elements.baseUrl.textContent = API_BASE;
    await fetchApiStatus();            // Ping a la API

    if (!state.token) {
        updateAuthView(false);         // Sin token: muestra pantalla de login
        return;
    }

    try {
        await refreshSession();        // Token existente: intenta restaurar sesión
        showNotification("Sesion recuperada desde el navegador.");
    } catch (error) {
        // Token inválido o expirado: limpia todo y pide nuevo login
        resetSession();
        showNotification("Tu token ya no es valido. Inicia sesion de nuevo.", "error");
    }
};

bootstrap(); // Arranca la aplicación