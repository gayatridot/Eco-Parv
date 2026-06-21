import { db, auth } from "./auth.js";
import { ref, push, set, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxhx9KZzppvSWySuLL-QP08crl3TrM0FmLeL3Lw5-vy_rghIywc4EXH-pOFAZR9p9US/exec";

// ==========================
// IMPACT DASHBOARD LOGIC
// Stats are now stored in Firebase RTDB (userImpact/{uid}),
// managed by updateImpact() and subscribeImpact() in auth.js.
// ==========================

/** Renders impact stats on the dashboard elements. */
function renderImpactStats(stats) {
    const cEl = document.getElementById('carbonSaved');
    const tEl = document.getElementById('treesPlanted');
    const iEl = document.getElementById('itemsRenewed');
    const pEl = document.getElementById('peopleHelped');
    if (cEl) cEl.innerText = stats.carbon;
    if (tEl) tEl.innerText = stats.trees;
    if (iEl) iEl.innerText = stats.items;
    if (pEl) pEl.innerText = stats.people;
}

// Keep a reference to unsubscribe when user logs out / changes
let impactUnsub = null;

/** Start listening to the logged-in user's impact stats via Firebase onValue. */
window.initImpactDashboard = function () {
    // Unsubscribe from any previous listener
    if (impactUnsub) { impactUnsub(); impactUnsub = null; }

    if (window.subscribeImpact) {
        impactUnsub = window.subscribeImpact(renderImpactStats);
    } else {
        // Fallback: subscribeImpact not yet loaded (auth.js hasn't run)
        renderImpactStats({ carbon: 0, items: 0, people: 0, trees: 0 });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    window.initImpactDashboard();

    // ── Renew page: track .btn-renew clicks ──
    document.querySelectorAll(".btn-renew").forEach(link => {
        link.addEventListener("click", (e) => {
            // Fire-and-forget impact update before navigation
            if (window.updateImpact) {
                window.updateImpact(2, 1, 0); // +2 CO₂, +1 item renewed
            }
        });
    });



    // ── Homepage: track Buy Now clicks for eco-friendly items ──
    document.querySelectorAll("a[href*='amazon.in']").forEach(link => {
        link.addEventListener("click", (e) => {
            // Fire-and-forget impact update before navigation
            if (window.updateImpact) {
                window.updateImpact(1, 0, 0); // +1 CO₂ saved
            }
        });
    });

    const popup = document.getElementById("popupContainer");
    const popupTitle = document.getElementById("popupTitle");
    const formFields = document.getElementById("formFields");
    const donationForm = document.getElementById("donationForm");
    const geoBtn = document.getElementById("geoBtn");
    const locationStatus = document.getElementById("locationStatus");
    const locationCoords = document.getElementById("locationCoords");
    const foodList = document.getElementById("foodList");
    const noFoodMessage = document.getElementById("noFoodMessage");
    const dashboardTitle = document.getElementById("dashboardTitle");

    let currentCategory = "food";
    let donations = [];
    let previousStatuses = {};
    let editingDonationId = null;

    const categoryTitles = {
        food: "Available Food Nearby",
        clothes: "Available Clothes Nearby",
        books: "Available Books Nearby",
        school_bags: "Available School Bags Nearby",
        shoes: "Available Shoes Nearby",
        toys: "Available Toys Nearby",
        bicycles: "Available Bicycles Nearby"
    };

    // Helper for toast notifications
    function showToast(message) {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.style.position = "fixed";
            container.style.bottom = "20px";
            container.style.right = "20px";
            container.style.zIndex = "10000";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "10px";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = "toast-notification";
        toast.style.background = "#2c3e50";
        toast.style.color = "#fff";
        toast.style.padding = "14px 22px";
        toast.style.borderRadius = "10px";
        toast.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
        toast.style.fontSize = "0.95rem";
        toast.style.fontWeight = "600";
        toast.style.opacity = "0";
        toast.style.transition = "all 0.3s ease";
        toast.style.transform = "translateY(20px)";
        toast.style.borderLeft = "5px solid #2ecc71";
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0)";
        }, 50);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(20px)";
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }

    // Listen for Auth changes in script.js
    onAuthStateChanged(auth, user => {
        window.currentUser = user;
        window.isAuthenticated = !!user;
        if (window.initImpactDashboard) {
            window.initImpactDashboard();
        }
        updateDashboard();
    });

    // Real-time listener for NGOs
    window.ngoList = [];
    const ngosRef = ref(db, "ngos");
    onValue(ngosRef, snapshot => {
        const data = snapshot.val() || {};
        const list = [];
        Object.entries(data).forEach(([ownerUid, userNgos]) => {
            if (userNgos && typeof userNgos === "object") {
                Object.entries(userNgos).forEach(([ngoId, ngoData]) => {
                    list.push({ id: ngoId, name: ngoData.name || "Unnamed NGO", ownerUid });
                });
            }
        });
        window.ngoList = list;
        updateDashboard();
    });

    // Real-time listener for donations
    const donationsRef = ref(db, "donations");
    onValue(donationsRef, snapshot => {
        const data = snapshot.val() || {};
        const list = [];

        Object.entries(data).forEach(([key, val]) => {
            list.push({ id: key, ...val });
        });

        // Sort donations by added time descending
        list.sort((a, b) => {
            const aTime = a.addedTime ? new Date(a.addedTime).getTime() : 0;
            const bTime = b.addedTime ? new Date(b.addedTime).getTime() : 0;
            return bTime - aTime;
        });

        // Toast notifications for status changes
        const currentUid = window.currentUser?.uid;
        list.forEach(donation => {
            if (currentUid && donation.donorUid === currentUid) {
                const prevStatus = previousStatuses[donation.id];
                if (prevStatus !== undefined && prevStatus !== donation.status) {
                    if (donation.status === "accepted") {
                        showToast(`🎉 Your donation "${donation.item}" has been ACCEPTED by the NGO!`);
                    } else if (donation.status === "rejected") {
                        showToast(`❌ Your donation "${donation.item}" has been REJECTED.`);
                    }
                }
                previousStatuses[donation.id] = donation.status;
            }
        });

        donations = list;
        updateDashboard();
    });

    // Edit, Delete, Inform handlers
    function deleteDonation(id) {
        if (!confirm("Delete this donation permanently?")) return;
        const donationRef = ref(db, `donations/${id}`);
        remove(donationRef)
            .then(() => showToast("Donation deleted successfully."))
            .catch(err => console.error("Delete failed", err));
    }

    function informNgo(donationId, ngoId) {
        const donationRef = ref(db, `donations/${donationId}`);
        update(donationRef, { ngoId: ngoId, status: "informed" })
            .then(() => showToast("NGO has been informed about your donation!"))
            .catch(err => console.error("Inform NGO failed", err));
    }

    function startEdit(donation) {
        editingDonationId = donation.id;
        openPopup(donation.category);

        // Populate inputs
        document.getElementById("itemName").value = donation.item || "";
        document.getElementById("donorName").value = donation.donor || "";
        if (document.getElementById("quantity")) {
            document.getElementById("quantity").value = donation.quantity || "";
        }
        if (document.getElementById("condition")) {
            document.getElementById("condition").value = donation.condition || "Like New";
        }
        if (donation.category === "food" && document.getElementById("expiryHours")) {
            document.getElementById("expiryHours").value = donation.expiryHours || 4;
        }

        if (document.getElementById("locationCoords")) {
            document.getElementById("locationCoords").value = donation.coords || "";
        }
        if (locationStatus) {
            locationStatus.innerHTML = `<span style="color: #115a25; font-weight: bold;">📍 Location loaded for editing</span>`;
        }

        // Update form submission button text
        const submitBtn = donationForm.querySelector("button[type='submit']");
        if (submitBtn) {
            submitBtn.textContent = "Update Donation Now";
        }

        // Add cancel button if not already present
        let cancelBtn = document.getElementById("cancelEditBtn");
        if (!cancelBtn) {
            cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.id = "cancelEditBtn";
            cancelBtn.className = "btn btn-secondary";
            cancelBtn.textContent = "Cancel Edit";
            cancelBtn.style.marginTop = "10px";
            cancelBtn.style.background = "#7f8c8d";
            cancelBtn.style.color = "white";
            cancelBtn.style.border = "none";
            cancelBtn.style.padding = "10px";
            cancelBtn.style.borderRadius = "8px";
            cancelBtn.style.cursor = "pointer";
            cancelBtn.onclick = clearEditMode;
            donationForm.appendChild(cancelBtn);
        }
    }

    function clearEditMode() {
        editingDonationId = null;
        donationForm.reset();
        const submitBtn = donationForm.querySelector("button[type='submit']");
        if (submitBtn) {
            submitBtn.textContent = "List Item Now.";
        }
        const cancelBtn = document.getElementById("cancelEditBtn");
        if (cancelBtn) {
            cancelBtn.remove();
        }
        if (locationStatus) {
            locationStatus.innerHTML = "";
        }
    }

    // ==========================
    // OPEN POPUP / DYNAMIC FIELDS
    // ==========================
    window.openPopup = function (category) {
        currentCategory = category;
        if (dashboardTitle) {
            dashboardTitle.innerText = categoryTitles[category];
            popup.classList.remove("hidden");

            switch (category) {
                case "food":
                    popupTitle.innerText = "Donate Surplus Food";
                    formFields.innerHTML = `
                        <div class="form-group">
                            <label>🍲 Food Item Name</label>
                            <input type="text" id="itemName" placeholder="Rice, Dal, Roti" required>
                        </div>
                        <div class="form-group">
                            <label>🍽 Quantity</label>
                            <input type="text" id="quantity" placeholder="For 50 people" required>
                        </div>
                        <div class="form-group">
                            <label>⏰ Freshness Duration (Hours)</label>
                            <input type="number" id="expiryHours" min="1" max="24" placeholder="e.g. 4" required>
                        </div>
                        <div class="form-group">
                            <label>🏨 Restaurant / Donor Name</label>
                            <input type="text" id="donorName" placeholder="Taj Hotel" required>
                        </div>
                        <input type="hidden" id="condition" value="Fresh">
                    `;
                    break;

                case "clothes":
                    popupTitle.innerText = "Donate Unwanted Clothes";
                    formFields.innerHTML = `
                        <div class="form-group">
                            <label>👕 Clothing Type</label>
                            <input type="text" id="itemName" placeholder="Shirt, Saree" required>
                        </div>
                        <div class="form-group">
                            <label>📏 Quantity</label>
                            <input type="text" id="quantity" placeholder="e.g. 2 shirts" required>
                        </div>
                        <div class="form-group">
                            <label>✨ Condition</label>
                            <select id="condition">
                                <option>Like New</option>
                                <option>Good</option>
                                <option>Usable</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>👤 Donor Name</label>
                            <input type="text" id="donorName" placeholder="Your Name" required>
                        </div>
                    `;
                    break;

                case "books":
                    popupTitle.innerText = "Donate Unwanted Books";
                    formFields.innerHTML = `
                        <div class="form-group">
                            <label>📚 Book Title</label>
                            <input type="text" id="itemName" placeholder="Mathematics XII" required>
                        </div>
                        <div class="form-group">
                            <label>🔢 Quantity</label>
                            <input type="text" id="quantity" placeholder="e.g. 3 books" required>
                        </div>
                        <div class="form-group">
                            <label>✨ Condition</label>
                            <select id="condition">
                                <option>Like New</option>
                                <option>Good</option>
                                <option>Usable</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>👤 Donor Name</label>
                            <input type="text" id="donorName" placeholder="Your Name" required>
                        </div>
                    `;
                    break;

                case "school_bags":
                    popupTitle.innerText = "Donate School Bags";
                    formFields.innerHTML = `
                        <div class="form-group">
                            <label>🎒 Bag Type</label>
                            <input type="text" id="itemName" placeholder="School Backpack" required>
                        </div>
                        <div class="form-group">
                            <label>🔢 Quantity</label>
                            <input type="text" id="quantity" placeholder="e.g. 1 bag" required>
                        </div>
                        <div class="form-group">
                            <label>✨ Condition</label>
                            <select id="condition">
                                <option>Like New</option>
                                <option>Good</option>
                                <option>Usable</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>👤 Donor Name</label>
                            <input type="text" id="donorName" placeholder="Your Name" required>
                        </div>
                    `;
                    break;

                case "shoes":
                    popupTitle.innerText = "Donate Nonfit Shoes";
                    formFields.innerHTML = `
                        <div class="form-group">
                            <label>👟 Shoe Type</label>
                            <input type="text" id="itemName" placeholder="Sports Shoes" required>
                        </div>
                        <div class="form-group">
                            <label>🔢 Quantity</label>
                            <input type="text" id="quantity" placeholder="e.g. 1 pair" required>
                        </div>
                        <div class="form-group">
                            <label>✨ Condition</label>
                            <select id="condition">
                                <option>Like New</option>
                                <option>Good</option>
                                <option>Usable</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>👤 Donor Name</label>
                            <input type="text" id="donorName" placeholder="Your Name" required>
                        </div>
                    `;
                    break;

                case "toys":
                    popupTitle.innerText = "Donate Unwanted Toys";
                    formFields.innerHTML = `
                        <div class="form-group">
                            <label>🧸 Toy Name</label>
                            <input type="text" id="itemName" placeholder="Remote Car" required>
                        </div>
                        <div class="form-group">
                            <label>🔢 Quantity</label>
                            <input type="text" id="quantity" placeholder="e.g. 3 toys" required>
                        </div>
                        <div class="form-group">
                            <label>✨ Condition</label>
                            <select id="condition">
                                <option>Like New</option>
                                <option>Good</option>
                                <option>Usable</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>👤 Donor Name</label>
                            <input type="text" id="donorName" placeholder="Your Name" required>
                        </div>
                    `;
                    break;

                case "bicycles":
                    popupTitle.innerText = "Donate Unwanted Bicycle";
                    formFields.innerHTML = `
                        <div class="form-group">
                            <label>🚲 Bicycle Model</label>
                            <input type="text" id="itemName" placeholder="Hero Sprint" required>
                        </div>
                        <div class="form-group">
                            <label>🔢 Quantity</label>
                            <input type="text" id="quantity" placeholder="e.g. 1 bicycle" required>
                        </div>
                        <div class="form-group">
                            <label>✨ Condition</label>
                            <select id="condition">
                                <option>Like New</option>
                                <option>Good</option>
                                <option>Usable</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>👤 Donor Name</label>
                            <input type="text" id="donorName" placeholder="Your Name" required>
                        </div>
                    `;
                    break;
            }
            updateDashboard();
        }
    };

    window.closePopup = function () {
        popup.classList.add("hidden");
    };

    // ==========================
    // GEOLOCATION
    // ==========================
    if (geoBtn) {
        geoBtn.addEventListener("click", () => {
            if (!navigator.geolocation) {
                locationStatus.innerText = "Geolocation not supported by your browser";
                return;
            }

            locationStatus.innerHTML = "<i>Locating your device... Please allow access.</i>";

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude.toFixed(5);
                    const lon = position.coords.longitude.toFixed(5);
                    locationCoords.value = `${lat},${lon}`;

                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                        const data = await response.json();
                        if (data && data.address) {
                            const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
                            const state = data.address.state || "";
                            const locationName = [city, state].filter(Boolean).join(", ");
                            locationStatus.innerHTML = `<span style="color: #115a25; font-weight: bold;">📍 Pickup Location: ${locationName || "Secured"}</span>`;
                        } else {
                            locationStatus.innerHTML = `<span style="color: #115a25; font-weight: bold;">📍 Location secured (${lat}, ${lon})</span>`;
                        }
                    } catch (err) {
                        locationStatus.innerHTML = `<span style="color: #115a25; font-weight: bold;">📍 Location secured (${lat}, ${lon})</span>`;
                    }

                    geoBtn.innerText = "Change Location";
                },
                (error) => {
                    console.error("Location error:", error);
                    locationCoords.value = "28.6139,77.2090"; // Fallback
                    locationStatus.innerHTML = "<span style='color: #d9534f;'>Could not access location. Please check browser permissions.</span>";
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    // ==========================
    // SUBMIT FORM
    // ==========================
    if (donationForm) {
        donationForm.addEventListener("submit", (e) => {
            e.preventDefault();

            if (!window.currentUser) {
                alert("Please sign in or register to donate items.");
                if (window.openAuthModal) {
                    window.openAuthModal("login");
                }
                return;
            }

            const itemName = sanitizeInput(document.getElementById("itemName").value);
            const donorName = sanitizeInput(document.getElementById("donorName").value);
            const quantityVal = document.getElementById("quantity") ? sanitizeInput(document.getElementById("quantity").value) : "1";
            const conditionVal = document.getElementById("condition") ? sanitizeInput(document.getElementById("condition").value) : "Fresh";

            if (editingDonationId) {
                // Update donation
                const donationRef = ref(db, `donations/${editingDonationId}`);
                const updatedData = {
                    item: itemName,
                    donor: donorName,
                    quantity: quantityVal,
                    condition: conditionVal,
                    coords: locationCoords.value || "28.6139,77.2090"
                };

                if (currentCategory === "food") {
                    const expiryHours = parseInt(document.getElementById("expiryHours").value) || 4;
                    const expiryTime = new Date();
                    expiryTime.setHours(expiryTime.getHours() + expiryHours);
                    updatedData.expiryHours = expiryHours;
                    updatedData.expiryTime = expiryTime.toISOString();
                }

                update(donationRef, updatedData)
                    .then(() => {
                        clearEditMode();
                        showToast("Donation updated successfully!");
                    })
                    .catch((err) => console.error("Update donation failed", err));
            } else {
                // Create new donation
                const donationRef = push(ref(db, "donations"));
                const donationId = donationRef.key;

                const donationData = {
                    id: donationId,
                    category: currentCategory,
                    item: itemName,
                    donor: donorName,
                    quantity: quantityVal,
                    condition: conditionVal,
                    coords: locationCoords.value || "28.6139,77.2090",
                    addedTime: new Date().toISOString(),
                    donorUid: window.currentUser ? window.currentUser.uid : null,
                    status: "pending"
                };

                if (currentCategory === "food") {
                    const expiryHours = parseInt(document.getElementById("expiryHours").value) || 4;
                    const expiryTime = new Date();
                    expiryTime.setHours(expiryTime.getHours() + expiryHours);
                    donationData.expiryHours = expiryHours;
                    donationData.expiryTime = expiryTime.toISOString();
                } else {
                    const expiryTime = new Date();
                    expiryTime.setDate(expiryTime.getDate() + 30); // 30 days default expiry
                    donationData.expiryTime = expiryTime.toISOString();
                }

                set(donationRef, donationData)
                    .then(() => {
                        donationForm.reset();
                        if (locationStatus) locationStatus.innerHTML = "";
                        window.updateImpact(
                            currentCategory === "food" ? 2 : 0,
                            currentCategory !== "food" ? 1 : 0,
                            0
                        );
                        showToast("Donation listed successfully!");
                    })
                    .catch((err) => console.error("Create donation failed", err));
            }
        });
    }

    // ==========================
    // DASHBOARD
    // ==========================
    function updateDashboard() {
        if (!foodList) return;
        foodList.innerHTML = "";

        const now = new Date();
        // Keep active donations (unexpired)
        const activeDonations = donations.filter(d => new Date(d.expiryTime) > now);
        const filteredDonations = activeDonations.filter(d => d.category === currentCategory);

        if (filteredDonations.length === 0) {
            if (noFoodMessage) noFoodMessage.style.display = "block";
            return;
        }

        if (noFoodMessage) noFoodMessage.style.display = "none";

        filteredDonations.forEach(donation => {
            let emoji = "🎁";
            switch (donation.category) {
                case "food": emoji = "🍲"; break;
                case "clothes": emoji = "👕"; break;
                case "books": emoji = "📚"; break;
                case "school_bags": emoji = "🎒"; break;
                case "shoes": emoji = "👟"; break;
                case "toys": emoji = "🧸"; break;
                case "bicycles": emoji = "🚲"; break;
            }

            let statusText = donation.status || "pending";
            let statusClass = "badge-pending";
            if (statusText === "informed") {
                statusClass = "badge-informed";
                statusText = "Informed";
            } else if (statusText === "accepted") {
                statusClass = "badge-accepted";
                statusText = "Accepted by NGO";
            } else if (statusText === "rejected") {
                statusClass = "badge-rejected";
                statusText = "Rejected";
            } else {
                statusText = "Pending";
            }

            const card = document.createElement("div");
            card.className = "food-card";
            card.style.position = "relative";

            const escapedItem = escapeHTML(donation.item);
            const escapedQuantity = escapeHTML(donation.quantity || "N/A");
            const escapedCondition = escapeHTML(donation.condition || "N/A");
            const escapedDonor = escapeHTML(donation.donor || "Anonymous");

            let actionHtml = "";
            const isOwner = window.currentUser && (donation.donorUid === window.currentUser.uid);

            if (isOwner) {
                actionHtml += `
                <div class="action-links" style="margin-bottom: 12px; margin-top: 15px;">
                    <button class="action-btn edit-btn orange" style="background:#e67e22; color:white; padding:6px 12px; border-radius:6px; border:none; cursor:pointer; margin-right:5px;">Edit</button>
                    <button class="action-btn delete-btn grey" style="background:#7f8c8d; color:white; padding:6px 12px; border-radius:6px; border:none; cursor:pointer;">Delete</button>
                </div>
                `;

                if (!donation.ngoId) {
                    const ngoSelectId = `ngoSelect_${donation.id}`;
                    const informBtnId = `informBtn_${donation.id}`;

                    let ngoOptions = `<option value="">Select NGO</option>`;
                    if (window.ngoList && window.ngoList.length > 0) {
                        window.ngoList.forEach(ngo => {
                            ngoOptions += `<option value="${escapeHTML(ngo.id)}">${escapeHTML(ngo.name)}</option>`;
                        });
                    }

                    actionHtml += `
                    <div class="inform-ngo" style="display: flex; gap: 8px; margin-top: 10px;">
                        <select id="${ngoSelectId}" class="ngo-select" style="flex: 1; padding: 6px; border-radius: 6px; border: 1px solid #ccc;">
                            ${ngoOptions}
                        </select>
                        <button id="${informBtnId}" class="ngo-btn inform-btn green" style="background:#2ecc71; color:white; padding:6px 12px; border-radius:6px; border:none; cursor:pointer;">Inform NGO</button>
                    </div>
                    `;
                } else {
                    let informedNgoName = "Informed NGO";
                    if (window.ngoList && window.ngoList.length > 0) {
                        const matched = window.ngoList.find(ngo => ngo.id === donation.ngoId);
                        if (matched) informedNgoName = matched.name;
                    }
                    actionHtml += `
                    <p style="margin-top:10px; color:#555; font-size:0.9rem;"><strong>Informed NGO:</strong> ${escapeHTML(informedNgoName)}</p>
                    `;
                }
            } else {
                actionHtml += `
                <div class="action-links" style="margin-top: 15px;">
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(donation.coords || '28.6139,77.2090')}" target="_blank" class="action-btn">🗺 View Map</a>
                    <a href="https://wa.me/?text=Hi%2C%20I%20am%20interested%20in%20collecting%20${encodeURIComponent(donation.item || '')}" target="_blank" class="action-btn" style="color:#25D366">💬 Contact</a>
                </div>
                `;
            }

            card.innerHTML = `
                <span class="badge ${statusClass}">
                    ${statusText}
                </span>
                <h3>${emoji} ${escapedItem}</h3>
                <p><strong>Quantity:</strong> ${escapedQuantity}</p>
                <p><strong>Condition:</strong> ${escapedCondition}</p>
                <p><strong>From:</strong> ${escapedDonor}</p>
                ${actionHtml}
            `;

            foodList.appendChild(card);

            if (isOwner) {
                const editBtn = card.querySelector(".edit-btn");
                if (editBtn) editBtn.onclick = () => startEdit(donation);

                const deleteBtn = card.querySelector(".delete-btn");
                if (deleteBtn) deleteBtn.onclick = () => deleteDonation(donation.id);

                const informBtn = card.querySelector(".inform-btn");
                if (informBtn) {
                    informBtn.onclick = () => {
                        const selectEl = card.querySelector(".ngo-select");
                        const selectedNgoId = selectEl.value;
                        if (!selectedNgoId) {
                            alert("Please select an NGO from the list.");
                            return;
                        }
                        informNgo(donation.id, selectedNgoId);
                    };
                }
            }
        });
    }

    // ==========================
    // DEFAULT FOOD OPEN
    // ==========================
    openPopup("food");

    // ==========================
    // AUTO REFRESH
    // ==========================
    setInterval(updateDashboard, 60000);
});

