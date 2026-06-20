const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxhx9KZzppvSWySuLL-QP08crl3TrM0FmLeL3Lw5-vy_rghIywc4EXH-pOFAZR9p9US/exec";
document.addEventListener("DOMContentLoaded", () => {

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

    const categoryTitles = {
        food: "Available Food Nearby",
        clothes: "Available Clothes Nearby",
        books: "Available Books Nearby",
        school_bags: "Available School Bags Nearby",
        shoes: "Available Shoes Nearby",
        toys: "Available Toys Nearby",
        bicycles: "Available Bicycles Nearby"
    };

    // ==========================
    // OPEN POPUP
    // ==========================
    window.openPopup = function (category) {

        currentCategory = category;
        if (dashboardTitle) {
            dashboardTitle.innerText =
                categoryTitles[category];

            popup.classList.remove("hidden");

            switch (category) {

                case "food":

                    popupTitle.innerText = "Donate Surplus Food";

                    formFields.innerHTML = `
        <div class="form-group">
            <label>🍲 Food Item Name</label>
            <input type="text" id="itemName"
            placeholder="Rice, Dal, Roti"
            required>
        </div>

        <div class="form-group">
            <label>🍽 Quantity</label>
            <input type="text"
            id="quantity"
            placeholder="For 50 people">
        </div>

        <div class="form-group">
            <label>⏰ Freshness Duration (Hours)</label>
            <input type="number"
            id="expiryHours"
            min="1"
            max="24"
            placeholder="e.g. 4"
            required>
        </div>

        <div class="form-group">
            <label>🏨 Restaurant / Donor Name</label>
            <input type="text"
            id="donorName"
            placeholder="Taj Hotel"
            required>
        </div>
        `;
                    break;



                case "clothes":

                    popupTitle.innerText = "Donate Unwanted Clothes";

                    formFields.innerHTML = `
        <div class="form-group">
            <label>👕 Clothing Type</label>
            <input type="text"
            id="itemName"
            placeholder="Shirt, Saree"
            required>
        </div>

        <div class="form-group">
            <label>📏 Size</label>
            <input type="text"
            placeholder="M, L, XL">
        </div>

        <div class="form-group">
            <label>✨ Condition</label>
            <select>
                <option>Like New</option>
                <option>Good</option>
                <option>Usable</option>
            </select>
        </div>

        <div class="form-group">
            <label>👤 Donor Name</label>
            <input type="text"
            id="donorName"
            placeholder="Your Name"
            required>
        </div>
        `;
                    break;



                case "books":

                    popupTitle.innerText = "Donate Unwanted Books";

                    formFields.innerHTML = `
        <div class="form-group">
            <label>📚 Book Title</label>
            <input type="text"
            id="itemName"
            placeholder="Mathematics XII"
            required>
        </div>

        <div class="form-group">
            <label>📖 Category</label>
            <select>
                <option>School</option>
                <option>College</option>
                <option>Story</option>
                <option>Other</option>
            </select>
        </div>

        <div class="form-group">
            <label>👤 Donor Name</label>
            <input type="text"
            id="donorName"
            placeholder="Your Name"
            required>
        </div>
        `;
                    break;



                case "school_bags":

                    popupTitle.innerText = "Donate School Bags";

                    formFields.innerHTML = `
        <div class="form-group">
            <label>🎒 Bag Type</label>
            <input type="text"
            id="itemName"
            placeholder="School Backpack"
            required>
        </div>

        <div class="form-group">
            <label>✨ Condition</label>
            <select>
                <option>Like New</option>
                <option>Good</option>
                <option>Usable</option>
            </select>
        </div>

        <div class="form-group">
            <label>👤 Donor Name</label>
            <input type="text"
            id="donorName"
            placeholder="Your Name"
            required>
        </div>
        `;
                    break;



                case "shoes":

                    popupTitle.innerText = "Donate Nonfit Shoes";

                    formFields.innerHTML = `
        <div class="form-group">
            <label>👟 Shoe Type</label>
            <input type="text"
            id="itemName"
            placeholder="Sports Shoes"
            required>
        </div>

        <div class="form-group">
            <label>📏 Size</label>
            <input type="text"
            placeholder="7, 8, 9">
        </div>

        <div class="form-group">
            <label>✨ Condition</label>
            <select>
                <option>Like New</option>
                <option>Good</option>
                <option>Usable</option>
            </select>
        </div>

        <div class="form-group">
            <label>👤 Donor Name</label>
            <input type="text"
            id="donorName"
            required>
        </div>
        `;
                    break;



                case "toys":

                    popupTitle.innerText = "Donate Unwanted Toys";

                    formFields.innerHTML = `
        <div class="form-group">
            <label>🧸 Toy Name</label>
            <input type="text"
            id="itemName"
            placeholder="Remote Car"
            required>
        </div>

        <div class="form-group">
            <label>👶 Age Group</label>
            <input type="text"
            placeholder="3-5 Years">
        </div>

        <div class="form-group">
            <label>✨ Condition</label>
            <select>
                <option>Like New</option>
                <option>Good</option>
                <option>Usable</option>
            </select>
        </div>

        <div class="form-group">
            <label>👤 Donor Name</label>
            <input type="text"
            id="donorName"
            required>
        </div>
        `;
                    break;



                case "bicycles":

                    popupTitle.innerText = "Donate Unwanted Bicycle";

                    formFields.innerHTML = `
        <div class="form-group">
            <label>🚲 Bicycle Model</label>
            <input type="text"
            id="itemName"
            placeholder="Hero Sprint"
            required>
        </div>

        <div class="form-group">
            <label>⚙ Type</label>
            <input type="text"
            placeholder="Mountain Bike">
        </div>

        <div class="form-group">
            <label>✨ Condition</label>
            <select>
                <option>Like New</option>
                <option>Good</option>
                <option>Usable</option>
            </select>
        </div>

        <div class="form-group">
            <label>👤 Donor Name</label>
            <input type="text"
            id="donorName"
            required>
        </div>
        `;
                    break;
            }

            updateDashboard();
        }
    };



    // ==========================
    // CLOSE POPUP
    // ==========================
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
                        // Fetch readable address from coordinates
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

            const itemName =
                document.getElementById("itemName").value;

            const donorName =
                document.getElementById("donorName").value;

            let expiryHours = 48;

            if (currentCategory === "food") {

                expiryHours =
                    parseInt(
                        document.getElementById("expiryHours").value
                    );
            }

            const expiryTime = new Date();

            expiryTime.setHours(
                expiryTime.getHours() + expiryHours
            );

            donations.unshift({

                id: Date.now(),

                category: currentCategory,

                item: itemName,

                donor: donorName,

                coords:
                    locationCoords.value || "28.6139,77.2090",

                expiryTime,

                addedTime: new Date()

            });

            updateDashboard();

            donationForm.reset();

            locationStatus.innerHTML = "";

            closePopup();

        });

    }

    // ==========================
    // DASHBOARD
    // ==========================
    function updateDashboard() {

        foodList.innerHTML = "";

        const now = new Date();

        donations = donations.filter(
            d => new Date(d.expiryTime) > now
        );

        const filteredDonations =
            donations.filter(
                d => d.category === currentCategory
            );

        if (filteredDonations.length === 0) {

            noFoodMessage.style.display = "block";

            return;
        }

        noFoodMessage.style.display = "none";

        filteredDonations.forEach(donation => {

            let emoji = "🎁";

            switch (donation.category) {

                case "food":
                    emoji = "🍲";
                    break;

                case "clothes":
                    emoji = "👕";
                    break;

                case "books":
                    emoji = "📚";
                    break;

                case "school_bags":
                    emoji = "🎒";
                    break;

                case "shoes":
                    emoji = "👟";
                    break;

                case "toys":
                    emoji = "🧸";
                    break;

                case "bicycles":
                    emoji = "🚲";
                    break;
            }

            let timeText = "";

            if (donation.category === "food") {

                const hoursLeft = Math.ceil(
                    (donation.expiryTime - now) /
                    (1000 * 60 * 60)
                );

                timeText = `
                <p>
                    <strong>Fresh for:</strong>
                    ${hoursLeft} hour(s)
                </p>`;
            }

            const card = document.createElement("div");

            card.className = "food-card";

            card.innerHTML = `

            <span class="badge badge-fresh">
                ${donation.category.toUpperCase()}
            </span>

            <h3>${emoji} ${donation.item}</h3>

            <p>
                <strong>From:</strong>
                ${donation.donor}
            </p>

            <p>
                <strong>Posted:</strong>
                ${donation.addedTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })}
            </p>

            ${timeText}

            <div class="action-links">

                <a
                    href="https://www.google.com/maps/search/?api=1&query=${donation.coords}"
                    target="_blank"
                    class="action-btn"
                >
                🗺 View Map
                </a>

                <a
                    href="https://wa.me/?text=Hi, I am interested in collecting ${donation.item}"
                    target="_blank"
                    class="action-btn"
                    style="color:#25D366"
                >
                💬 Contact
                </a>

            </div>
            `;

            foodList.appendChild(card);

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
if(loadMoreBtn) {
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


if(searchInput) {
    searchInput.addEventListener(
        "input",
        filterProducts
    );
}

if(categoryFilter) {
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

window.openEcoModal = function(itemName, desc) {
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
window.buyNow = function(event, itemName) {
    event.stopPropagation();
    const query = encodeURIComponent(itemName);
    window.open(`https://www.meesho.com/search?q=${query}`, "_blank");
};

// =================
// START
// =================
if(document.getElementById("productsContainer")) {
    loadProducts();
}

// ==========================
// SMART ASSISTANT LOGIC
// ==========================
const chatWidget = document.getElementById('chatWidget');
const chatIcon = document.getElementById('chatIcon');
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');

window.toggleChat = function(e) {
    if(e) e.stopPropagation();
    if(!chatWidget) return;
    chatWidget.classList.toggle('collapsed');
};

// Close when clicking outside
document.addEventListener('click', function(e) {
    if(chatWidget && !chatWidget.classList.contains('collapsed')) {
        const chatFab = document.getElementById('chatFab');
        // If click is not inside widget and not on fab
        if(!chatWidget.contains(e.target) && (!chatFab || !chatFab.contains(e.target))) {
            chatWidget.classList.add('collapsed');
        }
    }
});

// Start collapsed by default
if(chatWidget) {
    chatWidget.classList.add('collapsed');
}

window.handleChat = function(e) {
    if (e.key === 'Enter') sendChat();
};

window.sendChat = function() {
    if(!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;
    
    // Add user message
    addMsg(text, 'user-msg');
    chatInput.value = '';

    // Smart Logic Reply
    setTimeout(() => {
        const lower = text.toLowerCase();
        let reply = "I'm not sure about that. Try asking about 'donate', 'volunteer', 'eco-friendly', or 'contact'.";
        
        if(lower.includes('donate') || lower.includes('food') || lower.includes('clothes')) {
            reply = "You can donate food, clothes, and more on our Donation page! <a href='donate.html' style='color:#115a25; font-weight:bold;'>Go to Donate</a>";
        } else if(lower.includes('volunteer') || lower.includes('ngo') || lower.includes('team')) {
            reply = "Join forces! Register your volunteer team or NGO on our About page. <a href='About.html#register-section' style='color:#115a25; font-weight:bold;'>Register Here</a>";
        } else if(lower.includes('eco') || lower.includes('buy') || lower.includes('shop')) {
            reply = "Check out our Ecofriendly Items section to buy sustainable products! <a href='Ecofriendly.html' style='color:#115a25; font-weight:bold;'>Shop Eco</a>";
        } else if(lower.includes('renew') || lower.includes('recycle')) {
            reply = "We partner with startups to recycle waste. See how we do it on the Renew page. <a href='renew.html' style='color:#115a25; font-weight:bold;'>Learn More</a>";
        } else if(lower.includes('hello') || lower.includes('hi')) {
            reply = "Hello! How can I help you save nature today?";
        }

        addMsg(reply, 'bot-msg');
    }, 500);
};

function addMsg(text, className) {
    if(!chatBody) return;
    const div = document.createElement('div');
    div.className = className;
    div.innerHTML = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}