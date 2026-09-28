"""Regenerate explanatory crops, preserving the indexed source images.

Run with Python + Pillow. Coordinates are source-image pixels, not CSS tokens.
"""
from pathlib import Path
import json
import textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / 'assets' / 'references'
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'


def font(size):
    try:
        return ImageFont.truetype(FONT, size)
    except OSError:
        return ImageFont.load_default(size=size)


catalog_path = ROOT / 'catalog.json'
catalog = json.loads(catalog_path.read_text())
STUDIES = [{
    'id': item['id'], 'file': item['file'], 'crop': item['cropSourcePixels'],
    'title': item['title'],
    'source': item.get('sourceLabel', 'Official documentation / captured build unknown'),
    'boxes': [(note['sourceBox'], note['label'], note['observation']) for note in item['annotations']],
} for item in catalog]
for study in STUDIES:
    source = Image.open(ROOT / study['file']).convert('RGB')
    crop = source.crop(study['crop'])
    scale = min(1, 760 / crop.width)
    crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
    left, top = 32, 88
    note_x = left + crop.width + 40
    width = note_x + 390
    height = max(top + crop.height + 64, 510)
    board = Image.new('RGB', (width, height), '#151619')
    board.paste(crop, (left, top))
    draw = ImageDraw.Draw(board)
    draw.text((32, 26), study['title'], font=font(25), fill='#eeeeef')
    source_label = study.get('source', 'Official Claude Code documentation')
    draw.text((32, 59), source_label + ' / annotated study', font=font(13), fill='#b7b8c0')
    for number, (box, title, detail) in enumerate(study['boxes'], 1):
        x0, y0, x1, y1 = box
        x0 = left + round((x0 - study['crop'][0]) * scale)
        x1 = left + round((x1 - study['crop'][0]) * scale)
        y0 = top + round((y0 - study['crop'][1]) * scale)
        y1 = top + round((y1 - study['crop'][1]) * scale)
        draw.rounded_rectangle((x0, y0, x1, y1), radius=5, outline='#c1deef', width=2)
        draw.rounded_rectangle((x0 - 10, y0 - 12, x0 + 14, y0 + 12), radius=5, fill='#e4eff5')
        draw.text((x0 - 4, y0 - 9), str(number), font=font(17), fill='#17191c')
        ny = 104 + (number - 1) * 116
        draw.text((note_x, ny), f'{number}  {title}', font=font(18), fill='#eeeeef')
        draw.multiline_text((note_x, ny + 32), '\n'.join(textwrap.wrap(detail, 41)), font=font(16), fill='#b7b8c0', spacing=5)
    draw.text((32, height - 30), 'Study relationships, not brand colors or screenshot pixel dimensions. Indexed source preserved beside this file.', font=font(13), fill='#b7b8c0')
    output = study['id'] + '-annotated.png'
    board.save(ROOT / output)
    for item in catalog:
        if item['id'] == study['id']:
            item['annotated'] = output
            item['cropSourcePixels'] = study['crop']
            item['annotations'] = [{'label': title, 'observation': detail, 'sourceBox': list(box)} for box, title, detail in study['boxes']]
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
