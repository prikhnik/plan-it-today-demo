#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Converts docs/design/assets PNG into WebP for the mini app. Requires Pillow.

Usage: python3 scripts/prepare-assets.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'docs' / 'design' / 'assets'
TARGET = ROOT / 'apps' / 'mini-app' / 'src' / 'assets'

THEMES = ('light', 'dark')
ICON_PREFIXES = ('nav-', 'icon-', 'checkbox', 'badge-', 'deco-')
ICON_MAX_SIDE = 96
QUALITY = 85
TEXTURE_QUALITY = 80
HATCH_SIDE = 280

# Opaque hatch tiles become transparent: ink colour + alpha from one channel.
HATCH_TILES = {
    'hatch-mint-tile': {'ink': (174, 228, 199), 'alpha': lambda r, g, b: (255 - r) * 255 // (255 - 174)},
    'hatch-chalk-tile': {'ink': (169, 210, 182), 'alpha': lambda r, g, b: g * 255 // 210},
}


def save_webp(image, path, quality):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, 'WEBP', quality=quality, method=6)


def fit(image, max_side):
    scale = max_side / max(image.size)
    if scale >= 1:
        return image
    size = (round(image.width * scale), round(image.height * scale))
    return image.resize(size, Image.LANCZOS)


def convert_theme_assets():
    for theme in THEMES:
        for source in sorted((SOURCE / theme).glob('*.png')):
            image = Image.open(source).convert('RGBA')
            if source.stem.startswith(ICON_PREFIXES):
                image = fit(image, ICON_MAX_SIDE)
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
        save_webp(image, TARGET / 'textures' / f'{source.stem}.webp', TEXTURE_QUALITY)


if __name__ == '__main__':
    convert_theme_assets()
    convert_textures()
    print(f'Assets written to {TARGET.relative_to(ROOT)}')
