
import os
import sys

# Mapping for mangled characters
# From my analysis: B = charCode - 0x0E00 + 0xA0
# This was for the Thai block.
# For others, it's Win1252.

def fix_mangled_string(s):
    try:
        bytes_list = []
        for char in s:
            code = ord(char)
            if 0x0E01 <= code <= 0x0E5B:
                # Thai character to byte
                bytes_list.append(code - 0x0E00 + 0xA0)
            elif code < 0x80:
                bytes_list.append(code)
            elif code == 0x20AC: # €
                bytes_list.append(0x80)
            elif code == 0x201A: # , (low)
                bytes_list.append(0x82)
            elif code == 0x0192: # f (italic)
                bytes_list.append(0x83)
            elif code == 0x201E:
                bytes_list.append(0x84)
            elif code == 0x2026: # ...
                bytes_list.append(0x85)
            elif code == 0x2020:
                bytes_list.append(0x86)
            elif code == 0x2021:
                bytes_list.append(0x87)
            elif code == 0x02C6:
                bytes_list.append(0x88)
            elif code == 0x2030:
                bytes_list.append(0x89)
            elif code == 0x0160:
                bytes_list.append(0x8A)
            elif code == 0x2039:
                bytes_list.append(0x8B)
            elif code == 0x0160: # S
                bytes_list.append(0x8C)
            elif code == 0x0152: # OE
                bytes_list.append(0x8C)
            # Add more as needed, but let's try a fallback
            elif code >= 0xA0 and code <= 0xFF:
                bytes_list.append(code)
            else:
                # If we don't know, we can't do much, but maybe it's just a raw byte
                bytes_list.append(code & 0xFF)
        
        return bytes(bytes_list).decode('utf-8')
    except Exception as e:
        return s

files = [
    'd:/gametopup/gametopup frontend/src/pages/PremiumApp.tsx',
    'd:/gametopup/gametopup frontend/src/pages/CashCard.tsx',
    'd:/gametopup/gametopup frontend/src/pages/AdminDashboard.tsx',
    'd:/gametopup/gametopup frontend/src/pages/TopUp.tsx'
]

for file_path in files:
    if not os.path.exists(file_path):
        continue
    print(f"Fixing {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to find strings and fix them
    # But mangling might be anywhere.
    # Actually, we can just process the whole file if it was mangled.
    
    fixed_content = fix_mangled_string(content)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    print(f"Done fixing {file_path}")

# Run a test
print("Test 1: เธฟ ->", fix_mangled_string("เธฟ"))
print("Test 2: เน€เธ เธดเธ”เธ‚เน‰เธญเธœเธดเธ”เธžเธฅเธฒเธ” ->", fix_mangled_string("เน€เธ เธดเธ”เธ‚เน‰เธญเธœเธดเธ”เธžเธฅเธฒเธ”"))
