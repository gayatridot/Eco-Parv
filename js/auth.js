/**
 * auth.js — Part 1
 * Features:
 * ✅ Firebase Auth + Realtime Database
 * ✅ Signup
 * ✅ Login
 * ✅ Forgot Password
 * ✅ Password Strength Meter
 * ✅ Duplicate Email Check
 * ✅ Modal Injection
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    deleteUser,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get,
    child,
    remove,
    update,
    onValue,
    increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { firebaseConfig } from "./config.js";


//────────────────────────────────────
// FIREBASE INITIALIZATION
//────────────────────────────────────

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

const googleProvider = new GoogleAuthProvider();


//────────────────────────────────────
// IMPACT DASHBOARD — FIREBASE FUNCTIONS
// Exposed on `window` so any page (module or inline) can call them.
//────────────────────────────────────

/**
 * Atomically increment the current user's impact stats in Firebase RTDB.
 * Path: userImpact/{uid}
 * Fields: carbonSaved, itemsRenewed, peopleHelped  (all atomic via increment())
 *         treesPlanted is derived = Math.floor(carbonSaved / 25)
 *
 * @param {number} carbonAdd   — CO₂ kg to add
 * @param {number} itemsAdd    — items renewed to add
 * @param {number} peopleAdd   — people helped to add
 */
window.updateImpact = async function(carbonAdd, itemsAdd, peopleAdd = 0, targetUid = null) {
    const uid = targetUid || window.currentUser?.uid;
    if (!uid) return; // not logged in — do nothing

    const statsRef = ref(db, `userImpact/${uid}`);
    const updates = {};
    if (carbonAdd)  updates.carbonSaved   = increment(carbonAdd);
    if (itemsAdd)   updates.itemsRenewed  = increment(itemsAdd);
    if (peopleAdd)  updates.peopleHelped  = increment(peopleAdd);

    try {
        await update(statsRef, updates);
        // After the atomic increment, re-derive treesPlanted
        const snap = await get(statsRef);
        const data = snap.val() || {};
        const trees = Math.floor((data.carbonSaved || 0) / 25);
        await update(statsRef, { treesPlanted: trees });
    } catch (err) {
        console.error("Impact update failed:", err);
    }
};

/**
 * Subscribe to the current user's impact stats via onValue().
 * Calls `callback({ carbon, items, people, trees })` whenever data changes.
 * Returns an unsubscribe function (call it on logout).
 *
 * @param {Function} callback
 * @returns {Function} unsubscribe
 */
window.subscribeImpact = function(callback) {
    const uid = window.currentUser?.uid;
    if (!uid) {
        callback({ carbon: 0, items: 0, people: 0, trees: 0 });
        return () => {}; // noop unsubscribe
    }

    const statsRef = ref(db, `userImpact/${uid}`);
    const unsub = onValue(statsRef, (snap) => {
        const d = snap.val() || {};
        callback({
            carbon: d.carbonSaved  || 0,
            items:  d.itemsRenewed || 0,
            people: d.peopleHelped || 0,
            trees:  d.treesPlanted || 0
        });
    });
    return unsub;
};


//────────────────────────────────────
// FIRST VISIT TRACKING
//────────────────────────────────────

const HAS_VISITED_KEY = "hasVisited";

function hasVisited() {
    return localStorage.getItem(HAS_VISITED_KEY) === "1";
}

function markVisited() {
    localStorage.setItem(HAS_VISITED_KEY, "1");
}


//────────────────────────────────────
// PASSWORD VALIDATION
//────────────────────────────────────

function validatePassword(password) {

    return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);

}


function getPasswordStrength(password) {

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;
    if (password.length >= 12) score++;

    return score;

}


//────────────────────────────────────
// MODAL HTML
//────────────────────────────────────

