// donor-dashboard.js
// Handles donor side donation creation, listing, editing, deletion, and informing NGOs.

import { db, auth } from "./auth.js";
import { ref, push, set, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;
let currentCategory = "food"; // default

// UI elements
const donationForm = document.getElementById("donationForm");
const donationIdInput = document.getElementById("donationId");
const itemNameInput = document.getElementById("itemName");
const quantityInput = document.getElementById("quantity");
const conditionSelect = document.getElementById("condition");
const cancelBtn = document.getElementById("cancelBtn");
const donationGrid = document.getElementById("donationGrid");
const formTitle = document.getElementById("formTitle");
const catButtons = document.querySelectorAll(".cat-btn");

// Helper to create badge based on status
function createStatusBadge(status) {
  const badge = document.createElement("span");
  badge.className = "status-badge";
  badge.textContent = status || "Pending";
  // Simple colour scheme
  switch (status) {
    case "accepted":
      badge.style.background = "#28a745"; // green
      break;
    case "rejected":
      badge.style.background = "#dc3545"; // red
      break;
    case "informed":
      badge.style.background = "#17a2b8"; // teal
      break;
    case "DeletedByNGO":
      badge.textContent = "Closed / Archived";
      badge.style.background = "#6c757d"; // grey
      break;
    default:
      badge.style.background = "#ffc107"; // yellow
  }
  return badge;
}

// Render a single donation card
function renderDonationCard(donation) {
  const card = document.createElement("div");
  card.className = "donation-card";
  card.dataset.id = donation.id;

  const title = document.createElement("h3");
  title.textContent = donation.itemName || "Untitled";

  const details = document.createElement("p");
  details.innerHTML = `<strong>Details:</strong> ${donation.quantity || ""} | <strong>Condition:</strong> ${donation.condition || ""}`;

  const category = document.createElement("p");
  category.innerHTML = `<strong>Category:</strong> ${donation.category}`;

  const statusBadge = createStatusBadge(donation.status);

  // Action buttons container
  const actions = document.createElement("div");
  actions.className = "donation-actions";

  // Edit button (only if still pending)
  if (!donation.status || donation.status === "pending" || donation.status === "informed") {
    const editBtn = document.createElement("button");
    editBtn.className = "orange";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => loadDonationIntoForm(donation);
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "grey";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteDonation(donation.id);
    actions.appendChild(deleteBtn);
  }

  // Inform NGO button (if not yet informed and there are NGOs available)
  if (!donation.ngoId) {
    const informBtn = document.createElement("button");
    informBtn.className = "green";
    informBtn.textContent = "Inform NGO";
    informBtn.onclick = () => openInformModal(donation.id);
    actions.appendChild(informBtn);
  }

  card.appendChild(title);
  card.appendChild(details);
  card.appendChild(category);
  card.appendChild(statusBadge);
  if (actions.childElementCount > 0) card.appendChild(actions);

  donationGrid.appendChild(card);
}

// Load donation into form for editing
function loadDonationIntoForm(donation) {
  donationIdInput.value = donation.id;
  itemNameInput.value = donation.itemName || "";
  quantityInput.value = donation.quantity || "";
  conditionSelect.value = donation.condition || "Like New";
  formTitle.textContent = "Edit Donation";
}

function clearForm() {
  donationIdInput.value = "";
  donationForm.reset();
  formTitle.textContent = "Create Donation";
}

function deleteDonation(id) {
  if (!confirm("Delete this donation permanently?")) return;
  const donationRef = ref(db, `donations/${id}`);
  remove(donationRef).catch(err => console.error("Delete failed", err));
}

// ---------- Inform NGO flow ----------
let ngoListCache = [];
function fetchNGOs() {
  const ngosRef = ref(db, "ngos");
  onValue(ngosRef, snapshot => {
    const data = snapshot.val() || {};
    // Flatten to an array of {key, ...info}
    ngoListCache = [];
    Object.entries(data).forEach(([ownerUid, ngoObj]) => {
      if (typeof ngoObj === "object") {
        Object.entries(ngoObj).forEach(([ngoKey, ngoInfo]) => {
          ngoListCache.push({ id: ngoKey, ownerUid, ...ngoInfo });
        });
      }
    });
  }, { onlyOnce: true });
}

function openInformModal(donationId) {
  // Simple prompt – could be replaced with a modal UI later.
  if (ngoListCache.length === 0) {
    alert("No NGOs available to inform.");
    return;
  }
  const names = ngoListCache.map((n, i) => `${i + 1}: ${n.name || n.id}`);
  const choice = prompt(`Select NGO by number:\n${names.join("\n")}`);
  const index = parseInt(choice, 10) - 1;
  if (isNaN(index) || index < 0 || index >= ngoListCache.length) {
    alert("Invalid selection.");
    return;
  }
  const selectedNGO = ngoListCache[index];
  const donationRef = ref(db, `donations/${donationId}`);
  update(donationRef, { ngoId: selectedNGO.id, status: "informed" })
    .then(() => console.log("Donation informed to NGO", selectedNGO.name))
    .catch(err => console.error("Inform NGO failed", err));
}

// ---------- Rendering list ----------
function renderDonationsList(allDonations) {
  donationGrid.innerHTML = "";
  const filtered = allDonations.filter(d => d.category === currentCategory);
  if (filtered.length === 0) {
    donationGrid.innerHTML = `<p class="no-donations">No ${currentCategory} donations yet.</p>`;
    return;
  }
  filtered.forEach(renderDonationCard);
}

// Listen for auth
onAuthStateChanged(auth, user => {
  if (!user) {
    console.log("User not signed in");
    return;
  }
  currentUser = user;
  fetchNGOs(); // populate NGO list for inform flow

  // Listen to all donor's donations in realtime
  const donationsRef = ref(db, "donations");
  onValue(donationsRef, snapshot => {
    const all = snapshot.val() || {};
    const donorDonations = Object.entries(all)
      .filter(([id, d]) => d.donorUid === user.uid)
      .map(([id, d]) => ({ id, ...d }));
    renderDonationsList(donorDonations);
  });
});

// Form submission handler
 donationForm.addEventListener("submit", e => {
  e.preventDefault();
  if (!currentUser) return alert("Please sign in.");

  const donationData = {
    itemName: itemNameInput.value.trim(),
    quantity: quantityInput.value.trim(),
    condition: conditionSelect.value,
    category: currentCategory,
    donorUid: currentUser.uid,
    status: "pending",
    createdAt: Date.now()
  };

  const donationId = donationIdInput.value;
  if (donationId) {
    // Update existing donation (preserve existing fields like ngoId/status if any)
    const donationRef = ref(db, `donations/${donationId}`);
    update(donationRef, donationData).catch(err => console.error("Update failed", err));
  } else {
    // New donation
    const newRef = push(ref(db, "donations"));
    set(newRef, donationData).catch(err => console.error("Create failed", err));
  }
  clearForm();
});

cancelBtn.addEventListener("click", () => {
  clearForm();
});

// Category navigation handling
catButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentCategory = btn.dataset.cat;
    // Highlight active button
    catButtons.forEach(b => b.classList.toggle("active", b === btn));
    // Re‑render list for the selected category
    // Trigger a refresh by reading current donations (the realtime listener already updates UI)
    // We simply force a UI refresh by invoking the same render function with cached data.
    // For simplicity, we'll re‑fetch donations once.
    if (currentUser) {
      const donationsRef = ref(db, "donations");
      onValue(donationsRef, snapshot => {
        const all = snapshot.val() || {};
        const donorDonations = Object.entries(all)
          .filter(([id, d]) => d.donorUid === currentUser.uid)
          .map(([id, d]) => ({ id, ...d }));
        renderDonationsList(donorDonations);
      }, { onlyOnce: true });
    }
  });
});

// Initial active button
if (catButtons.length) catButtons[0].classList.add("active");
