import os
import re

files = ["index.html", "Ecofriendly.html", "donate.html", "contact.html", "About.html", "NGO.html", "renew.html"]

for f in files:
    path = os.path.join(r"c:\Users\ok\OneDrive\Desktop\Eco Parv", f)
    with open(path, "r", encoding="utf-8") as file:
        content = file.read()
    
    # fix double aria-labels
    content = content.replace('aria-label="Toggle Chat" aria-label="Toggle Chat"', 'aria-label="Toggle Chat"')
    
    with open(path, "w", encoding="utf-8") as file:
        file.write(content)