const modalHTML = `
<div class="auth-overlay" id="authOverlay">

    <div class="auth-card">

        <button class="auth-close" id="authClose">&times;</button>

        <div class="auth-brand">
            ❤ Eco Parv
        </div>

        <h2 id="authTitle" class="auth-title">
            Sign In
        </h2>

        <form id="authForm">

            <div class="auth-field" id="authNameField" style="display:none">
                <label>Full Name</label>
                <input
                    type="text"
                    id="authName"
                    placeholder="Enter your full name"
                >
            </div>

            <div class="auth-field">
                <label>Email</label>
                <input
                    type="email"
                    id="authEmail"
                    required
                >
            </div>

            <div class="auth-field" id="authPassField">

                <label>Password</label>

                <input
                    type="password"
                    id="authPass"
                    required
                >

                <div id="authStrengthWrap" style="display:none">

                    <div id="authStrengthBar">

                        <div id="authStrengthFill"></div>

                    </div>

                    <div id="authStrengthRules">

                        <div id="rule-length">
                            ❌ Minimum 8 characters
                        </div>

                        <div id="rule-upper">
                            ❌ Uppercase letter
                        </div>

                        <div id="rule-number">
                            ❌ Number
                        </div>

                        <div id="rule-special">
                            ❌ Special character
                        </div>

                    </div>

                </div>

            </div>

            <button
                type="submit"
                class="auth-btn-primary"
                id="authSubmit"
            >
                Sign In
            </button>

        </form>

        <div id="authError" class="auth-error"></div>

        <button id="authForgot" class="auth-link">
            Forgot Password?
        </button>

        <div class="auth-divider">
            OR
        </div>

        <button id="authGoogle" class="auth-btn-google">
            Continue with Google
        </button>

        <button id="authSwitch" class="auth-btn-secondary"></button>

    </div>

</div>
`;

document.body.insertAdjacentHTML(
    "beforeend",
    modalHTML
);


//────────────────────────────────────
// DOM ELEMENTS
//────────────────────────────────────

const overlay = document.getElementById("authOverlay");

const authTitle = document.getElementById("authTitle");

const authForm = document.getElementById("authForm");

const authName = document.getElementById("authName");

const authNameField = document.getElementById("authNameField");

const authEmail = document.getElementById("authEmail");

const authPass = document.getElementById("authPass");

const authPassField = document.getElementById("authPassField");

const authSubmit = document.getElementById("authSubmit");

const authError = document.getElementById("authError");

const authForgot = document.getElementById("authForgot");

const authSwitch = document.getElementById("authSwitch");

const authStrengthWrap = document.getElementById("authStrengthWrap");

const authStrengthFill = document.getElementById("authStrengthFill");


//────────────────────────────────────
// MODE
//────────────────────────────────────

let mode = "login";


//────────────────────────────────────
// ERROR HANDLER
//────────────────────────────────────

function showError(msg) {

    authError.style.display = "block";
    authError.textContent = msg;

}


//────────────────────────────────────
// MODAL RENDER
//────────────────────────────────────

function renderModal() {

    authError.style.display = "none";

    if (mode === "signup") {

        authTitle.textContent = "Create Account";

        authSubmit.textContent = "Create Account";

        authNameField.style.display = "block";

        authStrengthWrap.style.display = "block";

        authSwitch.textContent =
            "Already have an account? Sign In";

    }

    else if (mode === "login") {

        authTitle.textContent = "Sign In";

        authSubmit.textContent = "Sign In";

        authNameField.style.display = "none";

        authStrengthWrap.style.display = "none";

        authSwitch.textContent =
            "New user? Create Account";

    }

    else {

        authTitle.textContent = "Password Reset";

        authSubmit.textContent = "Send Email";

        authPassField.style.display = "none";

        authSwitch.textContent =
            "Back To Login";

    }

}


//────────────────────────────────────
// PASSWORD STRENGTH
//────────────────────────────────────

