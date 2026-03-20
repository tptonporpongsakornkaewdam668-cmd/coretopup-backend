
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
    # Only fix if we see "Thai-mangled" patterns like "เน€เธ"
    if "เน€เธ" not in content and "เธฟ" not in content:
        return content, False # Already seems clean
    
    bytes_list = bytearray()
    for char in content:
        bytes_list.append(char_to_byte(char))
    
    try:
        return bytes_list.decode('utf-8'), True
    except:
        return bytes_list.decode('utf-8', errors='replace'), True

root_dir = "d:/gametopup/gametopup frontend/src"
for root, dirs, files in os.walk(root_dir):
    for f in files:
        if f.endswith(('.tsx', '.ts', '.js', '.jsx')):
            f_path = os.path.join(root, f)
            try:
                with open(f_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                fixed, changed = fix_content(content)
                if changed:
                    print(f"Restored Thai in: {f_path}")
                    with open(f_path, 'w', encoding='utf-8') as file:
                        file.write(fixed)
            except Exception as e:
                print(f"Skipping {f_path}: {e}")
