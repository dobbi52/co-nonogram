"""지붕 위 고양이 그림을 그리고, 조각마다 난이도를 맞춘다.

사용법: python3 roof_cat.py
결과: roof-cat.json (보통·어려움 두 벌), roof-cat.png, roof-cat-hard.png

- 대문자는 칠하는 칸, 소문자는 비우는 칸. 글자 종류가 칠판에 나타날 색을 정한다.
- 칠한 칸과 빈칸은 같은 영역 안에서 비슷한 색이라, 칸을 뒤집어도 그림은 그대로 보인다.
- 난이도: 가로줄 전체 → 세로줄 전체를 한 번 훑는 것을 1회로 세어, 다 풀리기까지 걸리는 횟수.
  보통 3~5회, 어려움 4~6회. 추측 없이 힌트만으로 풀려야 한다.
"""
import json, math, random, sys
from multiprocessing import Pool
from PIL import Image

W, H, P = 60, 50, 10
LEVELS = {'normal': (3, 5), 'hard': (4, 6)}
DENS = (0.35, 0.78)

PAL = {
    'S': '#33457F', 's': '#1F2B5E',  # 밤하늘
    'Y': '#FFE14D', 'y': '#E3C23A',  # 별, 창문 불빛
    'M': '#FFF2B0', 'm': '#E2CF7C',  # 달
    'W': '#C9D3F2', 'w': '#9EAAD4',  # 구름, 연기
    'R': '#E2504C', 'r': '#B23B3B',  # 기와, 열매
    'B': '#B8664A', 'b': '#8C4734',  # 굴뚝 벽돌
    'H': '#EBCB9C', 'h': '#CBA877',  # 벽
    'D': '#7C4B2B', 'd': '#5D3721',  # 나무 문, 창틀, 줄기
    'O': '#FF9A3C', 'o': '#D8772B',  # 고양이 털
    'L': '#FFE6C8', 'l': '#F1C99C',  # 주둥이, 가슴
    'E': '#0B0F1A', 'e': '#0B0F1A',  # 눈
    'N': '#FF4FA3', 'n': '#E13D8B',  # 코, 귀 속, 꽃
    'T': '#3CC46C', 't': '#24935A',  # 나뭇잎
    'G': '#62D683', 'g': '#2F9E56',  # 풀밭
}


