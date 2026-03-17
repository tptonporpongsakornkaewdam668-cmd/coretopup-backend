import json

with open(r"d:\gametopup\gametopup backend\list api wepay.txt", "r", encoding="utf-8") as f:
    data = json.load(f)

results = {}
for section_key, section_val in data.get("data", {}).items():
    if isinstance(section_val, list):
        for game in section_val:
            if isinstance(game, dict):
                gameservers = game.get("gameservers", [])
                if gameservers and len(gameservers) > 0:
                    cid = game.get("company_id", "")
                    cname = game.get("company_name", "")
                    servers = [{"name": s.get("name", ""), "value": s.get("value", "")} for s in gameservers]
                    results[cid] = {
                        "company_name": cname,
                        "servers": servers
                    }

# Output as TypeScript object
print("// ==============================================")
print("// เกมที่ต้องเลือก Server — ข้อมูลจาก wePAY API")
print("// ==============================================")
print()
print("const GAME_SERVER_MAP: Record<string, { name: string; value: string }[]> = {")
for cid, info in sorted(results.items()):
    print(f'  // {info["company_name"]}')
    print(f'  "{cid}": [')
    for s in info["servers"]:
        print(f'    {{ name: "{s["name"]}", value: "{s["value"]}" }},')
    print(f'  ],')
print("};")
print()
print(f"// รวม {len(results)} เกม ที่ต้องเลือก Server")
