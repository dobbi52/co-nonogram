"""그림 장면들. 각 함수는 (kind, fill, pal)을 돌려준다.

- 크기는 60×50. 작은 판(16·20·25조각)으로 잘라 쓸 때를 생각해, 주인공은 되도록 가운데(가로 10~49칸)에 둔다.
- kind[y][x]: 그 칸의 영역 글자(대문자). fill[y][x]: 칠하는 칸이면 True.
- pal: 글자 → 색. 대문자는 칠하는 칸 색, 소문자는 같은 영역의 빈칸 색(비슷하게).
- 말랑 친구들은 이 게임만의 캐릭터다. 다른 작품의 캐릭터를 따라 그리지 않는다.
"""
import math

W, H = 60, 50


def ell(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1


def tri(x, y, a, b, c):
    def s(p, q):
        return (x - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (y - q[1])
    d = [s(a, b), s(b, c), s(c, a)]
    return not (min(d) < 0 and max(d) > 0)


def wave(x, y, a=0.47, b=0.31, c=0.73, d=0.17):
    return math.sin(x * a + math.sin(y * b) * 2.4) + math.sin(y * c + x * d) + 0.6 * math.sin(x * 1.3 - y * 0.9)


class Pic:
    def __init__(self, base, f=lambda x, y: True):
        self.kind = [[base] * W for _ in range(H)]
        self.fill = [[f(x, y) for x in range(W)] for y in range(H)]

    def put(self, x, y, k, f=True):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H:
            self.kind[y][x] = k
            self.fill[y][x] = bool(f)

    def area(self, test, k, f=lambda x, y: True):
        for y in range(H):
            for x in range(W):
                if test(x, y):
                    self.kind[y][x] = k
                    self.fill[y][x] = bool(f(x, y))

    def star(self, x, y, k='Y', big=False):
        self.put(x, y, k)
        if big:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                self.put(x + dx, y + dy, k)

    def out(self, pal):
        return self.kind, self.fill, pal


# ───── 부엉이 숲 ─────
def owl():
    pal = {'S': '#2B3A78', 's': '#1B2556', 'M': '#FFF2B0', 'm': '#E6D487', 'Y': '#FFE14D', 'y': '#E0C03A',
           'B': '#A06E46', 'b': '#7C5434', 'L': '#EBD5AA', 'l': '#CFB488', 'W': '#FFFFFF', 'w': '#D6DEF2',
           'E': '#0B0F1A', 'e': '#0B0F1A', 'O': '#FF9A3C', 'o': '#D8772B', 'D': '#6B4428', 'd': '#4E301B',
           'T': '#2E8A5A', 't': '#1D6644', 'G': '#4FBF74', 'g': '#2F8F52', 'R': '#E2504C', 'r': '#B23B3B'}
    p = Pic('S', lambda x, y: wave(x, y) > 0.2)
    for sx, sy, big in [(12, 3, 1), (45, 4, 0), (20, 8, 0), (48, 15, 1), (14, 18, 0), (40, 2, 0), (8, 26, 0), (50, 24, 0), (24, 1, 0)]:
        p.star(sx, sy, 'Y', big)
    p.area(lambda x, y: ell(x, y, 30, 15, 11, 11), 'M', lambda x, y: not (ell(x, y, 25, 9, 2, 2) or ell(x, y, 36, 21, 2.4, 2) or ell(x, y, 37, 10, 1.4, 1.4) or ((x + y) % 5 == 0 and x > 34)))
    # 양옆 나무
    p.area(lambda x, y: 2 <= x <= 5 and 12 <= y <= 46, 'D', lambda x, y: not (y % 4 == 0 and x == 3))
    p.area(lambda x, y: 54 <= x <= 57 and 12 <= y <= 46, 'D', lambda x, y: not (y % 4 == 2 and x == 56))
    leaf = lambda x, y: math.sin(x * 1.7 + y * 0.6) + math.sin(y * 1.9 - x * 0.4) > -0.8
    p.area(lambda x, y: ell(x, y, 4, 8, 6.5, 6) or ell(x, y, 9, 15, 4.5, 4) or ell(x, y, 2, 18, 3, 3), 'T', leaf)
    p.area(lambda x, y: ell(x, y, 56, 9, 6.5, 6) or ell(x, y, 51, 16, 4.5, 4) or ell(x, y, 58, 19, 3, 3), 'T', leaf)
    # 나뭇가지
    for x in range(5, 55):
        yb = 35 + round(math.sin(x / 6.0))
        for t in (0, 1, 2):
            p.put(x, yb + t, 'D', not (t == 1 and x % 5 == 0))
    p.area(lambda x, y: ell(x, y, 12, 33, 3.5, 2.2) or ell(x, y, 47, 33, 3.5, 2.2) or ell(x, y, 50, 38.5, 2.5, 1.6), 'T', leaf)
    # 부엉이
    p.area(lambda x, y: ell(x, y, 30, 25, 8.5, 10.5), 'B', lambda x, y: not ((x + 2 * y) % 5 == 0))
    p.area(lambda x, y: ell(x, y, 21.6, 27, 2.6, 7) or ell(x, y, 38.4, 27, 2.6, 7), 'B', lambda x, y: y % 2 == 0 or abs(x - 30) > 9)
    p.area(lambda x, y: tri(x, y, (21, 9), (23, 17), (27, 14)) or tri(x, y, (39, 9), (37, 17), (33, 14)), 'B')
    p.area(lambda x, y: ell(x, y, 30, 29, 5.2, 6.2), 'L', lambda x, y: (y - abs(x - 30)) % 3 != 0)
    p.area(lambda x, y: ell(x, y, 26.6, 19, 3.8, 3.5) or ell(x, y, 33.4, 19, 3.8, 3.5), 'L', lambda x, y: (x + y) % 4 != 0)
    for ex in (26.6, 33.4):
        p.area(lambda x, y, ex=ex: ell(x, y, ex, 19, 2.4, 2.4), 'W')
        p.area(lambda x, y, ex=ex: ell(x, y, ex, 19, 1.3, 1.3), 'Y')
        p.put(round(ex), 19, 'E', False)
    p.area(lambda x, y: tri(x, y, (28.6, 21), (31.4, 21), (30, 24)), 'O')
    for fx in (26, 27, 33, 34):
        p.put(fx, 35, 'O')
    # 반딧불이, 풀밭, 버섯
    for fx, fy in ((16, 40), (44, 42), (22, 44), (37, 41), (9, 39), (52, 43), (30, 43)):
        p.put(fx, fy, 'Y')
    p.area(lambda x, y: y >= 46, 'G', lambda x, y: (x * 3 + y * 5 + x // 4) % 7 not in (0, 3))
    for mx in (10, 24, 41, 49):
        p.area(lambda x, y, mx=mx: ell(x, y, mx, 45.5, 2.6, 1.6) and y <= 46, 'R', lambda x, y, mx=mx: not ((x + y) % 3 == 0))
        p.put(mx, 47, 'L'); p.put(mx, 48, 'L')
    return p.out(pal)


# ───── 로켓 발사 ─────
def rocket():
    pal = {'K': '#1B2350', 'k': '#0F1638', 'Y': '#FFE14D', 'y': '#E8C83A', 'O': '#FF8A3C', 'o': '#D96A26',
           'W': '#F2F4FF', 'w': '#C9CFE6', 'R': '#E2504C', 'r': '#B23B3B', 'U': '#4FC3FF', 'u': '#2B8FC4',
           'C': '#D3DBF5', 'c': '#A3AED6', 'P': '#B57BE8', 'p': '#8B58C2', 'Q': '#FFD27A', 'q': '#D9AD55',
           'G': '#7A83A6', 'g': '#545C7E', 'A': '#A89C92', 'a': '#83786F'}
    p = Pic('K', lambda x, y: wave(x, y, 0.61, 0.43, 0.57, 0.23) > 0.35)
    for sx, sy, big in [(4, 22, 1), (20, 4, 0), (44, 18, 1), (56, 28, 0), (16, 26, 0), (38, 3, 1), (50, 36, 0), (6, 34, 0), (25, 40, 0), (58, 14, 0)]:
        p.star(sx, sy, 'Y', big)
    # 고리 행성
    p.area(lambda x, y: ell(x, y, 10, 11, 6.2, 6.2), 'P', lambda x, y: (y + (x // 3)) % 3 != 0)
    p.area(lambda x, y: ell(x, y, 10, 11, 10.5, 2.6) and not ell(x, y, 10, 11, 7, 1.3) and (y >= 11 or not ell(x, y, 10, 11, 6.2, 6.2)), 'Q', lambda x, y: x % 3 != 1)
    # 작은 달과 소행성
    p.area(lambda x, y: ell(x, y, 51, 7, 4.5, 4.5), 'A', lambda x, y: not (ell(x, y, 50, 6, 1.2, 1.2) or ell(x, y, 53, 9, 1, 1)))
    p.area(lambda x, y: ell(x, y, 46, 27, 2, 1.5) or ell(x, y, 14, 37, 1.8, 1.4), 'A', lambda x, y: (x + y) % 3 != 0)
    # 발사대 탑
    p.area(lambda x, y: 41 <= x <= 43 and 14 <= y <= 46, 'G', lambda x, y: x != 42 or y % 2 == 0)
    p.area(lambda x, y: 36 <= x <= 41 and y in (18, 26), 'G')
    # 로켓
    p.area(lambda x, y: tri(x, y, (30, 2), (24.5, 12), (35.5, 12)), 'R', lambda x, y: not (y == 9 and x % 2 == 0))
    p.area(lambda x, y: 25 <= x <= 35 and 12 <= y <= 32, 'W', lambda x, y: not (y % 6 == 0 or (x == 30 and y % 3 == 0)))
    p.area(lambda x, y: ell(x, y, 30, 18, 3.3, 3.3), 'R')
    p.area(lambda x, y: ell(x, y, 30, 18, 2.2, 2.2), 'U', lambda x, y: not (x == 29 and y == 17))
    p.area(lambda x, y: ell(x, y, 30, 26, 1.5, 1.5), 'U')
    p.area(lambda x, y: tri(x, y, (25, 23), (19, 34), (25, 32)) or tri(x, y, (35, 23), (41, 34), (35, 32)), 'R', lambda x, y: (x + y) % 4 != 0)
    p.area(lambda x, y: 29 <= x <= 31 and 28 <= y <= 34, 'R')
    p.area(lambda x, y: 26 <= x <= 34 and 33 <= y <= 34, 'G')
    # 불꽃과 연기
    p.area(lambda x, y: ell(x, y, 30, 39, 4.6, 5.5) and y >= 35, 'O', lambda x, y: (x + 2 * y) % 5 != 0)
    p.area(lambda x, y: ell(x, y, 30, 38, 2.4, 3.6) and y >= 35, 'Y')
    p.area(lambda x, y: ell(x, y, 18, 44, 8, 3.6) or ell(x, y, 42, 44, 8, 3.6) or ell(x, y, 30, 46, 11, 2.8) or ell(x, y, 7, 46, 6, 2.8) or ell(x, y, 53, 46, 6, 2.8), 'C', lambda x, y: (x * 2 + y) % 5 != 0)
    p.area(lambda x, y: y >= 48, 'G', lambda x, y: (x + y) % 4 != 0)
    return p.out(pal)


# ───── 바닷속 문어 ─────
def octopus():
    pal = {'A': '#2E7FC4', 'a': '#1E5F9E', 'V': '#69B3E8', 'v': '#4C97D2', 'P': '#FF6FA8', 'p': '#DB508A',
           'L': '#FFB8D3', 'l': '#F294B9', 'W': '#E8F6FF', 'w': '#B9DDF5', 'E': '#0B0F1A', 'e': '#0B0F1A',
           'Y': '#FFE14D', 'y': '#E0C03A', 'O': '#FF9A3C', 'o': '#D8772B', 'T': '#3CC46C', 't': '#24935A',
           'N': '#F2D49B', 'n': '#D8B877', 'R': '#FF6B5A', 'r': '#D94C3E', 'H': '#FFF1E0', 'h': '#E8D2B8'}
    p = Pic('A', lambda x, y: wave(x, y, 0.37, 0.52, 0.41, 0.29) > 0.15)
    p.area(lambda x, y: (x - y * 0.6) % 14 < 3 and y < 30, 'V', lambda x, y: (x + y) % 3 != 0)
    # 거품
    for bx, by, r in ((50, 6, 1.6), (53, 12, 1.1), (49, 16, 0.9), (8, 4, 1.2), (11, 9, 0.8), (40, 3, 1)):
        p.area(lambda x, y, bx=bx, by=by, r=r: ell(x, y, bx, by, r + 0.6, r + 0.6), 'W', lambda x, y, bx=bx, by=by, r=r: not ell(x, y, bx, by, r - 0.4, r - 0.4) if r > 1 else True)
    # 다리 8개
    for k in range(8):
        x0 = 23 + 2 * k
        yend = 34 + (k % 3) * 3
        for y10 in range(190, yend * 10, 3):
            y = y10 / 10
            x = x0 + (k - 3.5) * (y - 19) * 0.42 + 2 * math.sin((y - 19) / 3 + k)
            wd = max(0.7, 1.7 - (y - 19) * 0.05)
            for dx in range(-2, 3):
                if abs(dx) <= wd:
                    p.put(x + dx, y, 'P', not (int(y) % 4 == 0 and dx == 0))
            if int(y) % 3 == 0:
                p.put(x + (1 if k < 4 else -1), y, 'L')
    # 머리
    p.area(lambda x, y: ell(x, y, 30, 13, 8.5, 8.5), 'P', lambda x, y: not ((x * 3 + y) % 7 == 0))
    for sx, sy in ((26, 8), (33, 6), (35, 11), (24, 13), (30, 9)):
        p.area(lambda x, y, sx=sx, sy=sy: ell(x, y, sx, sy, 1.3, 1.1), 'L')
    for ex in (27, 33):
        p.area(lambda x, y, ex=ex: ell(x, y, ex, 15, 2, 2), 'W')
        p.put(ex, 15, 'E', False); p.put(ex, 16, 'E', False)
    for mx, my in ((29, 19), (30, 20), (31, 19)):
        p.put(mx, my, 'E', False)
    # 물고기
    for fx, fy, k, d in ((9, 12, 'Y', 1), (51, 24, 'O', -1), (11, 28, 'O', 1), (48, 33, 'Y', -1)):
        p.area(lambda x, y, fx=fx, fy=fy: ell(x, y, fx, fy, 3, 1.7), k, lambda x, y: x % 2 == 0 or True)
        p.area(lambda x, y, fx=fx, fy=fy, d=d: tri(x, y, (fx - 3 * d, fy), (fx - 5 * d, fy - 2), (fx - 5 * d, fy + 2)), k)
        p.put(fx + 1.5 * d, fy - 0.4, 'E', False)
    # 해초, 산호, 모래
    for sx in (3, 7, 53, 57):
        for y in range(28, 50):
            x = sx + 1.3 * math.sin(y / 2.3 + sx)
            p.put(x, y, 'T', y % 3 != 0); p.put(x + 1, y, 'T')
    p.area(lambda x, y: y >= 45, 'N', lambda x, y: (x * 2 + y * 3) % 5 != 0)
    for cx, cy in ((44, 44), (46, 41), (42, 40), (48, 43)):
        p.area(lambda x, y, cx=cx, cy=cy: ell(x, y, cx, cy, 1.6, 2.4), 'R', lambda x, y: (x + y) % 3 != 1)
    p.area(lambda x, y: tri(x, y, (18, 43), (16, 48), (20, 48)) or tri(x, y, (15, 45.5), (21, 45.5), (18, 49)), 'R')
    p.area(lambda x, y: ell(x, y, 34, 47, 2.4, 1.6), 'H', lambda x, y: x % 2 == 0 or y == 47)
    return p.out(pal)


# ───── 공룡 정글 ─────
def dino():
    pal = {'S': '#8FD3FF', 's': '#6FB8EA', 'C': '#FFFFFF', 'c': '#DDEBF7', 'Y': '#FFE14D', 'y': '#F2C93A',
           'V': '#8C5A3C', 'v': '#6B4128', 'F': '#FF6B2E', 'f': '#D94E1A', 'K': '#9AA3B8', 'k': '#7A8299',
           'G': '#5CC25C', 'g': '#3E9A44', 'L': '#D8F08A', 'l': '#B8D468', 'W': '#FFFFFF', 'w': '#E3E8F0',
           'E': '#0B0F1A', 'e': '#0B0F1A', 'T': '#2EA85A', 't': '#1D7E42', 'D': '#9A6A3C', 'd': '#77502C',
           'N': '#C9A46A', 'n': '#A9864F', 'R': '#FF9A3C', 'r': '#D8772B'}
    p = Pic('S', lambda x, y: wave(x, y, 0.33, 0.27, 0.51, 0.21) > 0.3)
    p.area(lambda x, y: ell(x, y, 7, 6, 4, 4), 'Y')
    for a in range(8):
        t = a * math.pi / 4
        for r in (5.5, 6.5):
            p.put(7 + r * math.cos(t), 6 + r * math.sin(t), 'Y')
    p.area(lambda x, y: ell(x, y, 22, 4, 5, 1.8) or ell(x, y, 25, 3, 3, 1.4) or ell(x, y, 37, 8, 4, 1.5), 'C', lambda x, y: (x + y) % 3 != 0)
    # 화산
    p.area(lambda x, y: tri(x, y, (50, 13), (38, 42), (62, 42)), 'V', lambda x, y: not ((x + 2 * y) % 6 == 0))
    p.area(lambda x, y: tri(x, y, (50, 13), (46, 20), (54, 20)) or (abs(x - (50 + math.sin(y / 2) * 1.5)) < 1 and 13 <= y <= 30), 'F', lambda x, y: (x + y) % 4 != 0)
    p.area(lambda x, y: ell(x, y, 50, 9, 3, 2.2) or ell(x, y, 53, 5, 3.2, 2.2) or ell(x, y, 57, 2, 3, 1.8), 'K', lambda x, y: (x * 2 + y) % 5 != 0)
    # 야자나무
    for y in range(24, 47):
        x = 6 + math.sin((y - 24) / 8) * 2
        p.put(x, y, 'D', y % 3 != 0); p.put(x + 1, y, 'D')
    for ang in (-2.6, -2.0, -1.2, -0.5, 0.2):
        for r in range(1, 9):
            p.put(7 + r * math.cos(ang), 24 + r * math.sin(ang) + r * r * 0.05, 'T', r % 3 != 0)
            p.put(7 + r * math.cos(ang), 25 + r * math.sin(ang) + r * r * 0.05, 'T')
    # 땅
    p.area(lambda x, y: y >= 41, 'N', lambda x, y: (x * 3 + y * 2 + x // 5) % 7 not in (0, 4))
    for fx in (3, 14, 45, 56):
        for k in range(-3, 4):
            p.put(fx + k, 41 - (3 - abs(k)) * 0.7, 'T')
    # 공룡 (티라노)
    p.area(lambda x, y: x >= 40 and x <= 57 and abs(y - (25 + (x - 40) * 0.55)) <= max(0.6, 3.6 - (x - 40) * 0.2), 'G', lambda x, y: (x + y) % 4 != 0)
    p.area(lambda x, y: ell(x, y, 33, 27, 9, 8), 'G', lambda x, y: not ((x * 2 + y) % 7 == 0))
    p.area(lambda x, y: ell(x, y, 31, 29, 4.2, 5.2), 'L', lambda x, y: y % 2 == 0)
    p.area(lambda x, y: ell(x, y, 27, 19, 4, 5.5), 'G')
    p.area(lambda x, y: ell(x, y, 21, 12, 7.5, 4.6), 'G', lambda x, y: not (x % 4 == 0 and y < 10))
    p.area(lambda x, y: ell(x, y, 20, 16.5, 6.3, 1.9), 'G')
    p.area(lambda x, y: 14 <= x <= 25 and y == 15, 'E', lambda x, y: False)
    for tx in range(15, 25, 2):
        p.put(tx, 14, 'W'); p.put(tx + 1, 16, 'W')
    p.area(lambda x, y: ell(x, y, 23, 10, 1.6, 1.6), 'W')
    p.put(23, 10, 'E', False)
    p.put(15, 10, 'E', False)
    p.area(lambda x, y: 23 <= x <= 25 and 24 <= y <= 25, 'G'); p.put(22, 26, 'W'); p.put(23, 26, 'W')
    p.area(lambda x, y: (28 <= x <= 31 and 33 <= y <= 40) or (35 <= x <= 38 and 32 <= y <= 40), 'G', lambda x, y: y != 37 or x % 2 == 0)
    for fx in (27, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38, 39):
        p.put(fx, 41, 'G')
    for sx in range(28, 46, 3):
        top = 19 + (sx - 28) * 0.15
        p.area(lambda x, y, sx=sx, top=top: tri(x, y, (sx, top - 2.5), (sx - 1.5, top + 1), (sx + 1.5, top + 1)), 'R')
    for sx, sy in ((36, 24), (39, 29), (34, 31), (30, 22)):
        p.area(lambda x, y, sx=sx, sy=sy: ell(x, y, sx, sy, 1.2, 1), 'R')
    # 알
    p.area(lambda x, y: ell(x, y, 47, 45, 2.2, 2.8) or ell(x, y, 51, 46, 2, 2.4), 'W', lambda x, y: (x + y) % 4 != 0)
    return p.out(pal)


# ───── 말랑 친구들 소풍 (이 게임만의 캐릭터) ─────
def friends():
    pal = {'S': '#9ED8FF', 's': '#7FC2EE', 'C': '#FFFFFF', 'c': '#E2EEF9', 'R': '#FF6B6B', 'r': '#E05353',
           'O': '#FFA94D', 'o': '#E58E33', 'Y': '#FFE14D', 'y': '#E8C83A', 'G': '#6FD38A', 'g': '#4CB46B',
           'U': '#6EC6FF', 'u': '#4BA8E8', 'V': '#B58CF0', 'v': '#9570D6', 'P': '#FFB3C7', 'p': '#F08FAA',
           'K': '#FF5C78', 'k': '#E04460', 'W': '#FFFFFF', 'w': '#ECECF4', 'E': '#0B0F1A', 'e': '#0B0F1A',
           'N': '#FF7FA8', 'n': '#F2678F', 'B': '#C98B4F', 'b': '#A06C38', 'L': '#3CC46C', 'l': '#24935A'}
    p = Pic('S', lambda x, y: wave(x, y, 0.29, 0.37, 0.45, 0.19) > 0.25)
    # 무지개
    for k, r in zip('ROYLUV', (27, 26, 25, 24, 23, 22)):
        p.area(lambda x, y, r=r: y < 31 and r - 0.5 <= math.hypot(x - 30, (y - 31) * 1.15) < r + 0.5, k, lambda x, y: (x + y) % 5 != 0)
    p.area(lambda x, y: ell(x, y, 6, 28, 5, 2.6) or ell(x, y, 9, 26, 3, 2) or ell(x, y, 54, 28, 5, 2.6) or ell(x, y, 51, 26, 3, 2)
           or ell(x, y, 12, 7, 5, 2) or ell(x, y, 46, 5, 6, 2) or ell(x, y, 49, 3.5, 3, 1.5), 'C', lambda x, y: (x * 2 + y) % 5 != 0)
    # 언덕
    p.area(lambda x, y: ell(x, y, 12, 52, 24, 14) or ell(x, y, 50, 54, 24, 16), 'G', lambda x, y: (x * 3 + y * 5 + x // 4) % 7 not in (0, 3))
    # 돗자리 (체크무늬)
    p.area(lambda x, y: 38 <= y <= 49 and 8 + (49 - y) * 0.4 <= x <= 52 - (49 - y) * 0.4, 'K', lambda x, y: True)
    for y in range(38, 50):
        for x in range(W):
            if p.kind[y][x] == 'K' and ((x // 3) + (y // 3)) % 2:
                p.kind[y][x] = 'W'
    # 파랑 물방울 친구 '퐁이'
    p.area(lambda x, y: tri(x, y, (16, 22), (11.5, 30), (20.5, 30)) or ell(x, y, 16, 32, 4.8, 4.8), 'U', lambda x, y: not ((x + y) % 6 == 0))
    p.put(14, 27, 'W'); p.put(14, 28, 'W')
    for ex in (14, 18):
        p.put(ex, 31, 'E', False)
    p.put(16, 33, 'E', False); p.put(12, 33, 'N'); p.put(20, 33, 'N')
    # 노랑 말랑이 '몽실이' (머리에 새싹)
    p.area(lambda x, y: ell(x, y, 30, 31, 6.5, 6), 'Y', lambda x, y: not ((x * 2 + y) % 7 == 0))
    for lx, ly in ((30, 24), (30, 23), (29, 22), (28, 22), (31, 22), (32, 21), (33, 21)):
        p.put(lx, ly, 'L')
    for ex in (27, 33):
        p.put(ex, 30, 'E', False); p.put(ex, 31, 'E', False)
    p.put(29, 33, 'E', False); p.put(31, 33, 'E', False); p.put(30, 34, 'E', False)
    p.put(25, 33, 'N'); p.put(26, 33, 'N'); p.put(34, 33, 'N'); p.put(35, 33, 'N')
    # 분홍 복숭아 친구 '보들이'
    p.area(lambda x, y: ell(x, y, 44, 32, 5.3, 5), 'P', lambda x, y: not (x == 44 and y < 30))
    p.put(45, 26, 'L'); p.put(46, 26, 'L'); p.put(46, 25, 'L'); p.put(44, 27, 'B')
    for ex in (42, 46):
        p.put(ex, 32, 'E', False)
    p.put(43, 34, 'E', False); p.put(44, 34, 'E', False); p.put(45, 34, 'E', False)
    p.put(40, 34, 'N'); p.put(48, 34, 'N')
    # 바구니와 사과
    p.area(lambda x, y: 26 <= x <= 34 and 41 <= y <= 45, 'B', lambda x, y: (x + y) % 2 == 0 or y in (41, 45))
    p.area(lambda x, y: 4.2 <= math.hypot(x - 30, (y - 41) * 1.4) <= 5.2 and y < 41, 'B')
    p.area(lambda x, y: ell(x, y, 28, 40, 1.4, 1.2) or ell(x, y, 31.5, 40, 1.4, 1.2), 'R')
    # 나비
    for bx, by, k in ((8, 17, 'V'), (52, 16, 'O')):
        for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1), (-2, -1), (2, -1)):
            p.put(bx + dx, by + dy, k)
        p.put(bx, by, 'E', False); p.put(bx, by - 1, 'E', False)
    return p.out(pal)


# ───── 디저트 가게 ─────
def dessert():
    pal = {'P': '#FFB3C7', 'p': '#F29AB2', 'A': '#7FE3C7', 'a': '#5CC9AA', 'W': '#FFF6EC', 'w': '#EAD9C8',
           'R': '#FF4F6E', 'r': '#D93A58', 'B': '#F6C98A', 'b': '#DFAE6C', 'C': '#8A5634', 'c': '#6A3F24',
           'Y': '#FFE14D', 'y': '#E8C83A', 'M': '#9EF0C8', 'm': '#7AD9AE', 'K': '#E0A15A', 'k': '#BE8240',
           'T': '#8A5A3C', 't': '#6B4128', 'U': '#6EC6FF', 'u': '#4BA8E8', 'G': '#3CC46C', 'g': '#24935A',
           'N': '#FF9A3C', 'n': '#D8772B', 'E': '#0B0F1A', 'e': '#0B0F1A'}
    p = Pic('P', lambda x, y: (x // 3) % 2 == 0 or (x + y) % 5 == 0)
    # 차양
    p.area(lambda x, y: y <= 4 or (y == 5 and x % 4 in (1, 2)), 'A', lambda x, y: True)
    for y in range(0, 6):
        for x in range(W):
            if p.kind[y][x] == 'A' and (x // 4) % 2:
                p.kind[y][x] = 'W'
    # 케이크
    p.area(lambda x, y: 16 <= x <= 44 and 30 <= y <= 41, 'B', lambda x, y: (x + y) % 5 != 0)
    p.area(lambda x, y: 16 <= x <= 44 and y in (34, 38), 'W', lambda x, y: x % 3 != 0)
    p.area(lambda x, y: 16 <= x <= 44 and (y == 29 or (y in (30, 31) and x % 4 == 0)), 'W')
    p.area(lambda x, y: 21 <= x <= 39 and 20 <= y <= 28, 'B', lambda x, y: (x * 2 + y) % 5 != 0)
    p.area(lambda x, y: 21 <= x <= 39 and y == 24, 'R', lambda x, y: x % 2 == 0)
    p.area(lambda x, y: 20 <= x <= 40 and (y == 19 or (y in (20, 21) and x % 3 == 1)), 'W')
    for sx in (24, 30, 36):
        p.area(lambda x, y, sx=sx: ell(x, y, sx, 17, 1.8, 1.6), 'R', lambda x, y: (x + y) % 3 != 0)
        p.put(sx, 15, 'G'); p.put(sx - 1, 15, 'G')
    p.area(lambda x, y: x in (30, 31) and 9 <= y <= 14, 'U', lambda x, y: y % 2 == 0 or x == 30)
    p.area(lambda x, y: ell(x, y, 30.5, 7, 1.1, 1.6), 'Y')
    for sx, sy in ((19, 32), (27, 33), (35, 31), (42, 33), (23, 36), (39, 36), (25, 26), (34, 22)):
        p.put(sx, sy, 'N')
    p.area(lambda x, y: ell(x, y, 30, 42, 17, 1.4), 'U')
    # 아이스크림
    p.area(lambda x, y: tri(x, y, (8, 46), (3.5, 32), (12.5, 32)), 'K', lambda x, y: (x + y) % 3 != 0 and (x - y) % 3 != 0)
    p.area(lambda x, y: ell(x, y, 8, 29.5, 4.6, 3.4), 'M', lambda x, y: (x * 2 + y) % 5 != 0)
    p.area(lambda x, y: ell(x, y, 8, 24.5, 4, 3.2), 'C', lambda x, y: (x + y) % 4 != 0)
    p.area(lambda x, y: ell(x, y, 8, 20, 1.4, 1.4), 'R'); p.put(9, 18, 'G')
    # 컵케이크
    p.area(lambda x, y: 36 <= y <= 44 and 47 + (y - 36) * 0.3 <= x <= 57 - (y - 36) * 0.3, 'U', lambda x, y: x % 2 == 0)
    p.area(lambda x, y: ell(x, y, 52, 34, 5.5, 2.6) or ell(x, y, 52, 31, 4.2, 2.1) or ell(x, y, 52, 28.5, 2.8, 1.6), 'W', lambda x, y: (x + y) % 3 != 0)
    for sx, sy in ((49, 33), (54, 32), (51, 30), (53, 35)):
        p.put(sx, sy, 'R')
    p.area(lambda x, y: ell(x, y, 52, 26, 1.3, 1.3), 'R')
    # 선반 위 병
    p.area(lambda x, y: y == 13 and (x <= 14 or x >= 46), 'T')
    for jx, k in ((3, 'Y'), (8, 'M'), (12, 'R'), (48, 'N'), (52, 'U'), (56, 'Y')):
        p.area(lambda x, y, jx=jx: jx - 1 <= x <= jx + 1 and 9 <= y <= 12, k, lambda x, y: y != 9 or x != jx)
    # 탁자
    p.area(lambda x, y: y >= 44 and p.kind[y][x] == 'P', 'T', lambda x, y: (x + y // 2) % 6 != 0)
    p.area(lambda x, y: ell(x, y, 20, 46.5, 3.2, 1.7) and not ell(x, y, 20, 46.5, 1.2, 0.6), 'N', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: ell(x, y, 40, 46.5, 3.2, 1.7) and not ell(x, y, 40, 46.5, 1.2, 0.6), 'C', lambda x, y: (x + y) % 3 != 1)
    return p.out(pal)


# ───── 눈사람 마을 ─────
def winter():
    pal = {'S': '#2F3F86', 's': '#1F2B66', 'W': '#F4F8FF', 'w': '#CBD6EE', 'K': '#2A2F45', 'k': '#1A1E30',
           'R': '#E2504C', 'r': '#B23B3B', 'O': '#FF9A3C', 'o': '#D8772B', 'E': '#0B0F1A', 'e': '#0B0F1A',
           'H': '#C98B5A', 'h': '#A86E42', 'D': '#7A4A2B', 'd': '#5C3620', 'Y': '#FFE14D', 'y': '#E8C83A',
           'T': '#2E8A5A', 't': '#1D6644', 'U': '#5CF0B8', 'u': '#3CC995', 'M': '#FFF2B0', 'm': '#E9D88A',
           'G': '#B58CF0', 'g': '#9570D6', 'B': '#8A5A3C', 'b': '#6B4128'}
    p = Pic('S', lambda x, y: wave(x, y, 0.41, 0.35, 0.63, 0.27) > 0.25)
    p.area(lambda x, y: abs(y - (6 + 3 * math.sin(x / 6.0))) <= 1.4 and y < 14, 'U', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: abs(y - (10 + 2 * math.sin(x / 5.0 + 1))) <= 0.8 and y < 14, 'U')
    p.area(lambda x, y: ell(x, y, 52, 18, 3.6, 3.6), 'M', lambda x, y: not ell(x, y, 51, 17, 0.9, 0.9))
    for i in range(70):
        x, y = (i * 37) % 60, (i * 23) % 42
        if p.kind[y][x] == 'S':
            p.put(x, y, 'W')
    # 집 두 채
    for x0, x1, top in ((1, 16, 28), (44, 58, 26)):
        cx = (x0 + x1) / 2
        p.area(lambda x, y, x0=x0, x1=x1, top=top: x0 <= x <= x1 and top + 6 <= y <= 43, 'H', lambda x, y: (y % 3) != 0)
        p.area(lambda x, y, x0=x0, x1=x1, top=top, cx=cx: tri(x, y, (cx, top - 2), (x0 - 2, top + 6), (x1 + 2, top + 6)), 'D', lambda x, y: (x + y) % 4 != 0)
        p.area(lambda x, y, x0=x0, x1=x1, top=top, cx=cx: tri(x, y, (cx, top - 3), (x0 - 2.5, top + 5), (x1 + 2.5, top + 5)) and not tri(x, y, (cx, top - 1), (x0 - 1, top + 5), (x1 + 1, top + 5)), 'W')
        wx = x0 + 2
        p.area(lambda x, y, wx=wx, top=top: wx <= x <= wx + 4 and top + 9 <= y <= top + 13, 'Y', lambda x, y, wx=wx, top=top: x != wx + 2 and y != top + 11)
        p.area(lambda x, y, x1=x1, top=top: x1 - 5 <= x <= x1 - 2 and top + 10 <= y <= 43, 'D', lambda x, y, x1=x1: x != x1 - 3 or y % 2 == 0)
    # 전나무
    for tx in (20, 40):
        for k, (yt, w) in enumerate(((20, 3), (25, 4.5), (30, 6))):
            p.area(lambda x, y, tx=tx, yt=yt, w=w: tri(x, y, (tx, yt), (tx - w, yt + 7), (tx + w, yt + 7)), 'T', lambda x, y: (x * 2 + y) % 5 != 0)
            p.area(lambda x, y, tx=tx, yt=yt: abs(x - tx) <= 1 and yt <= y <= yt + 1, 'W')
        p.area(lambda x, y, tx=tx: tx - 1 <= x <= tx and 37 <= y <= 42, 'B')
    # 눈 땅
    p.area(lambda x, y: y >= 43, 'W', lambda x, y: (x * 3 + y * 2) % 7 not in (0, 4))
    # 눈사람
    p.area(lambda x, y: ell(x, y, 30, 39, 7, 6), 'W', lambda x, y: not ((x + 2 * y) % 6 == 0 and x > 30))
    p.area(lambda x, y: ell(x, y, 30, 28.5, 5.2, 4.8), 'W', lambda x, y: not ((x + y) % 6 == 0 and x > 30))
    p.area(lambda x, y: ell(x, y, 30, 19.5, 4.2, 4), 'W', lambda x, y: not ((x * 2 + y) % 7 == 0 and x > 31))
    p.area(lambda x, y: 25 <= x <= 35 and y == 16, 'K')
    p.area(lambda x, y: 27 <= x <= 33 and 10 <= y <= 15, 'K', lambda x, y: y != 14)
    p.area(lambda x, y: 27 <= x <= 33 and y == 14, 'R')
    for ex in (28, 32):
        p.put(ex, 19, 'E', False)
    p.area(lambda x, y: 30 <= x <= 34 and y == 21 and (x < 33 or True), 'O', lambda x, y: True)
    for mx in (28, 29, 31, 32):
        p.put(mx, 23 if mx in (28, 32) else 24, 'E', False)
    p.area(lambda x, y: 25 <= x <= 35 and 24.5 <= y <= 25.5, 'R', lambda x, y: x % 2 == 0 or y == 25)
    p.area(lambda x, y: 33 <= x <= 34 and 26 <= y <= 30, 'R', lambda x, y: y % 2 == 0 or x == 33)
    for by in (28, 31, 37):
        p.put(30, by, 'E', False)
    for k in range(7):
        p.put(24 - k, 28 - k * 0.6, 'B'); p.put(36 + k, 28 - k * 0.6, 'B')
    p.put(19, 24, 'B'); p.put(41, 24, 'B')
    # 선물 상자
    for gx in (18, 41):
        p.area(lambda x, y, gx=gx: gx <= x <= gx + 4 and 41 <= y <= 45, 'G', lambda x, y, gx=gx: x != gx + 2 and y != 43)
        p.area(lambda x, y, gx=gx: (x == gx + 2 and 41 <= y <= 45) or (gx <= x <= gx + 4 and y == 43), 'Y')
        p.put(gx + 1, 40, 'Y'); p.put(gx + 3, 40, 'Y')
    return p.out(pal)


SCENES = [
    ('owl-forest', '부엉이 숲', owl, None),
    ('rocket', '로켓 발사', rocket, None),
    ('octopus', '바닷속 문어', octopus, None),
    ('dino', '공룡 정글', dino, None),
    ('friends', '말랑 친구들 소풍', friends, {'16': [1, 1], '20': [1, 1], '25': [1, 0]}),
    ('dessert', '디저트 가게', dessert, {'16': [1, 1], '20': [1, 1], '25': [1, 0]}),
    ('winter', '눈사람 마을', winter, {'16': [1, 1], '20': [1, 1], '25': [1, 0]}),
]