authPass.addEventListener("input", () => {

    if (mode !== "signup") return;

    const password = authPass.value;

    const rules = [
        {
            el: document.getElementById("rule-length"),
            valid: password.length >= 8,
            text: "Minimum 8 characters"
        },
        {
            el: document.getElementById("rule-upper"),
            valid: /[A-Z]/.test(password),
            text: "Uppercase letter"
        },
        {
            el: document.getElementById("rule-number"),
            valid: /\d/.test(password),
            text: "Number"
        },
        {
            el: document.getElementById("rule-special"),
            valid: /[!@#$%^&*]/.test(password),
            text: "Special character"
        }
    ];

    rules.forEach(rule => {
        rule.el.innerHTML = `${rule.valid ? "✅" : "❌"} ${rule.text}`;
        rule.el.style.color = rule.valid
            ? "#22c55e"
            : "#ef4444";
    });

    const strength = getPasswordStrength(password);

    const colors = [
        "#ef4444",
        "#ef4444",
        "#f59e0b",
        "#eab308",
        "#22c55e",
        "#16a34a"
    ];

    authStrengthFill.style.width = `${strength * 20}%`;
    authStrengthFill.style.background = colors[strength];

});


//────────────────────────────────────
// SWITCH LOGIN/SIGNUP
//────────────────────────────────────

authSwitch.addEventListener("click", () => {

    if (mode === "login") {

        mode = "signup";

    } else {

        mode = "login";

    }

    renderModal();

});


//────────────────────────────────────
// FORGOT PASSWORD
//────────────────────────────────────

authForgot.addEventListener("click", () => {

    mode = "reset";

    renderModal();

});


//────────────────────────────────────
// FORM SUBMIT
//────────────────────────────────────

function friendlyError(code) {

    const errors = {

        "auth/email-already-in-use":
            "An account with this email already exists.",

        "auth/invalid-email":
            "Please enter a valid email address.",

        "auth/user-not-found":
            "No account found with this email.",

        "auth/wrong-password":
            "Incorrect email or password.",

        "auth/invalid-credential":
            "Incorrect email or password.",

        "auth/weak-password":
            "Password is too weak.",

        "auth/network-request-failed":
            "Check your internet connection.",

        "auth/too-many-requests":
            "Too many attempts. Please try again later."

    };

    return errors[code] ||
        "Something went wrong. Please try again.";

}


authForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = authEmail.value.trim();

    const password = authPass.value;

    const name = authName.value.trim();

    try {

        // SIGNUP
        if (mode === "signup") {

            if (!validatePassword(password)) {

                showError(
                    "Password must contain uppercase letter, number and special character."
                );

                return;

            }

            const methods =
                await fetchSignInMethodsForEmail(
                    auth,
                    email
                );

            if (methods.length > 0) {

                showError(
                    "Email already registered."
                );

                return;

            }

            const credential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            await updateProfile(
                credential.user,
                {
                    displayName: name
                }
            );

            await set(ref(db, `users/${credential.user.uid}`), {
                uid: credential.user.uid,
                name,
                email,
                createdAt: Date.now()
            });

            markVisited();

            overlay.classList.remove("active");
            if (window.authRedirectUrl) {
                const target = window.authRedirectUrl;
                window.authRedirectUrl = null;
                location.href = target;
            }

        }


        // LOGIN
        else if (mode === "login") {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            overlay.classList.remove("active");
            if (window.authRedirectUrl) {
                const target = window.authRedirectUrl;
                window.authRedirectUrl = null;
                location.href = target;
            }

        }


        // PASSWORD RESET
        else {

            await sendPasswordResetEmail(
                auth,
                email
            );

            alert(
                "Password reset email sent."
            );

            mode = "login";

            renderModal();

        }

    }

    catch (err) {

        showError(
            friendlyError(err.code)
        );

    }

});

//────────────────────────────────────
// GOOGLE SIGN IN
//────────────────────────────────────

authGoogle.addEventListener("click", async () => {
    try {

        const result = await signInWithPopup(auth, googleProvider);

        await set(ref(db, `users/${result.user.uid}`), {
            uid: result.user.uid,
            name: result.user.displayName,
            email: result.user.email,
            photo: result.user.photoURL,
            createdAt: Date.now()
        });

        markVisited();

        overlay.classList.remove("active");
        if (window.authRedirectUrl) {
            const target = window.authRedirectUrl;
            window.authRedirectUrl = null;
            location.href = target;
        }

    } catch (err) {


        showError(friendlyError(err.code));

    }
});


//────────────────────────────────────
// AUTH STATE
//────────────────────────────────────

window.isAuthenticated = false;
window.currentUser = null;

