"""7×7 조각용 작은 그림 만들기.

60×50 그림의 영역 글자를 42×35로 줄인 뒤, 7×7 조각마다 쉬움 2회 · 보통 3회 · 어려움 4회로 맞춘다.
- 줄일 때 칸마다 원래 그림에서 해당하는 범위의 영역 글자 중 가장 많은 것을 고른다.
  눈·코·별처럼 그림 전체에서 드문 글자는 가중치를 줘서 작은 부분이 사라지지 않게 한다.
- 칠하는 칸 여부는 같은 범위에서 그 영역 글자의 칠한 비율로 정한다(무늬가 대략 유지됨).
결과는 make_pictures.py가 불러 js/pictures.js의 small에 넣는다.
"""
import math, random
from collections import Counter
from multiprocessing import Pool

SW, SH, SP = 42, 35, 7
LEVELS7 = {'easy': 2, 'normal': 3, 'hard': 4}
DENS = (0.33, 0.8)


def shrink(kind, fill, W=60, H=50):
    total = Counter(k for row in kind for k in row)
    n = W * H
    weight = {k: 1 + 4 * max(0.0, 1 - c / (n * 0.03)) for k, c in total.items()}  # 3%보다 드물수록 무겁게
    sk, sf = [], []
    for y in range(SH):
        y0, y1 = y * H / SH, (y + 1) * H / SH
        rk, rf = [], []
        for x in range(SW):
            x0, x1 = x * W / SW, (x + 1) * W / SW
            score, filled = Counter(), Counter()
            for yy in range(int(y0), math.ceil(y1)):
                wy = min(y1, yy + 1) - max(y0, yy)
                for xx in range(int(x0), math.ceil(x1)):
                    wx = min(x1, xx + 1) - max(x0, xx)
                    if wx <= 0 or wy <= 0:
                        continue
                    k = kind[yy][xx]
                    score[k] += wx * wy * weight[k]
                    filled[k] += wx * wy * (1 if fill[yy][xx] else 0) * weight[k]
            k = score.most_common(1)[0][0]
            rk.append(k)
            rf.append(filled[k] / score[k] >= 0.5)
        sk.append(rk)
        sf.append(rf)
    return sk, sf


# ───── n×n 풀이기 ─────
def hint(bits):
    h, c = [], 0
    for b in bits:
        if b:
            c += 1
        elif c:
            h.append(c)
            c = 0
    if c:
        h.append(c)
    return tuple(h)


LINES = {}
for m in range(1 << SP):
    LINES.setdefault(hint([m >> i & 1 for i in range(SP)]), []).append(m)
FULL = (1 << SP) - 1


def passes(g):
    P = SP
    rows = [LINES[hint(r)] for r in g]
    cols = [LINES[hint([g[r][c] for r in range(P)])] for c in range(P)]
    on, off = [0] * P, [0] * P
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
            a = b = 0
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


def score(g, target):
    n, left = passes(g)
    d = sum(map(sum, g)) / (SP * SP)
    dp = 0 if DENS[0] <= d <= DENS[1] else min(abs(d - DENS[0]), abs(d - DENS[1])) * 100
    if n < 0:
        return (left + 10, dp), n
    return (abs(n - target), dp), n


def tune(args):
    g, target, seed, base = args
    rnd = random.Random(seed)
    g = [row[:] for row in g]
    best, n = score(g, target)
    tries = 0
    while best != (0, 0) and tries < 40000:
        tries += 1
        cells = [(rnd.randrange(SP), rnd.randrange(SP)) for _ in range(rnd.choice((1, 1, 2)))]
        for r, c in cells:
            g[r][c] ^= 1
        s, n2 = score(g, target)
        # 원래 그림과 너무 달라지지 않게, 같은 점수면 원래 칸에 가까운 쪽을 고른다
        if s < best or (s == best and rnd.random() < 0.15):
            best, n = s, n2
        else:
            for r, c in cells:
                g[r][c] ^= 1
    return g, best, n


def make_small(kind, fill, seed):
    sk, sf = shrink(kind, fill)
    levels, report = {}, {}
    for li, (lv, target) in enumerate(LEVELS7.items()):
        jobs = []
        for pr in range(SH // SP):
            for pc in range(SW // SP):
                g = [[1 if sf[pr * SP + r][pc * SP + c] else 0 for c in range(SP)] for r in range(SP)]
                jobs.append((g, target, seed * 1000 + pr * 50 + pc * 3 + li * 7 + 1, None))
        with Pool(2) as pool:
            res = pool.map(tune, jobs)
        f2 = [row[:] for row in sf]
        ns = []
        for i, (g, best, n) in enumerate(res):
            pr, pc = divmod(i, SW // SP)
            if best != (0, 0):
                raise SystemExit(f'7×7 조각 {pr},{pc} ({lv}) 난이도 맞추기 실패: {best}')
            ns.append(n)
            for r in range(SP):
                for c in range(SP):
                    f2[pr * SP + r][pc * SP + c] = bool(g[r][c])
        levels[lv] = [''.join(sk[y][x] if f2[y][x] else sk[y][x].lower() for x in range(SW)) for y in range(SH)]
        report[lv] = sorted(set(ns))
    return {'w': SW, 'h': SH, 'levels': levels}, report
