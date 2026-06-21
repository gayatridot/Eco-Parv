// ==========================
// UTILS
// ==========================

/**
 * Escapes HTML characters in a string to prevent XSS.
 */
function escapeHTML(str) {
    if (!str) return "";
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Alternative string sanitizer using DOM textContent.
 */
function sanitizeInput(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Make sure it's available globally
window.escapeHTML = escapeHTML;
window.sanitizeInput = sanitizeInput;