onAuthStateChanged(auth, (user) => {

    window.isAuthenticated = !!user;
    window.currentUser = user;

    updateNavButton();
    updateChatbot();

    if (window.initImpactDashboard) {
        window.initImpactDashboard();
    }

    if (!user && location.pathname !== "/" && !location.pathname.endsWith("index.html")) {

        openModal(hasVisited() ? "login" : "signup");

    }

});


//────────────────────────────────────
// NAV BUTTON
//────────────────────────────────────

function updateNavButton() {

    document.querySelectorAll(".nav-auth-container")
        .forEach(el => el.remove());

    document.querySelectorAll("header nav")
        .forEach(nav => {

            const box = document.createElement("div");

            box.className = "nav-auth-container";

            const btn = document.createElement("button");

            if (window.isAuthenticated) {

                btn.textContent = "Logout";
                btn.className = "nav-auth-btn logout";

                btn.onclick = async () => {

                    await signOut(auth);

                    location.reload();

                };

            }

            else {

                btn.textContent = hasVisited()
                    ? "Login"
                    : "Sign Up";
                btn.className = hasVisited()
                    ? "nav-auth-btn login"
                    : "nav-auth-btn signup";

                btn.onclick = () =>
                    openModal(
                        hasVisited()
                            ? "login"
                            : "signup"
                    );

            }

            box.appendChild(btn);

            nav.appendChild(box);

        });

}


//────────────────────────────────────
// DELETE ACCOUNT
//────────────────────────────────────

window.deleteAccount = async () => {

    const user = auth.currentUser;

    if (!user) return;

    if (!confirm("Delete account permanently?"))
        return;

    try {

        await remove(ref(db, `users/${user.uid}`));

        await deleteUser(user);

        localStorage.removeItem(
            HAS_VISITED_KEY
        );

        alert("Account deleted.");

        location.href = "/";

    }

    catch (err) {

        if (
            err.code ===
            "auth/requires-recent-login"
        ) {

            alert(
                "Please login again before deleting account."
            );

            await signOut(auth);

        }

    }

};


//────────────────────────────────────
// CHATBOT VISIBILITY
//────────────────────────────────────

function updateChatbot() {

    const fab =
        document.getElementById("chatFab");

    if (!fab) return;

    fab.style.display =
        window.isAuthenticated
            ? "flex"
            : "none";

}


//────────────────────────────────────
// ROUTE GUARD / CLICK INTERCEPTION
//────────────────────────────────────

document.addEventListener("click", (e) => {

    const link = e.target.closest("a[href]");
    const dashboard = e.target.closest(".impact-dashboard");

    if (link) {

        const url = new URL(link.href, location.href);

        const isInternal =
            url.hostname === location.hostname;

        const isProtected =
            isInternal &&
            !url.pathname.endsWith("index.html") &&
            url.pathname !== "/";

        if (!window.isAuthenticated && isProtected) {

            e.preventDefault();

            // Store target URL for redirection after successful authentication
            window.authRedirectUrl = link.href;

            openModal(
                hasVisited()
                    ? "login"
                    : "signup"
            );

        }

    } else if (dashboard) {

        if (!window.isAuthenticated) {

            e.preventDefault();

            // Clicking dashboard opens the modal, but stays on homepage
            openModal(
                hasVisited()
                    ? "login"
                    : "signup"
            );

        }

    }

});


//────────────────────────────────────
// MODAL CONTROL
//────────────────────────────────────

function openModal(type = "login") {

    mode = type;

    renderModal();

    overlay.classList.add("active");

}

window.openAuthModal = openModal;


//────────────────────────────────────
//close 
//────────────────────────────────────
authClose.addEventListener("click", closeModal);

overlay.addEventListener("click", (e) => {

    if (e.target === overlay) {

        closeModal();

    }

});

function closeModal() {

    overlay.classList.remove("active");

    authForm.reset();

    authError.style.display = "none";

    const isProtected = location.pathname !== "/" && !location.pathname.endsWith("index.html");
    if (!window.isAuthenticated && isProtected) {
        location.href = "index.html";
    }

}