const productsContainer =
    document.getElementById("productsContainer");

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const loadMoreBtn =
    document.getElementById("loadMoreBtn");


let allProducts = [];
let filteredProducts = [];

let visibleCount = 4;

function getImageUrl(url) {

    const match = url.match(/id=([^&]+)/);

    if (!match) return url;

    return `https://lh3.googleusercontent.com/d/${match[1]}`;

}

// =================
// FETCH PRODUCTS
// =================
async function loadProducts() {

    const response = await fetch(WEB_APP_URL);

    const products = await response.json();

    console.log("Products:", products);

    // Format images properly
    allProducts = products.map(product => {
        return {
            ...product,
            imageUrl: getImageUrl(product.imageUrl)
        };
    });

    // Initially show all products
    filteredProducts = [...allProducts];

    // Populate the dropdown and render the initial set
    populateCategories();
    renderProducts();

}

// =================
// CATEGORY DROPDOWN
// =================
function populateCategories() {

    const categories =
        [...new Set(
            allProducts.map(
                product => product.category
            )
        )];

    categories.forEach(category => {

        categoryFilter.innerHTML += `
            <option value="${category}">
                ${category}
            </option>
        `;

    });

}


// =================
// DISPLAY PRODUCTS
// =================
function renderProducts() {

    productsContainer.innerHTML = "";

    const productsToShow =
        filteredProducts.slice(0, visibleCount);

    productsToShow.forEach(product => {

        const safeName = product.itemName.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const safeDesc = product.whyEco.replace(/'/g, "\\'").replace(/"/g, "&quot;");

        productsContainer.innerHTML += `
        <div class="eco-card" onclick="openEcoModal('${safeName}', '${safeDesc}')">
            <div class="eco-card-top">
                <img class="eco-card-img" src="${product.imageUrl}" alt="${product.itemName.replace(/"/g, "&quot;")}">
                <div class="eco-card-header">
                    <span class="eco-category">${product.category}</span>
                    <h3 class="eco-title">${product.itemName}</h3>
                </div>
            </div>
            <h4 class="eco-why-title">Why is it eco-friendly?</h4>
            <p class="eco-desc">${product.whyEco}</p>
            <button class="buy-now-btn" onclick="buyNow(event, '${safeName}')">Buy Now</button>
        </div>
        `;

    });


    if (visibleCount >= filteredProducts.length) {

        loadMoreBtn.style.display = "none";

    }

    else {

        loadMoreBtn.style.display = "inline-block";

    }

}


