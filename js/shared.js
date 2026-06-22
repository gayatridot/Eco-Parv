// js/shared.js
// Load header, sidebar, footer so you edit once, update everywhere

function injectSharedLayout() {
  // 1. SIDEBAR HTML
  const sidebarHTML = `
    <div class="sidebar">
      <a href="/index.html">🏠Home</a>
      <a href="/pages/donate.html">🤝Donors</a>
      <a href="/pages/renew.html">♻️Renew</a>
      <a href="/pages/Ecofriendly.html">🌱Ecofriendly Items</a>
      <a href="/pages/NGO.html">🌐NGO connect</a>
      <a href="/pages/About.html">ℹ️About</a>
      <a href="/pages/contact.html">📞Contact</a>
    </div>
  `;

  // 2. HEADER HTML
  const headerHTML = `
    <header>
      <div class="logo">❤ Eco Parv</div>
      <nav>
        <a href="/index.html">Home</a>
        <a href="/pages/Ecofriendly.html">Ecofriendly Items</a>
        <a href="/pages/donate.html">Donate</a>
        <a href="/pages/renew.html">Renew</a>
        <a href="/pages/About.html">About Us</a>
        <a href="/pages/donate.html" class="orange-btn">Start Donating</a>
      </nav>
    </header>
  `;

  // 3. FOOTER HTML
  const footerHTML = `
    <footer>
      <div><a href="/pages/donate.html">Donate</a></div>
      <div><a href="/pages/About.html">Volunteer</a></div>
      <div><a href="/pages/About.html">FAQ</a></div>
      <div><a href="/pages/contact.html">Privacy Policy</a></div>
    </footer>
  `;

  // INJECT INTO PAGE
  const sidebarDiv = document.querySelector('.sidebar');
  const headerDiv = document.querySelector('.header');
  const footerDiv = document.querySelector('.footer');

  if (sidebarDiv) sidebarDiv.innerHTML = sidebarHTML;
  if (headerDiv) headerDiv.innerHTML = headerHTML;
  if (footerDiv) footerDiv.innerHTML = footerHTML;
}

// Run as soon as DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSharedLayout);
} else {
  injectSharedLayout();
}