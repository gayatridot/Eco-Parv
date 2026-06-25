// ngo-dashboard.js
// This script handles loading NGOs owned by the logged-in user and listening
// for donation updates in Firebase Realtime Database.

import { db, auth } from "./auth.js";
import { ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Utility to create a donation card element
// Utility to create a donation card element
function createDonationCard(donation) {
  const card = document.createElement("div");
  card.className = "donation-card";
  const statusBadge = document.createElement("span");
  statusBadge.className = "badge";
  statusBadge.textContent = donation.status || "Pending";
  // Simple styling based on status
  if (donation.status === "accepted") statusBadge.style.background = "#28a745"; // green
  else if (donation.status === "rejected") statusBadge.style.background = "#dc3545"; // red
  else if (donation.status === "informed") statusBadge.style.background = "#17a2b8"; // teal
  else statusBadge.style.background = "#ffc107"; // yellow

  // Parse expiry if exists
  const expiryText = donation.expiryTime ? new Date(donation.expiryTime).toLocaleString() : (donation.createdAt ? new Date(donation.createdAt + 7 * 24 * 60 * 60 * 1000).toLocaleString() : "N/A");

  card.innerHTML = `
    <h3>${donation.item || donation.itemName || "Donation"}</h3>
    <p><strong>From:</strong> ${donation.donor || "Anonymous"}</p>
    <p><strong>Category:</strong> ${donation.category || ""}</p>
    <p><strong>Location:</strong> ${donation.coords || donation.location || ""}</p>
    <p><strong>Expiry:</strong> ${expiryText}</p>
  `;
  card.appendChild(statusBadge);

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "donation-actions";
  actionsDiv.style.marginTop = "10px";
  card.appendChild(actionsDiv);

  function resetActions() {
    actionsDiv.innerHTML = "";
    const currentStatus = donation.status || "pending";

    if (currentStatus === "pending" || currentStatus === "informed") {
      const acceptBtn = document.createElement("button");
      acceptBtn.className = "ngo-btn accept-btn";
      acceptBtn.textContent = "Accept";
      acceptBtn.style.marginRight = "5px";
      acceptBtn.style.background = "#28a745";
      acceptBtn.style.color = "white";
      acceptBtn.onclick = () => updateDonationStatus(donation.id, "accepted");

      const rejectBtn = document.createElement("button");
      rejectBtn.className = "ngo-btn reject-btn";
      rejectBtn.textContent = "Reject";
      rejectBtn.style.marginRight = "5px";
      rejectBtn.style.background = "#dc3545";
      rejectBtn.style.color = "white";
      rejectBtn.onclick = () => updateDonationStatus(donation.id, "rejected");

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "ngo-btn delete-btn";
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
      deleteBtn.style.background = "#6c757d";
      deleteBtn.style.color = "white";
      deleteBtn.onclick = () => {
        if (confirm("Are you sure you want to hide/delete this donation card from your dashboard?")) {
          updateDonationStatus(donation.id, "DeletedByNGO");
        }
      };

      actionsDiv.appendChild(acceptBtn);
      actionsDiv.appendChild(rejectBtn);
      actionsDiv.appendChild(deleteBtn);
    } else if (currentStatus === "accepted" || currentStatus === "rejected") {
      const editBtn = document.createElement("button");
      editBtn.className = "ngo-btn edit-btn";
      editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit';
      editBtn.style.marginRight = "5px";
      editBtn.style.background = "#ff922d";
      editBtn.style.color = "white";
      editBtn.onclick = () => {
        actionsDiv.innerHTML = "";

        const selectEl = document.createElement("select");
        selectEl.className = "ngo-status-select";
        selectEl.style.padding = "6px 10px";
        selectEl.style.marginRight = "8px";
        selectEl.style.borderRadius = "5px";
        selectEl.style.border = "1px solid #ccc";

        const statuses = ["accepted", "rejected", "informed", "pending"];
        statuses.forEach(statusVal => {
          const opt = document.createElement("option");
          opt.value = statusVal;
          opt.textContent = statusVal.charAt(0).toUpperCase() + statusVal.slice(1);
          if (currentStatus === statusVal) opt.selected = true;
          selectEl.appendChild(opt);
        });

        const saveBtn = document.createElement("button");
        saveBtn.className = "ngo-btn save-btn";
        saveBtn.textContent = "Save";
        saveBtn.style.marginRight = "5px";
        saveBtn.style.background = "#28a745";
        saveBtn.style.color = "white";
        saveBtn.onclick = () => {
          updateDonationStatus(donation.id, selectEl.value);
        };

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "ngo-btn cancel-btn";
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.background = "#6c757d";
        cancelBtn.style.color = "white";
        cancelBtn.onclick = () => {
          resetActions();
        };

        actionsDiv.appendChild(selectEl);
        actionsDiv.appendChild(saveBtn);
        actionsDiv.appendChild(cancelBtn);
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "ngo-btn delete-btn";
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
      deleteBtn.style.background = "#6c757d";
      deleteBtn.style.color = "white";
      deleteBtn.onclick = () => {
        if (confirm("Are you sure you want to hide/delete this donation card from your dashboard?")) {
          updateDonationStatus(donation.id, "DeletedByNGO");
        }
      };

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);
    }
  }

  resetActions();
  return card;
}

function updateDonationStatus(donationId, newStatus) {
  const donationRef = ref(db, `donations/${donationId}`);
  get(donationRef).then(async (snap) => {
    const data = snap.val() || {};
    const oldStatus = data.status || "pending";
    const qty = parseInt(data.quantity) || 1;
    const donorUid = data.donorUid || data.donorId;

    update(donationRef, { status: newStatus })
      .then(async () => {
        console.log(`Donation ${donationId} marked as ${newStatus}`);

        if (window.updateImpact && donorUid) {
          // Case 1: Was NOT accepted, now is accepted -> increment
          if (oldStatus !== "accepted" && newStatus === "accepted") {
            window.updateImpact(0, 0, qty, donorUid);
          }
          // Case 2: Was accepted, now is NOT accepted -> decrement
          else if (oldStatus === "accepted" && newStatus !== "accepted") {
            window.updateImpact(0, 0, -qty, donorUid);
          }
        }
      })
      .catch(err => console.error("Failed to update donation status:", err));
  }).catch(err => console.error("Failed to read donation before update:", err));
}

function renderDonations(donations) {
  const listEl = document.getElementById("donationList");
  if (!listEl) return;
  listEl.innerHTML = "";
  if (donations.length === 0) {
    listEl.innerHTML = `<p class="no-donations">No incoming donations at the moment.</p>`;
    return;
  }
  donations.forEach(donation => {
    const card = createDonationCard(donation);
    listEl.appendChild(card);
  });
}

// Listen for authentication state
onAuthStateChanged(auth, user => {
  if (!user) return;
  const uid = user.uid;

  // Listen to all donations and filter for those targeting any of the current user's registered NGOs
  // First, we need to know all the NGO IDs owned by this user
  const userNgosRef = ref(db, `ngos/${uid}`);
  onValue(userNgosRef, ngoSnapshot => {
    const userNgoIds = [];
    ngoSnapshot.forEach(child => {
      userNgoIds.push(child.key);
    });

    const donationsRef = ref(db, "donations");
    onValue(donationsRef, snapshot => {
      const all = snapshot.val() || {};
      const filtered = Object.entries(all)
        .filter(([id, data]) => userNgoIds.includes(data.ngoId) && data.status !== "DeletedByNGO")
        .map(([id, data]) => ({ id, ...data }));
      renderDonations(filtered);
    });
  });
});
