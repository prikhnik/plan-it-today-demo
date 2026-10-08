#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Converts docs/design/assets PNG into WebP for the mini app. Requires Pillow.

Usage: python3 scripts/prepare-assets.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'docs' / 'design' / 'assets'
TARGET = ROOT / 'apps' / 'mini-app' / 'src' / 'assets'

THEMES = ('light', 'dark')
ICON_PREFIXES = ('nav-', 'icon-', 'checkbox', 'badge-', 'deco-')
ICON_MAX_SIDE = 96
# Largest side at ~3x of the size the element is drawn at (default: source size).
MAX_SIDES = {'btn-plus-round': 168}
QUALITY = 78
ALPHA_QUALITY = 75
TEXTURE_QUALITY = 80
# The dark paper is shown at 18% opacity: heavy compression is invisible.
TEXTURE_QUALITIES = {'paper-dark': 50}
HATCH_SIDE = 280

# Planner notes are drawn tilted: rotate them straight (degrees, counter-clockwise)
# and place the paper edge at the same inset on a square canvas.
NOTE_ANGLES = {
    'light': {'note-taped': -10.5, 'note-taped-right': 8.5, 'note-curled': -3.75},
    'dark': {'note-taped': -9.25, 'note-taped-right': 10, 'note-curled': -0.25},
}
NOTE_SIDE = 300
NOTE_INSET = 0.1
# Priority notes are tinted through a mask of the whole note shape, outline included.
NOTE_FILL_SIDE = 150

# Opaque hatch tiles become transparent: ink colour + alpha from one channel.
HATCH_TILES = {
    'hatch-mint-tile': {'ink': (174, 228, 199), 'alpha': lambda r, g, b: (255 - r) * 255 // (255 - 174)},
    'hatch-chalk-tile': {'ink': (169, 210, 182), 'alpha': lambda r, g, b: g * 255 // 210},
}


def save_webp(image, path, quality):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, 'WEBP', quality=quality, alpha_quality=ALPHA_QUALITY, method=6)


def fit(image, max_side):
    scale = max_side / max(image.size)
    if scale >= 1:
        return image
    size = (round(image.width * scale), round(image.height * scale))
    return image.resize(size, Image.LANCZOS)


def paper_edges(counts):
    smooth = [sum(counts[max(0, i - 1):i + 2]) for i in range(len(counts))]
    threshold = len(counts) * 0.3
    strong = [index for index, count in enumerate(smooth) if count >= threshold]
    return strong[0], strong[-1]


def straighten_note(image, theme, angle):
    image = image.rotate(angle, resample=Image.BICUBIC, expand=True)
    grey = image.convert('L').getdata()
    alpha = image.getchannel('A').getdata()
    ink = [a > 128 and (l < 110 if theme == 'light' else l > 170) for l, a in zip(grey, alpha)]
    width, height = image.size
    rows = [sum(ink[y * width:(y + 1) * width]) for y in range(height)]
    cols = [sum(ink[x::width]) for x in range(width)]
    top, bottom = paper_edges(rows)
    left, right = paper_edges(cols)

    paper = NOTE_SIDE * (1 - 2 * NOTE_INSET)
    scale_x, scale_y = paper / (right - left), paper / (bottom - top)
    image = image.resize((round(width * scale_x), round(height * scale_y)), Image.LANCZOS)
    offset = round(NOTE_SIDE * NOTE_INSET)
    canvas = Image.new('RGBA', (NOTE_SIDE, NOTE_SIDE))
    canvas.paste(image, (offset - round(left * scale_x), offset - round(top * scale_y)))
    return canvas


def note_fill(image):
    ink = image.getchannel('A').point(lambda value: 255 if value > 60 else 0).filter(ImageFilter.MaxFilter(7))
    ImageDraw.floodfill(ink, (0, 0), 128)
    shape = ink.point(lambda value: 0 if value == 128 else 255).filter(ImageFilter.MinFilter(5))
    mask = Image.new('RGBA', image.size, (255, 255, 255, 0))
    mask.putalpha(shape)
    return fit(mask, NOTE_FILL_SIDE)


def convert_theme_assets():
    for theme in THEMES:
        for source in sorted((SOURCE / theme).glob('*.png')):
            image = Image.open(source).convert('RGBA')
            if source.stem.startswith(ICON_PREFIXES):
                image = fit(image, ICON_MAX_SIDE)
            if source.stem in MAX_SIDES:
                image = fit(image, MAX_SIDES[source.stem])
            if source.stem in NOTE_ANGLES[theme]:
                image = straighten_note(image, theme, NOTE_ANGLES[theme][source.stem])
                save_webp(note_fill(image), TARGET / theme / f'{source.stem}-fill.webp', QUALITY)
            save_webp(image, TARGET / theme / f'{source.stem}.webp', QUALITY)


def to_transparent_hatch(image, ink, alpha):
    rgb = image.convert('RGB')
    alpha_channel = Image.new('L', rgb.size)
    alpha_channel.putdata([max(0, min(255, alpha(*pixel))) for pixel in rgb.getdata()])
    result = Image.new('RGBA', rgb.size, ink + (255,))
    result.putalpha(alpha_channel)
    return result


def convert_textures():
    for source in sorted((SOURCE / 'textures').glob('*.png')):
        image = Image.open(source)
        hatch = HATCH_TILES.get(source.stem)
        image = fit(to_transparent_hatch(image, **hatch), HATCH_SIDE) if hatch else image.convert('RGB')
        quality = TEXTURE_QUALITIES.get(source.stem, TEXTURE_QUALITY)
        save_webp(image, TARGET / 'textures' / f'{source.stem}.webp', quality)


if __name__ == '__main__':
    convert_theme_assets()
    convert_textures()
    print(f'Assets written to {TARGET.relative_to(ROOT)}')
