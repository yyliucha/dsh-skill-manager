"""Rasterize the plugin icon (64x64 SVG geometry) to square PNGs for the
awesome-dsh-plugin storefront tile. Uses a supersampled canvas so the strokes
stay smooth at storefront size.
"""
from PIL import Image, ImageDraw

SS = 32            # supersample factor on the 64-unit viewBox
BLUE = (31, 111, 235)

def scaled(*values):
    return tuple(round(value * SS) for value in values)


def render(size: int) -> Image.Image:
    canvas = Image.new("RGBA", (64 * SS, 64 * SS), (0, 0, 0, 0))

    def layer():
        return Image.new("RGBA", canvas.size, (0, 0, 0, 0))

    # Body: translucent fill under a solid hairline stroke.
    body_fill = layer()
    ImageDraw.Draw(body_fill).rounded_rectangle(
        scaled(9, 14, 9 + 46, 14 + 36), radius=9 * SS,
        fill=BLUE + (41,),  # 16%
    )
    canvas.alpha_composite(body_fill)

    stroke = layer()
    ImageDraw.Draw(stroke).rounded_rectangle(
        scaled(9, 14, 9 + 46, 14 + 36), radius=9 * SS,
        outline=BLUE + (255,), width=3 * SS,
    )
    canvas.alpha_composite(stroke)

    # Inner pill behind the glyph.
    pill = layer()
    ImageDraw.Draw(pill).rounded_rectangle(
        scaled(16, 25, 16 + 32, 25 + 14), radius=7 * SS,
        fill=BLUE + (56,),  # 22%
    )
    canvas.alpha_composite(pill)

    glyph = layer()
    draw = ImageDraw.Draw(glyph)
    draw.ellipse(scaled(21.5 - 5, 32 - 5, 21.5 + 5, 32 + 5), fill=BLUE + (255,))

    def line(x1, y1, x2, y2):
        draw.line(scaled(x1, y1, x2, y2), fill=BLUE + (191,), width=round(2.4 * SS))
        for x, y in ((x1, y1), (x2, y2)):
            # Coordinates above are viewBox units; keep the cap radius in the
            # same units so `scaled()` applies the supersample factor exactly once.
            r = 1.2
            draw.ellipse(scaled(x - r, y - r, x + r, y + r), fill=BLUE + (191,))

    line(38, 27.5, 43.5, 27.5)
    line(38, 32, 46, 32)
    line(38, 36.5, 43.5, 36.5)
    canvas.alpha_composite(glyph)

    return canvas.resize((size, size), Image.LANCZOS)


for pixels in (180, 512):
    render(pixels).save(f"assets/icon-{pixels}.png", optimize=True)
print("written: assets/icon-180.png, assets/icon-512.png")
