import json

with open(r'd:\gametopup\gametopup backend\list api wepay.txt', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open(r'd:\gametopup\gametopup backend\game_analysis.txt', 'w', encoding='utf-8') as out:
    if 'gtopup' in data['data']:
        out.write(f"Total Games in gtopup: {len(data['data']['gtopup'])}\n")
        for game in data['data']['gtopup']:
            out.write(f"{game['company_name']} ({game['company_id']})\n")
