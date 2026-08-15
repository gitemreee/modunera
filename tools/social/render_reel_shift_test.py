#!/usr/bin/env python3
"""What one Reel does to each grid arrangement.

Instagram fills the profile grid newest-first from the top left, so every new
post pushes every existing post along by one position. That single mechanic
decides which of these layouts can survive contact with a posting schedule.

An arrangement whose rule is about *which column* a post sits in — three rails,
centre spine, row bands — is destroyed by any post that is not part of a group of
three. An arrangement whose rule is about *adjacency* — a card never touches a
card — shifts without breaking, because the relationship it protects is between
neighbours, not between a post and a column.

Reels are the reason this matters here rather than in theory. A Reel is posted
when the video is ready, alone, and cannot be batched into threes to keep a
column pattern intact.

Writes the two sheets that show it:
  after-one-reel-a-checkerboard.jpg
  after-one-reel-b-three-rails.jpg

Usage: python3 tools/social/render_reel_shift_test.py
"""
A Reel dropped into the grid: 9:16 video, centre-square crop, play badge."""
    _, look, focus = o.P["night"]
    im = Image.open(o.src("night")).convert("RGB")
    im, _ = g.strip_camera_watermark(im)
    post = g.cover(im, g.POST_W, g.POST_H, focus)
    post = g.grade(post, **{k: v for k, v in look.items() if k != "noisy"})
    post = g.sharpen(post, amount=0.55, micro=0.35)
    post = g.head_scrim(post, height_ratio=0.24, strength=120)
    d = ImageDraw.Draw(post)
    g.place_logo(post, light=True)
    # the Reels badge Instagram overlays on the grid tile
    cx, cy = g.POST_W - 120, g.SAFE_TOP + 96
    d.polygon([(cx-16, cy-22), (cx-16, cy+22), (cx+22, cy)], fill=(255, 255, 255))
    g.tracked(d, (g.MARGIN, g.POST_H - g.SAFE_BOTTOM - 106), "REEL", g.F_TITLE(37), (255,255,255), 3)
    g.place_domain(d, light=True)
    return post

reel = reel_tile()
for key, fn in [("a-checkerboard", o.option_a), ("b-three-rails", o.option_b)]:
    posts = fn()
    # a single Reel is posted: it goes in first and pushes every tile along by one
    shifted = [reel] + posts[:-1]
    o.sheet(shifted, OUT / f"after-one-reel-{key}.jpg")
print("ok")
