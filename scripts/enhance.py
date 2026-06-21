import os
import re

files = ["index.html", "Ecofriendly.html", "donate.html", "contact.html", "About.html", "NGO.html", "renew.html"]

for f in files:
    path = os.path.join(r"c:\Users\ok\OneDrive\Desktop\Eco Parv", f)
    with open(path, "r", encoding="utf-8") as file:
        content = file.read()
    
    # 1. Add loading="lazy" to all img tags that don't have it
    content = re.sub(r'<img (?![^>]*loading="lazy")', r'<img loading="lazy" ', content)
    
    # 2. Add aria-label to chatFab
    content = re.sub(r'(<button[^>]*id="chatFab"[^>]*)>', r'\1 aria-label="Toggle Chat">', content)
    
    # 3. Add defer to script.js, ngo.js, donor-dashboard.js, ngo-dashboard.js
    content = re.sub(r'<script src="script\.js"></script>', r'<script src="script.js" defer></script>', content)
    content = re.sub(r'<script src="ngo\.js"></script>', r'<script src="ngo.js" defer></script>', content)
    content = re.sub(r'<script src="donor-dashboard\.js"></script>', r'<script src="donor-dashboard.js" defer></script>', content)
    content = re.sub(r'<script src="ngo-dashboard\.js"></script>', r'<script src="ngo-dashboard.js" defer></script>', content)

    # 4. Inject utils.js and chatbot.js before auth.js
    if 'src="utils.js"' not in content:
        content = content.replace(
            '<script type="module" src="auth.js"></script>',
            '<script src="utils.js"></script>\n  <script src="chatbot.js" defer></script>\n  <script type="module" src="auth.js"></script>'
        )

    # 5. Add aria labels to social icons if any exist in footers (they don't exist in the provided index snippet but just in case)
    # E.g. <i class="fa-brands fa-whatsapp"></i>
    content = re.sub(r'(<i[^>]*class="[^"]*fa-brands fa-(whatsapp|facebook|twitter|instagram)[^"]*"[^>]*)>', r'\1 aria-label="\2">', content)

    with open(path, "w", encoding="utf-8") as file:
        file.write(content)
