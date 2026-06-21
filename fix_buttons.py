import os
import re

files = ["renew.html", "NGO.html", "index.html", "Ecofriendly.html", "donate.html", "contact.html", "About.html"]

for f in files:
    path = os.path.join(r"c:\Users\ok\OneDrive\Desktop\Eco Parv", f)
    with open(path, "r", encoding="utf-8") as file:
        content = file.read()
    
    content = re.sub(r'<button class="orange">\s*<a href="([^"]+)"[^>]*>([^<]+)</a>\s*</button>', r'<a href="\1" class="orange-btn">\2</a>', content)
    content = re.sub(r'<button class="green">\s*<a href="([^"]+)"[^>]*>([^<]+)</a>\s*</button>', r'<a href="\1" class="green-btn">\2</a>', content)
    
    with open(path, "w", encoding="utf-8") as file:
        file.write(content)
