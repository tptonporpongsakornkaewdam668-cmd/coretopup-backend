
import os

files = [
    'd:/gametopup/gametopup frontend/src/pages/PremiumApp.tsx',
    'd:/gametopup/gametopup frontend/src/pages/CashCard.tsx',
    'd:/gametopup/gametopup frontend/src/pages/AdminDashboard.tsx',
    'd:/gametopup/gametopup frontend/src/pages/Games.tsx',
    'd:/gametopup/gametopup frontend/src/pages/TopUp.tsx'
]

for f_path in files:
    if not os.path.exists(f_path): continue
    with open(f_path, 'rb') as f:
        data = f.read()
    
    # Remove BOM if present (EF BB BF)
    if data.startswith(b'\xef\xbb\xbf'):
        data = data[3:]
    
    # Remove Null bytes or other garbage at start
    while data and data[0] in [0, 1, 2, 3, 4, 5, 255]:
        data = data[1:]
    
    # Also handle some common replacement characters at start
    # ef bf bd is the replacement char
    if data.startswith(b'\xef\xbf\xbd'):
         # If the first char is corrupted, we skip it
         data = data[3:]

    # Write back as clean UTF-8
    with open(f_path, 'wb') as f:
        f.write(data)
    print(f"Cleaned bytes in {f_path}")
