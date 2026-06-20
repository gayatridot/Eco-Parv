# Eco Parv - Save Nature 🌱

Welcome to **Eco Parv**, a comprehensive ecosystem designed to bridge the gap between unused resources and those in need while promoting a sustainable, eco-friendly lifestyle.

## 1. Chosen Vertical
**Sustainability & Community Welfare**  
This project tackles the dual challenge of environmental waste and social inequality. By creating a unified platform, Eco Parv connects donors with NGOs, promotes recycling through local startups, encourages the purchase of eco-friendly products, and mobilizes volunteer teams for community action. 

## 2. Approach and Logic
Our approach is centered on **Practical Action and Community Connectivity**.  
Instead of building isolated features, the platform integrates multiple aspects of sustainable living:
- **Donation Portal:** Donors can list surplus food, clothes, or electronics. Using the OpenStreetMap Geolocation API, we capture the donor's coordinates and convert them into readable addresses for easy pickup by nearby NGOs.
- **Volunteer & NGO Connect:** Users can register their volunteer teams dynamically. This data is saved instantly using browser local storage, allowing real-time searching by purpose, name, or location.
- **Renew & Reuse:** We logically route users to existing real-world recycling startups (e.g., E-waste to Attero, clothing to Goonj) to ensure donations are professionally renewed rather than discarded.
- **Smart Assistant:** A built-in dynamic logic-based assistant helps guide users through the platform, answering common questions and directing them to the right pages based on their intent.
- **Eco-Friendly Products:** A Google Form allows users to suggest sustainable products. Submissions are auto-rendered into the Eco Products section with a **Buy Now** button that redirects to Meesho search.

## 3. How the Solution Works
The application is a lightweight, frontend-driven web application built with HTML, CSS, and JavaScript. 
- **Zero-Friction Contact:** Forms utilize `mailto:` links to securely pass data directly to the user's default email client, requiring zero backend authentication.
- **Dynamic Dashboards:** The donation dashboards and volunteer lists dynamically render data using JavaScript, allowing seamless filtering and searching without page reloads.
- **Responsive UI:** The interface uses custom CSS to provide a clean, modern, and accessible experience across mobile and desktop devices.
- **Smart Eco Assistant:** A floating chat widget built with JavaScript assesses user inputs using keyword-matching logic to provide instant navigational help and answers.
- **Eco Products Integration:** Google Form → Google Sheet → Apps Script JSON → frontend rendering with Meesho redirect.

## 4. Assumptions Made
During the development of this prototype, the following assumptions were made:
- **Client-Side Storage:** We assume that for this hackathon prototype, persisting data via browser `localStorage` is sufficient to demonstrate the functionality of the Volunteer Registration and Donation listing features. 
- **Email Client Availability:** We assume the user has a default email client configured on their device for the contact form functionality.
- **Geolocation Permissions:** We assume the user will grant location permissions to demonstrate the automated address resolution feature on the donation page.
- **Static Assets:** Placeholder images and dummy data are used to demonstrate how the platform looks when fully populated with active users.

---

## 📑 Current Features
- **Category-wise Donation Forms** (Clothes, Shoes, Books, Toys, Food, Eco-Items).  
- **Simple Listing** of donations without login/ownership logic.  
- **NGO Connect (Basic)** – donors can manually inform NGOs.  
- **Volunteer Registration** – teams can be added and searched dynamically.  
- **Renew & Reuse Routing** – links to real recycling startups.  
- **Smart Assistant** – floating widget for navigation and FAQs.  
- **Eco-Friendly Products Section** – community-suggested items with Meesho “Buy Now” redirect.

---

## 🚀 Future Enhancements
- **Authentication & Ownership:** Firebase Authentication for secure sign-in / sign-up.  
- **Donor Dashboard:** Category-wise view of personal donations with edit/delete/inform NGO actions.  
- **NGO Dashboard:** Category-wise view of informed donations with accept/reject actions.  
- **Real-Time Updates:** Firestore integration for live status changes (Pending → Informed → Accepted).  

---

## 🎯 Impact
- Encourages **reuse and redistribution** instead of waste.  
- Provides **personalized eco-insights** to motivate individuals.  
- Builds a scalable foundation for **real-time dashboards** and **community collaboration**.  
- Demonstrates **small steps → big impact** in reducing carbon footprint.  

---

## 📽️ Demo Link
👉 [Live Demo](https://github.com/gayatridot/Eco-Parv)

---

## 🖼️ Screenshots
*(Add screenshots of donation form, NGO connect page, volunteer dashboard, eco-friendly products section, and smart assistant here.)*

---

✨ **Pitch Caption**  
**_"Small steps, big impact 🌍 Track your footprint, donate smarter, and see change happen."_**

---

*Built with ❤️ for a greener future.*
