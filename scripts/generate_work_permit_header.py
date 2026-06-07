from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('public/images', exist_ok=True)
W, H = 780, 120
img = Image.new('RGB', (W, H), (241, 236, 226))
d = ImageDraw.Draw(img)
for x in range(W):
    r = int(190 + 45 * (x / W))
    g = int(22 + 24 * ((W - x) / W))
    b = int(32 + 70 * (x / W))
    d.line([(x, 0), (x, H)], fill=(r, int(190 + 18 * ((W - x) / W)), b))
for i in range(6):
    y = int(H * (0.08 + i * 0.14))
    d.line([(0, y), (W, y)], fill=(255, 255, 255, 40))
try:
    font = ImageFont.truetype('arialbd.ttf', 48)
except Exception:
    font = ImageFont.load_default()
text = 'CANADA'
try:
    bbox = d.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
except AttributeError:
    w, h = font.getsize(text)
d.text(((W - w) / 2, (H - h) / 2 - 4), text, font=font, fill=(255, 255, 255))

accent = Image.new('RGBA', (260, 120), (255, 255, 255, 0))
d2 = ImageDraw.Draw(accent)
for i in range(0, 260, 10):
    d2.line([(i, 0), (0, 120 - i)], fill=(255, 255, 255, 40), width=2)
img.paste(accent, (10, 10), accent)
img.save('public/images/work-permit-header.png')
print('created public/images/work-permit-header.png')
