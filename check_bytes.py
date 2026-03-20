
import os

with open("d:/gametopup/gametopup frontend/src/pages/PremiumApp.tsx", 'rb') as f:
    content = f.read()

# Look for "title: " (74 69 74 6c 65 3a 20 22)
target = b'title: "'
index = content.find(target)
if index != -1:
    print(f"Found title: \" at index {index}")
    # Show the following 50 bytes in hex
    slice = content[index:index+100]
    print(slice.hex())
    try:
        print(slice.decode('utf-8'))
    except:
        print("Invalid UTF-8")
