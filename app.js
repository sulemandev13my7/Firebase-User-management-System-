const firebaseConfig = {
    apiKey: "AIzaSyDwvCCOcxndE1jC3FlkYbm8U2CeE2-nboY",
    authDomain: "auth-salman-3b7e8.firebaseapp.com",
    projectId: "auth-salman-3b7e8",
    storageBucket: "auth-salman-3b7e8.firebasestorage.app",
    messagingSenderId: "851519714542",
    appId: "1:851519714542:web:f7c87ee7bae62c6602afff",
    measurementId: "G-548B02TWFK"
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const messageBox = document.getElementById("messageBox");
const showLoginBtn = document.getElementById("showLoginBtn");
const showSignupBtn = document.getElementById("showSignupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userForm = document.getElementById("userForm");
const usersTableBody = document.getElementById("usersTableBody");
const formTitle = document.getElementById("formTitle");
const submitUserBtn = document.getElementById("submitUserBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const detailModal = document.getElementById("detailModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");

let currentUser = null;
let unsubscribeUsers = null;
let isEditing = false;
let activeDocId = null;

function setMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.classList.toggle("error", isError);
}

function clearMessage() {
    messageBox.textContent = "";
    messageBox.classList.remove("error");
}

function showAuthView() {
    authView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
}

function showDashboardView() {
    authView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
}

function toggleAuthMode(mode) {
    clearMessage();
    showLoginBtn.classList.toggle("active", mode === "login");
    showSignupBtn.classList.toggle("active", mode === "signup");
    loginForm.classList.toggle("hidden", mode !== "login");
    signupForm.classList.toggle("hidden", mode !== "signup");
}

function resetUserForm() {
    userForm.reset();
    isEditing = false;
    activeDocId = null;
    formTitle.textContent = "Add New User";
    submitUserBtn.textContent = "Add User";
    cancelEditBtn.classList.add("hidden");
}

function renderUsers(snapshot) {
    if (!snapshot.size) {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No users added yet.</td></tr>';
        return;
    }

    const rows = snapshot.docs
        .map((doc) => {
            const data = doc.data();
            return `
        <tr>
          <td>${data.fullName || "-"}</td>
          <td>${data.email || "-"}</td>
          <td>${data.age || "-"}</td>
          <td>${data.city || "-"}</td>
          <td>${data.profession || "-"}</td>
          <td>
            <div class="table-actions">
              <button class="view-btn" data-action="view" data-id="${doc.id}">View</button>
              <button class="edit-btn" data-action="edit" data-id="${doc.id}">Edit</button>
              <button class="delete-btn" data-action="delete" data-id="${doc.id}">Delete</button>
            </div>
          </td>
        </tr>`;
        })
        .join("");

    usersTableBody.innerHTML = rows;
}

function attachUserListener(uid) {
    if (unsubscribeUsers) {
        unsubscribeUsers();
    }

    const usersRef = db.collection("users").where("uid", "==", uid).orderBy("createdAt", "desc");
    unsubscribeUsers = usersRef.onSnapshot((snapshot) => {
        renderUsers(snapshot);
    });
}

async function handleUserSubmit(event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("userEmail").value.trim();
    const age = Number(document.getElementById("age").value);
    const city = document.getElementById("city").value.trim();
    const profession = document.getElementById("profession").value.trim();

    if (!fullName || !email || !city || !profession || Number.isNaN(age)) {
        setMessage("Please complete every field before saving the user.", true);
        return;
    }

    const payload = {
        uid: currentUser.uid,
        fullName,
        email,
        age,
        city,
        profession,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (isEditing && activeDocId) {
            await db.collection("users").doc(activeDocId).update(payload);
            setMessage("User updated successfully.");
        } else {
            await db.collection("users").add(payload);
            setMessage("User added to Firestore.");
        }
        resetUserForm();
    } catch (error) {
        setMessage(error.message, true);
    }
}

async function deleteUser(docId) {
    const confirmed = window.confirm("Delete this user record?");
    if (!confirmed) return;

    try {
        await db.collection("users").doc(docId).delete();
        setMessage("User removed successfully.");
    } catch (error) {
        setMessage(error.message, true);
    }
}

async function editUser(docId) {
    const docRef = await db.collection("users").doc(docId).get();
    if (!docRef.exists) return;

    const data = docRef.data();
    document.getElementById("fullName").value = data.fullName || "";
    document.getElementById("userEmail").value = data.email || "";
    document.getElementById("age").value = data.age || "";
    document.getElementById("city").value = data.city || "";
    document.getElementById("profession").value = data.profession || "";

    isEditing = true;
    activeDocId = docId;
    formTitle.textContent = "Edit User";
    submitUserBtn.textContent = "Update User";
    cancelEditBtn.classList.remove("hidden");
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function viewUser(docId) {
    const docRef = await db.collection("users").doc(docId).get();
    if (!docRef.exists) return;

    const data = docRef.data();
    modalBody.innerHTML = `
    <p><strong>Full Name:</strong> ${data.fullName || "-"}</p>
    <p><strong>Email:</strong> ${data.email || "-"}</p>
    <p><strong>Age:</strong> ${data.age || "-"}</p>
    <p><strong>City:</strong> ${data.city || "-"}</p>
    <p><strong>Profession:</strong> ${data.profession || "-"}</p>
  `;
    detailModal.classList.remove("hidden");
}

function closeModal() {
    detailModal.classList.add("hidden");
}

showLoginBtn.addEventListener("click", () => toggleAuthMode("login"));
showSignupBtn.addEventListener("click", () => toggleAuthMode("signup"));

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        setMessage("Login successful.");
    } catch (error) {
        setMessage(error.message, true);
    }
});

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        setMessage("Account created successfully.");
    } catch (error) {
        setMessage(error.message, true);
    }
});

logoutBtn.addEventListener("click", async () => {
    try {
        await auth.signOut();
        localStorage.removeItem("firebase-user");
        resetUserForm();
        showAuthView();
    } catch (error) {
        setMessage(error.message, true);
    }
});

userForm.addEventListener("submit", handleUserSubmit);
cancelEditBtn.addEventListener("click", resetUserForm);
closeModalBtn.addEventListener("click", closeModal);
detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal) {
        closeModal();
    }
});

usersTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const docId = button.dataset.id;

    if (action === "view") {
        await viewUser(docId);
    } else if (action === "edit") {
        await editUser(docId);
    } else if (action === "delete") {
        await deleteUser(docId);
    }
});

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        localStorage.setItem("firebase-user", JSON.stringify({
            uid: user.uid,
            email: user.email
        }));
        showDashboardView();
        attachUserListener(user.uid);
    } else {
        currentUser = null;
        localStorage.removeItem("firebase-user");
        showAuthView();
        toggleAuthMode("login");
        resetUserForm();
        if (unsubscribeUsers) {
            unsubscribeUsers();
            unsubscribeUsers = null;
        }
        usersTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Please log in to view user records.</td></tr>';
    }
});

const storedUser = JSON.parse(localStorage.getItem("firebase-user") || "null");
if (storedUser) {
    showDashboardView();
} else {
    showAuthView();
    toggleAuthMode("login");
}

if (!firebaseConfig.projectId.includes("YOUR_")) {
    clearMessage();
} else {
    setMessage("Replace the placeholder Firebase settings in app.js with your own project config to connect the app.", true);
}