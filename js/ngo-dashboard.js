// ngo-dashboard.js
// This script handles loading NGOs owned by the logged-in user and listening
// for donation updates in Firebase Realtime Database.

import { db, auth } from "./auth.js";
import { ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

  card.innerHTML = `
    <h3>${donation.item || donation.itemName || "Donation"}</h3>
    <p><strong>From:</strong> ${donation.donor || "Anonymous"}</p>
    <p><strong>Category:</strong> ${donation.category || ""}</p>
    <p><strong>Location:</strong> ${donation.coords || ""}</p>
    <p><strong>Expiry:</strong> ${new Date(donation.expiryTime).toLocaleString()}</p>
  `;
  card.appendChild(statusBadge);

  // Accept / Reject buttons (only show if status is pending or informed)
  if (!donation.status || donation.status === "pending" || donation.status === "informed") {
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
    rejectBtn.style.background = "#dc3545";
    rejectBtn.style.color = "white";
    rejectBtn.onclick = () => updateDonationStatus(donation.id, "rejected");

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "donation-actions";
    actionsDiv.style.marginTop = "10px";
    actionsDiv.appendChild(acceptBtn);
    actionsDiv.appendChild(rejectBtn);
    card.appendChild(actionsDiv);
  }

  return card;
}

function updateDonationStatus(donationId, newStatus) {
  // Update the status field in the database
  const donationRef = ref(db, `donations/${donationId}`);
  update(donationRef, { status: newStatus })
    .then(async () => {
      console.log(`Donation ${donationId} marked as ${newStatus}`);

      // When an NGO accepts a donation, increment peopleHelped by the quantity
      if (newStatus === "accepted" && window.updateImpact) {
        const snap = await get(donationRef);
        const data = snap.val() || {};
        const qty = parseInt(data.quantity) || 1;
        const donorUid = data.donorId;
        if (donorUid) {
          window.updateImpact(0, 0, qty, donorUid); // +peopleHelped for the donor
        }
      }
    })
    .catch(err => console.error("Failed to update donation status:", err));
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
        .filter(([id, data]) => userNgoIds.includes(data.ngoId))
        .map(([id, data]) => ({ id, ...data }));
      renderDonations(filtered);
    });
  });
});
