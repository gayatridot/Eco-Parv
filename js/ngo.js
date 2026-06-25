import { db, auth } from "./auth.js";
import { getDatabase, ref, push, onValue, set, remove, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

function initNgoPage() {
    const mockNgos = [
        {
            id: "mock1",
            name: "Goonj",
            location: "Delhi, India",
            email: "mail@goonj.org",
            phone: "+91-11-26972351",
            whatsapp: "911126972351",
            website: "https://goonj.org",
            image: "https://files.catbox.moe/aag4y5.jpg", // placeholder
            tag: "Recently Registered NGO",
            desc: "Empowering communities with recycled resources and addressing basic needs.",
            dateAdded: new Date("2023-01-01").getTime()
        },
        {
            id: "mock2",
            name: "Share At Doorstep",
            location: "Bangalore, India",
            email: "contact@sadsindia.org",
            phone: "+91-80-41525252",
            whatsapp: "918041525252",
            website: "https://sadsindia.org",
            image: "https://files.catbox.moe/mhv4yx.jpg", // placeholder
            tag: "Active",
            desc: "Doorstep pickup of clothes, toys & electronics for charities.",
            dateAdded: new Date("2023-05-15").getTime()
        },
        {
            id: "mock3",
            name: "Clothes Box Foundation",
            location: "Gurgaon, India",
            email: "info@clothesboxfoundation.org",
            phone: "+91-9999999999",
            whatsapp: "919999999999",
            website: "https://clothesboxfoundation.org",
            image: "https://files.catbox.moe/fr6h5p.jpg", // placeholder
            tag: "Trusted",
            desc: "Providing refurbished clothes to those in need across India.",
            dateAdded: new Date("2022-11-20").getTime()
        },
        {
            id: "mock4",
            name: "Robin Hood Army",
            location: "Mumbai, India",
            email: "info@robinhoodarmy.com",
            phone: "+91-8888888888",
            whatsapp: "918888888888",
            website: "https://robinhoodarmy.com",
            image: "https://files.catbox.moe/q348bw.jpg", // placeholder
            tag: "Food Rescue",
            desc: "Redistributing surplus food from restaurants to the hungry.",
            dateAdded: new Date("2021-08-10").getTime()
        },
        {
            id: "mock5",
            name: "Snehalaya",
            location: "Ahmednagar, India",
            email: "info@snehalaya.org",
            phone: "+91-241-2778353",
            whatsapp: "912412778353",
            website: "https://www.snehalaya.org",
            image: "https://files.catbox.moe/6ur92m.jpg", // placeholder
            tag: "Women & Children",
            desc: "Support for women, children, and LGBT communities in need.",
            dateAdded: new Date("2020-02-14").getTime()
        },
        {
            id: "mock6",
            name: "SevaDeep",
            location: "Pune, India",
            email: "contact@sevadeep.org",
            phone: "+91-7777777777",
            whatsapp: "917777777777",
            website: "",
            image: "https://files.catbox.moe/aag4y5.jpg", // placeholder
            tag: "Household",
            desc: "Donating furniture and household items to impoverished families.",
            dateAdded: new Date("2023-09-01").getTime()
        },
        {
            id: "mock7",
            name: "Sparsh Setu",
            location: "Ahmedabad, India",
            email: "hello@sparshsetu.in",
            phone: "+91-6666666666",
            whatsapp: "916666666666",
            website: "",
            image: "https://files.catbox.moe/mhv4yx.jpg", // placeholder
            tag: "Community",
            desc: "Providing clothes, books, and groceries for underserved communities.",
            dateAdded: new Date("2023-08-15").getTime()
        },
        {
            id: "mock8",
            name: "Anamprem",
            location: "Nashik, India",
            email: "anamprem@gmail.com",
            phone: "+91-5555555555",
            whatsapp: "915555555555",
            website: "https://anamprem.org",
            image: "https://files.catbox.moe/fr6h5p.jpg", // placeholder
            tag: "Disability Support",
            desc: "Helping differently-abled children and individuals with special needs.",
            dateAdded: new Date("2019-12-01").getTime()
        },
        {
            id: "mock9",
            name: "Green Yatra",
            location: "Mumbai, India",
            email: "info@greenyatra.org",
            phone: "+91-4444444444",
            whatsapp: "914444444444",
            website: "https://greenyatra.org",
            image: "https://files.catbox.moe/q348bw.jpg", // placeholder
            tag: "Environment",
            desc: "Eco-friendly initiatives, tree planting, and sustainability.",
            dateAdded: new Date("2021-04-22").getTime()
        },
        {
            id: "mock10",
            name: "HelpAge India",
            location: "Delhi, India",
            email: "headoffice@helpageindia.org",
            phone: "+91-11-41688955",
            whatsapp: "911141688955",
            website: "https://www.helpageindia.org",
            image: "https://files.catbox.moe/6ur92m.jpg", // placeholder
            tag: "Elder Care",
            desc: "Caring for disadvantaged elderly citizens across India.",
            dateAdded: new Date("2020-10-01").getTime()
        },
        {
            id: "mock11",
            name: "Uday Foundation",
            location: "Delhi, India",
            email: "info@udayfoundation.org",
            phone: "+91-11-26561333",
            whatsapp: "911126561333",
            website: "https://www.udayfoundation.org",
            image: "https://files.catbox.moe/aag4y5.jpg", // placeholder
            tag: "Health",
            desc: "Providing food and medical help to children with medical needs.",
            dateAdded: new Date("2022-03-10").getTime()
        }
    ];

    let ngos = [...mockNgos];
    let filteredNgos = [...ngos];
    let visibleCount = 10;

    let currentUser = null;
    let editingNgoId = null;
    let editingOwnerUid = null;
    let editingNgoImage = null;

    // Track authentication state
    onAuthStateChanged(auth, user => {
        currentUser = user || null;
        renderNGOs(); // Re-render to update Edit/Delete buttons visibility
    });

    // Listen to Firebase RTDB for registered NGOs
    const ngosRef = ref(db, "ngos");
    onValue(ngosRef, (snapshot) => {
        const data = snapshot.val() || {};
        const dbNgos = [];
        Object.entries(data).forEach(([ownerUid, userNgos]) => {
            if (userNgos && typeof userNgos === "object") {
                Object.entries(userNgos).forEach(([ngoId, ngoData]) => {
                    dbNgos.push({
                        id: ngoId,
                        ownerUid: ownerUid,
                        ...ngoData
                    });
                });
            }
        });
        ngos = [...mockNgos, ...dbNgos];
        populateDropdowns();
        applyFilters();
    });

    const ngoGrid = document.getElementById("ngoGrid");
    const loadMoreBtn = document.getElementById("ngoLoadMoreBtn");
    
    const searchInput = document.getElementById("ngoSearchInput");
    const locationInput = document.getElementById("ngoLocationInput");
    const searchBtn = document.getElementById("ngoSearchBtn");
    const sortSelect = document.getElementById("ngoSortSelect");
    const locationSelect = document.getElementById("ngoLocationSelect");
    const filterBtn = document.getElementById("ngoFilterBtn");

    const regForm = document.getElementById("ngoRegForm");
    const regImage = document.getElementById("regImage");
    const fileChosenText = document.getElementById("fileChosenText");

    // Populate Dropdowns
    function populateDropdowns() {
        // Location Dropdown
        const locations = [...new Set(ngos.map(n => n.location))];
        locationSelect.innerHTML = '<option value="all">All Locations</option>';
        locations.forEach(loc => {
            locationSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
        });

        // Category/Tag Dropdown (replacing Sort)
        const tags = [...new Set(ngos.map(n => n.tag))];
        sortSelect.innerHTML = '<option value="all">All NGOs</option>';
        tags.forEach(tag => {
            sortSelect.innerHTML += `<option value="${tag}">${tag}</option>`;
        });
    }

    function escapeHTML(str) {
        if (!str) return "";
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Render NGOs
    function renderNGOs() {
        ngoGrid.innerHTML = "";
        const ngosToShow = filteredNgos.slice(0, visibleCount);

        ngosToShow.forEach(ngo => {
            const hasWebsite = ngo.website && ngo.website.trim() !== "";
            
            const escName = escapeHTML(ngo.name);
            const escLocation = escapeHTML(ngo.location);
            const escImage = escapeHTML(ngo.image || "https://files.catbox.moe/aag4y5.jpg");
            const escTag = escapeHTML(ngo.tag);
            const escDesc = escapeHTML(ngo.desc);

            const isOwner = currentUser && ngo.ownerUid && currentUser.uid === ngo.ownerUid;
            const ownerActions = isOwner
                ? `<div class="ngo-owner-actions" style="display:flex;gap:6px;margin:8px 0;justify-content:center;">
                        <button class="ngo-edit-btn" style="background:#ff922d;color:white;border:none;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:0.82rem;">
                          <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button class="ngo-delete-btn" style="background:#dc3545;color:white;border:none;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:0.82rem;">
                          <i class="fa-solid fa-trash"></i> Delete
                        </button>
                   </div>`
                : '';

            const card = document.createElement("div");
            card.className = "ngo-card";
            card.innerHTML = `
                <div class="ngo-card-top">
                    <img class="ngo-img" src="${escImage}" alt="${escName}">
                    <div class="ngo-info">
                        <h3>${escName}</h3>
                        <p>${escLocation}</p>
                        <div class="ngo-icons">
                            <i class="fa-solid fa-envelope icon-email" title="Email"></i>
                            <i class="fa-solid fa-phone icon-phone" title="Call"></i>
                            <i class="fa-brands fa-whatsapp icon-whatsapp" title="WhatsApp"></i>
                        </div>
                    </div>
                </div>
                <p class="ngo-tag">${escTag}</p>
                <p class="ngo-desc">${escDesc}</p>
                ${ownerActions}
                <div class="ngo-card-actions">
                    <button class="ngo-btn ngo-donate-btn">Donate</button>
                    <button class="ngo-btn ngo-connect-btn">Connect</button>
                </div>
            `;

            card.querySelector(".icon-email").addEventListener("click", () => {
                window.open(`mailto:${encodeURIComponent(ngo.email)}`, '_blank');
            });
            card.querySelector(".icon-phone").addEventListener("click", () => {
                window.open(`tel:${encodeURIComponent(ngo.phone)}`, '_blank');
            });
            card.querySelector(".icon-whatsapp").addEventListener("click", () => {
                window.open(`https://wa.me/${encodeURIComponent(ngo.whatsapp)}`, '_blank');
            });

            card.querySelector(".ngo-donate-btn").addEventListener("click", () => {
                if (hasWebsite) {
                    window.open(`${ngo.website}/donate`, '_blank');
                } else {
                    window.open(`https://wa.me/${encodeURIComponent(ngo.whatsapp)}`, '_blank');
                }
            });

            card.querySelector(".ngo-connect-btn").addEventListener("click", () => {
                if (hasWebsite) {
                    window.open(`${ngo.website}/contact`, '_blank');
                } else {
                    window.open(`mailto:${encodeURIComponent(ngo.email)}`, '_blank');
                }
            });

            if (isOwner) {
                card.querySelector(".ngo-edit-btn").addEventListener("click", () => {
                    loadNgoIntoForm(ngo);
                });
                card.querySelector(".ngo-delete-btn").addEventListener("click", () => {
                    deleteNgo(ngo.ownerUid, ngo.id);
                });
            }

            ngoGrid.appendChild(card);
        });

        if (visibleCount >= filteredNgos.length) {
            loadMoreBtn.style.display = "none";
        } else {
            loadMoreBtn.style.display = "inline-block";
        }
    }

    // Filter Logic
    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        const locQuery = locationInput.value.toLowerCase().trim();
        const categoryFilter = sortSelect.value;
        const locFilter = locationSelect.value;

        filteredNgos = ngos.filter(ngo => {
            const matchesName = ngo.name.toLowerCase().includes(query);
            const matchesLocInput = ngo.location.toLowerCase().includes(locQuery);
            const matchesLocSelect = locFilter === "all" || ngo.location === locFilter;
            const matchesCategory = categoryFilter === "all" || ngo.tag === categoryFilter;
            
            return matchesName && matchesLocInput && matchesLocSelect && matchesCategory;
        });

        visibleCount = 10;
        renderNGOs();
    }

    // Real-time listeners
    searchInput.addEventListener("input", applyFilters);
    locationInput.addEventListener("input", applyFilters);
    sortSelect.addEventListener("change", applyFilters);
    locationSelect.addEventListener("change", applyFilters);

    searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        applyFilters();
    });
    filterBtn.addEventListener("click", (e) => {
        e.preventDefault();
        applyFilters();
    });

    loadMoreBtn.addEventListener("click", () => {
        visibleCount += 10;
        renderNGOs();
    });

    // File input text update
    regImage.addEventListener("change", function() {
        if (this.files && this.files[0]) {
            fileChosenText.textContent = this.files[0].name;
        } else {
            fileChosenText.textContent = "No file chosen";
        }
    });

    function loadNgoIntoForm(ngo) {
        editingNgoId = ngo.id;
        editingOwnerUid = ngo.ownerUid;
        editingNgoImage = ngo.image || null;

        document.getElementById("regNgoName").value = ngo.name || "";
        document.getElementById("regLocation").value = ngo.location || "";
        document.getElementById("regEmail").value = ngo.email || "";
        document.getElementById("regDonate").value = ngo.donate || ngo.website || ngo.email || "";
        document.getElementById("regPhone").value = ngo.phone || "";
        document.getElementById("regWhatsapp").value = ngo.whatsapp || "";
        document.getElementById("regWebsite").value = ngo.website || "";

        const formHeader = document.querySelector(".ngo-reg-box h2");
        if (formHeader) formHeader.textContent = "Edit Your NGO";
        const formSub = document.querySelector(".ngo-reg-box p");
        if (formSub) formSub.textContent = "Modify your NGO details below";

        const submitBtn = document.querySelector("#ngoRegForm button[type='submit']");
        if (submitBtn) submitBtn.textContent = "Save Changes";

        document.querySelector(".ngo-registration-section").scrollIntoView({ behavior: "smooth" });
    }

    function cancelNgoEdit() {
        editingNgoId = null;
        editingOwnerUid = null;
        editingNgoImage = null;

        regForm.reset();
        fileChosenText.textContent = "No file chosen";

        const formHeader = document.querySelector(".ngo-reg-box h2");
        if (formHeader) formHeader.textContent = "Register Your NGO";
        const formSub = document.querySelector(".ngo-reg-box p");
        if (formSub) formSub.textContent = "Add your NGO to connect with local donors!";

        const submitBtn = document.querySelector("#ngoRegForm button[type='submit']");
        if (submitBtn) submitBtn.textContent = "Register";
    }

    function deleteNgo(ownerUid, ngoId) {
        if (!confirm("Are you sure you want to delete this NGO permanently?")) return;
        remove(ref(db, `ngos/${ownerUid}/${ngoId}`))
            .then(() => {
                alert("NGO Successfully Deleted!");
            })
            .catch(err => {
                console.error("Failed to delete NGO:", err);
                alert("Failed to delete NGO: " + err.message);
            });
    }

    // Handle Form Submission
    regForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const uid = currentUser?.uid || window.currentUser?.uid;
        if (!uid) {
            alert("Please sign in to register or modify an NGO.");
            return;
        }

        if (editingNgoId && editingOwnerUid !== uid) {
            alert("You do not have permission to edit this NGO.");
            return;
        }

        const ngoData = {
            name: document.getElementById("regNgoName").value.trim(),
            location: document.getElementById("regLocation").value.trim(),
            email: document.getElementById("regEmail").value.trim(),
            donate: document.getElementById("regDonate").value.trim(),
            phone: document.getElementById("regPhone").value.trim(),
            whatsapp: document.getElementById("regWhatsapp").value.trim(),
            website: document.getElementById("regWebsite").value.trim(),
            tag: editingNgoId ? "Active" : "Recently Registered NGO",
            desc: editingNgoId ? "Updated NGO profile on the Save Nature platform." : "A newly registered NGO on the Save Nature platform ready to connect with donors.",
            dateAdded: Date.now()
        };

        if (editingNgoId) {
            try {
                const snap = await get(ref(db, `ngos/${editingOwnerUid}/${editingNgoId}`));
                const existing = snap.val() || {};
                ngoData.dateAdded = existing.dateAdded || Date.now();
                ngoData.tag = existing.tag || "Active";
                ngoData.desc = existing.desc || "Updated NGO profile.";
            } catch (_) {}
        }

        const file = regImage.files[0];

        const saveNgoData = (imageUrl) => {
            if (imageUrl) {
                ngoData.image = imageUrl;
            } else if (editingNgoId) {
                ngoData.image = editingNgoImage || "https://files.catbox.moe/aag4y5.jpg";
            } else {
                ngoData.image = "https://files.catbox.moe/aag4y5.jpg";
            }

            if (editingNgoId) {
                set(ref(db, `ngos/${editingOwnerUid}/${editingNgoId}`), ngoData)
                    .then(() => {
                        afterRegistration();
                    })
                    .catch(err => {
                        console.error("Update NGO failed:", err);
                        alert("Update failed: " + err.message);
                    });
            } else {
                const newRef = push(ref(db, `ngos/${uid}`));
                set(newRef, ngoData)
                    .then(() => {
                        afterRegistration();
                    })
                    .catch(err => {
                        console.error("Register NGO failed:", err);
                        alert("Registration failed: " + err.message);
                    });
            }
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                saveNgoData(ev.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            saveNgoData(null);
        }
    });

    function afterRegistration() {
        populateDropdowns();
        applyFilters();
        const wasEditing = !!editingNgoId;
        cancelNgoEdit();
        alert(wasEditing ? "NGO Successfully Updated!" : "NGO Successfully Registered!");
        if (!wasEditing && window.updateImpact) window.updateImpact(5, 0, 0);
    }

    document.getElementById("regCancelBtn").addEventListener("click", () => {
        cancelNgoEdit();
    });

    // Initialize
    populateDropdowns();
    renderNGOs();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNgoPage);
} else {
    initNgoPage();
}