// =================
// LOAD MORE
// =================
if (loadMoreBtn) {
    loadMoreBtn.addEventListener(
        "click",
        () => {
            visibleCount += 8;
            renderProducts();
        }
    );
}


// =================
// SEARCH + FILTER
// =================
function filterProducts() {

    const query =
        searchInput.value
            .toLowerCase()
            .trim();

    const category =
        categoryFilter.value;

    filteredProducts =
        allProducts.filter(product => {

            const itemName = product.itemName || "";

            const matchesSearch =
                itemName
                    .toLowerCase()
                    .includes(query);

            const matchesCategory =
                category === "Filter by Category" || category === "all" ||
                product.category === category;

            return (
                matchesSearch &&
                matchesCategory
            );

        });

    visibleCount = 4;

    renderProducts();

}


if (searchInput) {
    searchInput.addEventListener(
        "input",
        filterProducts
    );
}

if (categoryFilter) {
    categoryFilter.addEventListener(
        "change",
        filterProducts
    );
}

const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
    searchBtn.addEventListener("click", filterProducts);
}

// =================
// MODAL LOGIC
// =================
const ecoModalOverlay = document.getElementById("ecoModalOverlay");
const ecoModalClose = document.getElementById("ecoModalClose");
const ecoModalTitle = document.getElementById("ecoModalTitle");
const ecoModalDesc = document.getElementById("ecoModalDesc");

window.openEcoModal = function (itemName, desc) {
    if (ecoModalOverlay) {
        ecoModalTitle.innerText = itemName;
        ecoModalDesc.innerText = desc;
        ecoModalOverlay.classList.add("active");
    }
};

if (ecoModalClose) {
    ecoModalClose.addEventListener("click", () => {
        ecoModalOverlay.classList.remove("active");
    });
}

if (ecoModalOverlay) {
    ecoModalOverlay.addEventListener("click", (e) => {
        if (e.target === ecoModalOverlay) {
            ecoModalOverlay.classList.remove("active");
        }
    });
}

// =================
// BUY NOW
// =================
window.buyNow = function (event, itemName) {
    event.stopPropagation();
    const query = encodeURIComponent(itemName);
    window.updateImpact(1, 0, 0);
    window.open(`https://www.meesho.com/search?q=${query}`, "_blank");
};

// =================
// START
// =================
if (document.getElementById("productsContainer")) {
    loadProducts();
}
