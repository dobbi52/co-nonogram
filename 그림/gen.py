import json, math, random
from PIL import Image

W, H, P = 60, 50, 10
random.seed(52)
PAL = {
    'S': '#31427E', 's': '#18214A',  # sky
    'M': '#FFE14D', 'm': '#D8B93A',  # moon
    'O': '#FF9A3C', 'o': '#C4661C',  # cat fur
    'L': '#FFE3C2', 'l': '#F2C79A',  # cat muzzle / chest
    'E': '#0B0F1A', 'e': '#0B0F1A',  # eyes
    'N': '#FF4FA3', 'n': '#FF4FA3',  # nose / inner ear
    'G': '#39C46A', 'g': '#1F8A4A',  # grass
}


def in_ellipse(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1


def in_tri(x, y, a, b, c):
    def s(p, q):
        return (x - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (y - q[1])
    d = [s(a, b), s(b, c), s(c, a)]
    return not (min(d) < 0 and max(d) > 0)


kind = [['S'] * W for _ in range(H)]
fill = [[False] * W for _ in range(H)]
for y in range(H):
    for x in range(W):
        # night-sky swirl pattern
        v = math.sin(x * 0.55 + math.sin(y * 0.35) * 2.2) + math.sin(y * 0.8 + x * 0.12)
        kind[y][x] = 'S'
        fill[y][x] = v > 0.25
        if in_ellipse(x, y, 49, 11, 8, 8):
            kind[y][x] = 'M'
            fill[y][x] = not (in_ellipse(x, y, 46, 9, 1.8, 1.8) or in_ellipse(x, y, 52, 13, 2.3, 2.3) or in_ellipse(x, y, 47, 15, 1.2, 1.2))
        if y >= 44:
            kind[y][x] = 'G'
            fill[y][x] = (x + (y % 3) * 2) % 5 != 0
        # tail
        tx = 39 + 7 * math.sin((y - 30) / 5.0)
        if 28 <= y <= 44 and abs(x - tx) <= 2.1:
            kind[y][x] = 'O'
            fill[y][x] = y % 5 != 0
        # body
        if in_ellipse(x, y, 25, 36, 14, 11):
            kind[y][x] = 'O'
            fill[y][x] = (y + abs(x - 25) // 3) % 5 != 0
        # head and ears
        if in_ellipse(x, y, 25, 18, 13, 10.5) or in_tri(x, y, (13, 2), (13, 15), (23, 10)) or in_tri(x, y, (37, 2), (37, 15), (27, 10)):
            kind[y][x] = 'O'
            fill[y][x] = not ((x % 6 == 1 and y < 13) or (abs(x - 25) >= 8 and y % 4 == 0 and y > 14))
        if in_tri(x, y, (15, 5), (15, 12), (20, 10)) or in_tri(x, y, (35, 5), (35, 12), (30, 10)):
            kind[y][x] = 'N'
            fill[y][x] = True
        # chest
        if in_ellipse(x, y, 25, 38, 7, 8):
            kind[y][x] = 'L'
            fill[y][x] = (x + y) % 4 != 0
        # muzzle
        if in_ellipse(x, y, 25, 23, 6, 3.6):
            kind[y][x] = 'L'
            fill[y][x] = True
        # eyes
        if in_ellipse(x, y, 19.5, 17, 2.1, 2.7) or in_ellipse(x, y, 30.5, 17, 2.1, 2.7):
            kind[y][x] = 'E'
            fill[y][x] = False
        # nose and mouth
        if in_tri(x, y, (23.5, 20), (26.5, 20), (25, 22)):
            kind[y][x] = 'N'
            fill[y][x] = False
        if y == 24 and abs(x - 25) in (1, 2):
            kind[y][x] = 'E'
            fill[y][x] = False

# cells whose look depends on being a fixed flat color do not matter: color is by kind,
# so flipping a cell only swaps between its two shades.
LINES = {}
for m in range(1 << P):
    h, n = [], 0
    for i in range(P):
        if m >> i & 1:
            n += 1
        elif n:
            h.append(n)
            n = 0
    if n:
        h.append(n)
    LINES.setdefault(tuple(h), []).append(m)
MASK = (1 << P) - 1


def hint(bits):
    h, n = [], 0
    for b in bits:
        if b:
            n += 1
        elif n:
            h.append(n)
            n = 0
    if n:
        h.append(n)
    return tuple(h)


def solve(g):
    rows = [LINES[hint(r)] for r in g]
    cols = [LINES[hint([g[r][c] for r in range(P)])] for c in range(P)]
    on_r, off_r = [0] * P, [0] * P
    changed = True
    while changed:
        changed = False
        for i in range(P):
            a, b = on_r[i], off_r[i]
            cand = [m for m in rows[i] if (m & a) == a and (m & b) == 0]
            rows[i] = cand
            allon, anyon = MASK, 0
            for m in cand:
                allon &= m
                anyon |= m
            na, nb = a | allon, b | (MASK & ~anyon)
            if (na, nb) != (a, b):
                on_r[i], off_r[i] = na, nb
                changed = True
        for j in range(P):
            a = sum(((on_r[i] >> j) & 1) << i for i in range(P))
            b = sum(((off_r[i] >> j) & 1) << i for i in range(P))
            cand = [m for m in cols[j] if (m & a) == a and (m & b) == 0]
            cols[j] = cand
            allon, anyon = MASK, 0
            for m in cand:
                allon &= m
                anyon |= m
            na, nb = a | allon, b | (MASK & ~anyon)
            for i in range(P):
                if (na >> i & 1) and not (on_r[i] >> j & 1):
                    on_r[i] |= 1 << j
                    changed = True
                if (nb >> i & 1) and not (off_r[i] >> j & 1):
                    off_r[i] |= 1 << j
                    changed = True
    return sum(1 for i in range(P) for j in range(P) if not ((on_r[i] | off_r[i]) >> j & 1))


stats = []
for pr in range(H // P):
    for pc in range(W // P):
        g = [[fill[pr * P + r][pc * P + c] for c in range(P)] for r in range(P)]
        best = solve(g)
        flips = 0
        tries = 0
        while True:
            dens = sum(map(sum, g)) / 100
            ok = best == 0 and 0.38 <= dens <= 0.8
            if ok or tries > 60000:
                break
            tries += 1
            r, c = random.randrange(P), random.randrange(P)
            if kind[pr * P + r][pc * P + c] in 'EN':
                continue
            if dens > 0.8 and not g[r][c]:
                continue
            if dens < 0.38 and g[r][c]:
                continue
            g[r][c] = not g[r][c]
            s = solve(g)
            nd = sum(map(sum, g)) / 100
            better = s < best or (s == best and abs(nd - 0.6) < abs(dens - 0.6) and not (0.38 <= dens <= 0.8))
            if better or (s == best and random.random() < 0.08):
                if s < best or better:
                    flips += 1
                best = s
            else:
                g[r][c] = not g[r][c]
        for r in range(P):
            for c in range(P):
                fill[pr * P + r][pc * P + c] = g[r][c]
        stats.append((pr, pc, best, round(sum(map(sum, g)) / 100, 2), flips, max(len(hint(x)) for x in g), max(len(hint([g[r][c] for r in range(P)])) for c in range(P))))

rows = []
for y in range(H):
    rows.append(''.join(kind[y][x] if fill[y][x] else kind[y][x].lower() for x in range(W)))

json.dump({'rows': rows, 'pal': PAL}, open('picture.json', 'w'), ensure_ascii=False, indent=0)
img = Image.new('RGB', (W, H))
for y in range(H):
    for x in range(W):
        img.putpixel((x, y), tuple(int(PAL[rows[y][x]][i:i + 2], 16) for i in (1, 3, 5)))
img.resize((W * 12, H * 12), Image.NEAREST).save('cat-picture.png')
print('unsolved pieces', [s for s in stats if s[2] != 0])
print('density', min(s[3] for s in stats), max(s[3] for s in stats), 'max hints row/col', max(s[5] for s in stats), max(s[6] for s in stats))
for s in stats:
    print(s)