def ell(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1


def tri(x, y, a, b, c):
    def s(p, q):
        return (x - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (y - q[1])
    d = [s(a, b), s(b, c), s(c, a)]
    return not (min(d) < 0 and max(d) > 0)


def draw():
    rnd = random.Random(7)
    kind = [['S'] * W for _ in range(H)]
    fill = [[False] * W for _ in range(H)]

    def put(x, y, k, f):
        if 0 <= x < W and 0 <= y < H:
            kind[y][x] = k
            fill[y][x] = f

    for y in range(H):
        for x in range(W):
            v = math.sin(x * 0.47 + math.sin(y * 0.31) * 2.4) + math.sin(y * 0.73 + x * 0.17) + 0.6 * math.sin(x * 1.3 - y * 0.9)
            put(x, y, 'S', v > 0.2)
            # 구름 두 덩이
            if ell(x, y, 6, 7, 6, 2.2) or ell(x, y, 8, 5.5, 3, 1.6):
                put(x, y, 'W', (x + y) % 3 != 0)
            if ell(x, y, 39, 5, 6, 2) or ell(x, y, 42, 3.5, 3, 1.6):
                put(x, y, 'W', (x * 2 + y) % 5 != 0)
            # 초승달
            if ell(x, y, 52, 9, 6, 6) and not ell(x, y, 55, 7, 5, 5):
                put(x, y, 'M', not ((x + y) % 4 == 0 and x < 50))
    # 별
    for sx, sy, big in [(4, 3, 1), (22, 2, 0), (34, 13, 1), (45, 15, 0), (58, 20, 0), (3, 17, 0), (19, 15, 1), (47, 3, 0), (29, 2, 0), (56, 2, 1), (40, 20, 0), (8, 22, 0)]:
        put(sx, sy, 'Y', True)
        if big:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                put(sx + dx, sy + dy, 'Y', True)
    for y in range(H):
        for x in range(W):
            # 굴뚝과 연기
            if 14 <= x <= 18 and 19 <= y <= 30:
                put(x, y, 'B', not (y % 2 == 0 or (x + (y // 2) % 2 * 2) % 4 == 0))
            if 13 <= x <= 19 and y == 18:
                put(x, y, 'B', True)
            for cx, cy, rx, ry in ((16, 15.5, 2, 1.6), (18.5, 12, 2.6, 2), (21.5, 8.5, 2.8, 2)):
                if ell(x, y, cx, cy, rx, ry):
                    put(x, y, 'W', (x + 2 * y) % 4 != 1)
            # 기와지붕 (사다리꼴)
            if 24 <= y <= 36:
                left = 20 - (y - 24) * 1.4
                right = 36 + (y - 24) * 1.4
                if left <= x <= right:
                    put(x, y, 'R', not (y % 3 == 0 or (x + (y // 3) % 2 * 2) % 4 == 0))
            # 벽 (가로 판자)
            if 37 <= y <= 46 and 5 <= x <= 51:
                put(x, y, 'H', not (y % 3 == 1 or (x + y // 3 * 3) % 9 == 0))
            # 창문 두 개 (불빛 + 창틀)
            for wx in (9, 38):
                if wx <= x <= wx + 7 and 39 <= y <= 44:
                    frame = x in (wx, wx + 7, wx + 3, wx + 4) or y in (39, 44, 41)
                    if frame:
                        put(x, y, 'D', not (y == 41 and x in (wx + 3, wx + 4)))
                    else:
                        put(x, y, 'Y', (x + y) % 3 != 0)
            # 문
            if 24 <= x <= 31 and 38 <= y <= 46:
                edge = x in (24, 31) or y == 38
                put(x, y, 'D', edge or (x - 24) % 3 != 0)
            # 나무 줄기
            if 52 <= x <= 55 and 33 <= y <= 46:
                put(x, y, 'D', not (y % 4 == 0 and x == 53))
            # 나뭇잎
            if ell(x, y, 53.5, 25, 6.5, 6) or ell(x, y, 48, 29, 4, 3.6) or ell(x, y, 57.5, 31, 3.5, 4.2) or ell(x, y, 53, 33, 4, 2.4):
                v = math.sin(x * 1.7 + y * 0.6) + math.sin(y * 1.9 - x * 0.4)
                put(x, y, 'T', v > -0.9)
            # 풀밭
            if y >= 47:
                put(x, y, 'G', (x * 3 + y * 5 + (x // 4)) % 7 not in (0, 3))
    # 열매
    for fx, fy in ((50, 22), (55, 21), (57, 27), (49, 28), (54, 29), (52, 25), (58, 33)):
        put(fx, fy, 'R', True)
    # 풀밭 꽃
    for fx, col in ((2, 'N'), (7, 'Y'), (20, 'N'), (34, 'Y'), (43, 'N'), (58, 'Y'), (13, 'Y'), (47, 'N')):
        put(fx, 47, col, True)
        put(fx - 1, 48, col, True)
        put(fx + 1, 48, col, True)
        put(fx, 48, 'Y' if col == 'N' else 'N', True)
        put(fx, 49, 'G', True)
    # 고양이 (지붕 마루에 앉음)
    for y in range(H):
        for x in range(W):
            # 꼬리: 지붕 위로 휘어짐
            if 33 <= x <= 43:
                ty = 23.5 - 2.6 * math.sin((x - 33) / 3.2)
                if abs(y - ty) <= 0.9:
                    put(x, y, 'O', (x % 3) != 0)
            if ell(x, y, 28, 19, 6, 6.2):
                put(x, y, 'O', not ((x + y) % 4 == 0 and abs(x - 28) > 2))
            if ell(x, y, 28, 20.5, 2.6, 4):
                put(x, y, 'L', (x + y) % 3 != 0)
            if ell(x, y, 27.5, 10, 5.6, 4.6) or tri(x, y, (22, 3), (22.5, 9), (26, 7)) or tri(x, y, (33, 3), (32.5, 9), (29, 7)):
                put(x, y, 'O', not (y < 9 and x % 4 == 1) and not (y == 11 and abs(x - 27.5) > 3.5))
            if tri(x, y, (23, 5), (23.3, 8), (25, 7)) or tri(x, y, (32, 5), (31.7, 8), (30, 7)):
                put(x, y, 'N', True)
            if ell(x, y, 27.5, 12.6, 2.4, 1.3):
                put(x, y, 'L', True)
    # 눈, 코, 앞발
    for ex in (24, 30):
        for dx in (0, 1):
            for dy in (9, 10):
                put(ex + dx, dy, 'E', False)
    put(27, 12, 'N', True)
    put(28, 12, 'N', True)
    for x in (25, 26, 30, 31):
        put(x, 25, 'L', True)
    return kind, fill


# ───── 풀이기 ─────
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


LINES = {}
for m in range(1 << P):
    LINES.setdefault(hint([m >> i & 1 for i in range(P)]), []).append(m)
FULL = (1 << P) - 1


def passes(g):
    """다 풀리기까지 훑은 횟수. 못 풀면 (-1, 남은 칸 수)."""
    rows = [LINES[hint(r)] for r in g]
    cols = [LINES[hint([g[r][c] for r in range(P)])] for c in range(P)]
    on = [0] * P
    off = [0] * P
    n = 0
    while True:
        n += 1
        changed = False
        for i in range(P):
            a, b = on[i], off[i]
            cand = [m for m in rows[i] if (m & a) == a and not (m & b)]
            rows[i] = cand
            al, an = FULL, 0
            for m in cand:
                al &= m
                an |= m
            na, nb = a | al, b | (FULL & ~an)
            if na != a or nb != b:
                on[i], off[i] = na, nb
                changed = True
        for j in range(P):
            a = 0
            b = 0
            for i in range(P):
                a |= ((on[i] >> j) & 1) << i
                b |= ((off[i] >> j) & 1) << i
            cand = [m for m in cols[j] if (m & a) == a and not (m & b)]
            cols[j] = cand
            al, an = FULL, 0
            for m in cand:
                al &= m
                an |= m
            for i in range(P):
                if (al >> i & 1) and not (on[i] >> j & 1):
                    on[i] |= 1 << j
                    changed = True
                if (~an >> i & 1) and not (off[i] >> j & 1):
                    off[i] |= 1 << j
                    changed = True
        left = sum(P - bin((on[i] | off[i]) & FULL).count('1') for i in range(P))
        if left == 0:
            return n, 0
        if not changed:
            return -1, left


def score(g, lo, hi):
    n, left = passes(g)
    d = sum(map(sum, g)) / 100
    dp = 0 if DENS[0] <= d <= DENS[1] else min(abs(d - DENS[0]), abs(d - DENS[1])) * 100
    if n < 0:
        return (left + 10, dp, 9), n
    pp = 0 if lo <= n <= hi else (lo - n if n < lo else n - hi)
    mid = (lo + hi) // 2
    return (pp, dp, abs(n - mid)), n


def tune(args):
    g, lo, hi, seed = args
    rnd = random.Random(seed)
    g = [row[:] for row in g]
    best, n = score(g, lo, hi)
    tries = 0
    while best[:3] != (0, 0, 0) and tries < 30000:
        tries += 1
        cells = [(rnd.randrange(P), rnd.randrange(P)) for _ in range(rnd.choice((1, 1, 2)))]
        for r, c in cells:
            g[r][c] ^= 1
        s, n2 = score(g, lo, hi)
        if s < best or (s == best and rnd.random() < 0.15):
            best, n = s, n2
        else:
            for r, c in cells:
                g[r][c] ^= 1
    return g, best, n, tries


def main():
    kind, fill = draw()
    out = {'pal': PAL, 'w': W, 'h': H, 'levels': {}}
    for lv, (lo, hi) in LEVELS.items():
        jobs = []
        for pr in range(H // P):
            for pc in range(W // P):
                g = [[1 if fill[pr * P + r][pc * P + c] else 0 for c in range(P)] for r in range(P)]
                jobs.append((g, lo, hi, pr * 100 + pc + (0 if lv == 'normal' else 7)))
        with Pool(2) as pool:
            res = pool.map(tune, jobs)
        f2 = [row[:] for row in fill]
        stats = []
        for (g, best, n, tries), (_, _, _, sd) in zip(res, jobs):
            pr, pc = sd // 100, (sd % 100) - (0 if lv == 'normal' else 7)
            for r in range(P):
                for c in range(P):
                    f2[pr * P + r][pc * P + c] = bool(g[r][c])
            stats.append((f'{"ABCDE"[pr]}{pc + 1}', n, best, round(sum(map(sum, g)) / 100, 2), tries))

        rows = [''.join(kind[y][x] if f2[y][x] else kind[y][x].lower() for x in range(W)) for y in range(H)]
        out['levels'][lv] = rows
        bad = [s for s in stats if s[2][:2] != (0, 0)]
        print(lv, 'passes:', sorted(set(s[1] for s in stats)), 'bad:', bad, file=sys.stderr)
        print(lv, ' '.join(f'{s[0]}:{s[1]}' for s in stats), file=sys.stderr)
        img = Image.new('RGB', (W, H))
        for y in range(H):
            for x in range(W):
                img.putpixel((x, y), tuple(int(PAL[rows[y][x]][i:i + 2], 16) for i in (1, 3, 5)))
        img.resize((W * 12, H * 12), Image.NEAREST).save('roof-cat.png' if lv == 'normal' else 'roof-cat-hard.png')
    json.dump(out, open('roof-cat.json', 'w'), ensure_ascii=False, indent=0)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        kind, fill = draw()
        img = Image.new('RGB', (W, H))
        for y in range(H):
            for x in range(W):
                k = kind[y][x] if fill[y][x] else kind[y][x].lower()
                img.putpixel((x, y), tuple(int(PAL[k][i:i + 2], 16) for i in (1, 3, 5)))
        img.resize((W * 12, H * 12), Image.NEAREST).save(sys.argv[2])
    else:
        main()
