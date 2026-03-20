
import os

# Full mapping of Unicode char -> Byte value (Win874/CP1252 mixture)
def char_to_byte(c):
    code = ord(c)
    if code < 0x80: return code
    # Thai
    if 0x0E01 <= code <= 0x0E5B:
        return code - 0x0E00 + 0xA0
    # CP1252
    cp1252 = {
        0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
        0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91,
        0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98,
        0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
    }
    if code in cp1252: return cp1252[code]
    return code & 0xFF

def fix_content(content):
    bytes_list = bytearray()
    for char in content:
        bytes_list.append(char_to_byte(char))
    
    # Now try to decode as UTF-8
    try:
        return bytes_list.decode('utf-8')
    except Exception as e:
        # If it fails, maybe some bytes are still wrong, we'll return original or try to fix
        return bytes_list.decode('utf8', errors='replace')

files = [
    'd:/gametopup/gametopup frontend/src/pages/PremiumApp.tsx',
    'd:/gametopup/gametopup frontend/src/pages/CashCard.tsx',
    'd:/gametopup/gametopup frontend/src/pages/AdminDashboard.tsx',
    'd:/gametopup/gametopup frontend/src/pages/TopUp.tsx'
]

for f_path in files:
    if not os.path.exists(f_path): continue
    print(f"Cleaning {f_path}")
    with open(f_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fixed = fix_content(content)
    with open(f_path, 'w', encoding='utf-8') as f:
        f.write(fixed)
