"""그림 장면 2차: 계절, 우리나라, 판타지, 동물·자연·과학.
규칙은 scenes.py와 같다 (60×50, 대문자는 칠하는 칸, 소문자는 같은 영역의 빈칸 색).
"""
import math
from scenes import Pic, ell, tri, wave, W, H

leafy = lambda x, y: math.sin(x * 1.7 + y * 0.6) + math.sin(y * 1.9 - x * 0.4) > -0.8
grass = lambda x, y: (x * 3 + y * 5 + x // 4) % 7 not in (0, 3)


# ───── 벚꽃길 소풍 ─────
def cherry():
    pal = {'S': '#A8DCFF', 's': '#86C6F0', 'P': '#FFB3CF', 'p': '#F294B8', 'W': '#FFF0F6', 'w': '#F5D6E3',
           'D': '#7A4E33', 'd': '#5C3820', 'G': '#7FD68F', 'g': '#5AB86D', 'N': '#E8C99A', 'n': '#CDAA78',
           'B': '#C98B4F', 'b': '#A06C38', 'R': '#FF5C78', 'r': '#E04460', 'Y': '#FFE14D', 'y': '#E8C83A',
           'C': '#FFFFFF', 'c': '#E2EEF9', 'K': '#3A4466', 'k': '#2A3150'}
    p = Pic('S', lambda x, y: wave(x, y, 0.31, 0.29, 0.47, 0.21) > 0.3)
    p.area(lambda x, y: ell(x, y, 30, 6, 6, 2) or ell(x, y, 33, 4.5, 3, 1.5), 'C', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: y >= 26, 'G', grass)
    p.area(lambda x, y: y >= 26 and abs(x - 30) <= 2 + (y - 26) * 0.75, 'N', lambda x, y: (x + 2 * y) % 5 != 0)
    for tx in (6, 54, 15, 45):
        top = 8 if tx in (6, 54) else 14
        p.area(lambda x, y, tx=tx, top=top: abs(x - tx) <= 1 and top + 6 <= y <= 40, 'D', lambda x, y: y % 4 != 0)
    for cx, cy, rx, ry in ((6, 12, 9, 8), (54, 12, 9, 8), (15, 17, 6, 5), (45, 17, 6, 5), (20, 8, 6, 4), (40, 8, 6, 4)):
        p.area(lambda x, y, cx=cx, cy=cy, rx=rx, ry=ry: ell(x, y, cx, cy, rx, ry), 'P', leafy)
        for k in range(6):
            p.put(cx + rx * 0.6 * math.cos(k * 1.1 + cx), cy + ry * 0.6 * math.sin(k * 1.1 + cx), 'W')
    # 벤치와 도시락
    p.area(lambda x, y: 22 <= x <= 38 and y in (36, 37), 'B', lambda x, y: x % 3 != 0)
    p.area(lambda x, y: (x in (23, 37)) and 38 <= y <= 41, 'B')
    p.area(lambda x, y: 22 <= x <= 38 and y == 33, 'B')
    p.area(lambda x, y: x in (22, 38) and 33 <= y <= 36, 'B')
    p.area(lambda x, y: 27 <= x <= 33 and 34 <= y <= 35, 'R', lambda x, y: x != 30)
    p.put(30, 33, 'Y')
    # 떨어지는 꽃잎
    for i in range(26):
        x, y = (i * 17 + 5) % 60, (i * 11 + 3) % 44
        if p.kind[y][x] in 'SG':
            p.put(x, y, 'P')
    p.area(lambda x, y: y >= 47 and (x * 7 + y) % 9 == 0, 'Y')
    return p.out(pal)


# ───── 단풍 숲 다람쥐 ─────
def autumn():
    pal = {'S': '#FFD9A0', 's': '#F2C27E', 'R': '#E84A3A', 'r': '#C23628', 'O': '#FF9A3C', 'o': '#D8772B',
           'Y': '#FFD23F', 'y': '#E3B52A', 'D': '#7A4E33', 'd': '#5C3820', 'B': '#B5703F', 'b': '#8F542B',
           'L': '#F5D6A8', 'l': '#DDB986', 'E': '#0B0F1A', 'e': '#0B0F1A', 'N': '#A6744A', 'n': '#855A34',
           'G': '#9C8A3A', 'g': '#7C6C28', 'W': '#FFFFFF', 'w': '#E8E8F0', 'K': '#6B4A2E', 'k': '#4E341E'}
    p = Pic('S', lambda x, y: wave(x, y, 0.29, 0.33, 0.43, 0.25) > 0.35)
    for tx, cx, cy, k in ((4, 4, 10, 'R'), (56, 56, 9, 'O'), (14, 14, 6, 'Y'), (46, 46, 6, 'R')):
        p.area(lambda x, y, tx=tx: tx - 1 <= x <= tx + 1 and 8 <= y <= 44, 'D', lambda x, y: y % 4 != 1)
        p.area(lambda x, y, cx=cx, cy=cy: ell(x, y, cx, cy, 8, 7) or ell(x, y, cx + 3, cy + 6, 5, 4), k, leafy)
    p.area(lambda x, y: ell(x, y, 30, 3, 10, 4), 'O', leafy)
    p.area(lambda x, y: y >= 42, 'G', grass)
    for i in range(40):
        x, y = (i * 13 + 2) % 60, 41 + (i * 7) % 9
        p.put(x, y, 'ROY'[i % 3])
    # 그루터기
    p.area(lambda x, y: 20 <= x <= 40 and 34 <= y <= 43, 'K', lambda x, y: (x - 20) % 4 != 0)
    p.area(lambda x, y: ell(x, y, 30, 34, 10.5, 2), 'N', lambda x, y: (abs(x - 30) + y) % 3 != 0)
    # 다람쥐
    p.area(lambda x, y: ell(x, y, 37, 20, 5.5, 8.5) and not ell(x, y, 33.5, 22, 3.5, 6), 'B', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: ell(x, y, 28, 27, 5, 6.5), 'B', lambda x, y: not ((x * 2 + y) % 7 == 0))
    p.area(lambda x, y: ell(x, y, 27, 28.5, 2.6, 4), 'L', lambda x, y: y % 2 == 0)
    p.area(lambda x, y: ell(x, y, 27, 18, 4.4, 4), 'B')
    p.area(lambda x, y: tri(x, y, (23.5, 12), (23, 16), (26, 15)) or tri(x, y, (30.5, 12), (31, 16), (28, 15)), 'B')
    p.area(lambda x, y: ell(x, y, 26, 20, 2, 1.4), 'L')
    p.put(25, 17, 'E', False); p.put(29, 17, 'E', False); p.put(26, 19, 'E', False)
    # 도토리
    p.area(lambda x, y: ell(x, y, 25, 25, 2.2, 2.4), 'O', lambda x, y: True)
    p.area(lambda x, y: ell(x, y, 25, 23, 2.4, 1.2), 'K')
    p.put(25, 21, 'K')
    for fx in (25, 26, 30, 31):
        p.put(fx, 34, 'B')
    # 버섯
    for mx in (12, 48):
        p.area(lambda x, y, mx=mx: ell(x, y, mx, 41, 3, 1.8) and y <= 41, 'R', lambda x, y: (x + y) % 3 != 0)
        p.put(mx, 42, 'L'); p.put(mx, 43, 'L')
    return p.out(pal)


# ───── 추석 보름달 토끼 ─────
def chuseok():
    pal = {'S': '#27346E', 's': '#18214A', 'M': '#FFF0A8', 'm': '#EAD685', 'W': '#FFFFFF', 'w': '#DDE3F2',
           'P': '#FF9EC0', 'p': '#E880A4', 'E': '#0B0F1A', 'e': '#0B0F1A', 'G': '#8FDC7A', 'g': '#6CBE59',
           'Y': '#FFE14D', 'y': '#E8C83A', 'O': '#FF8A3C', 'o': '#D96A26', 'D': '#6B4428', 'd': '#4E301B',
           'T': '#2E8A5A', 't': '#1D6644', 'K': '#3A3F5C', 'k': '#2A2E45', 'H': '#E8D6B8', 'h': '#CDB894',
           'U': '#6EC6FF', 'u': '#4BA8E8', 'R': '#E2504C', 'r': '#B23B3B'}
    p = Pic('S', lambda x, y: wave(x, y) > 0.2)
    for sx, sy, big in [(5, 4, 1), (52, 3, 0), (10, 16, 0), (55, 14, 1), (46, 22, 0), (3, 25, 0), (20, 2, 0)]:
        p.star(sx, sy, 'Y', big)
    p.area(lambda x, y: ell(x, y, 30, 15, 13, 13), 'M', lambda x, y: not (ell(x, y, 25, 10, 2.5, 2) or ell(x, y, 36, 19, 3, 2.4) or ell(x, y, 34, 8, 1.5, 1.5)))
    # 감나무 가지
    for x in range(0, 20):
        y = 3 + x * 0.35 + math.sin(x / 3)
        p.put(x, y, 'D'); p.put(x, y + 1, 'D', x % 3 != 0)
    for fx, fy in ((4, 7), (9, 9), (14, 10), (7, 4), (17, 13)):
        p.area(lambda x, y, fx=fx, fy=fy: ell(x, y, fx, fy, 1.6, 1.5), 'O')
        p.put(fx, fy - 2, 'T')
    p.area(lambda x, y: ell(x, y, 11, 5, 2, 1.2) or ell(x, y, 16, 8, 2, 1), 'T')
    # 언덕과 기와지붕
    p.area(lambda x, y: y >= 36 and y >= 36 + 4 * math.sin(x / 9.0), 'G', grass)
    p.area(lambda x, y: 38 <= y <= 49 and (x <= 13 or x >= 47), 'H', lambda x, y: (y % 3) != 0 and x % 5 != 0)
    for x0, x1 in ((-3, 16), (44, 63)):
        p.area(lambda x, y, x0=x0, x1=x1: 33 <= y <= 38 and x0 + (38 - y) * 0.6 <= x <= x1 - (38 - y) * 0.6, 'K', lambda x, y: (x + y) % 2 == 0 or y in (33, 38))
    # 토끼
    p.area(lambda x, y: ell(x, y, 30, 35, 6, 6), 'W', lambda x, y: not ((x + 2 * y) % 7 == 0))
    p.area(lambda x, y: ell(x, y, 30, 26, 4.5, 4), 'W')
    p.area(lambda x, y: ell(x, y, 27.5, 18.5, 1.3, 4.2) or ell(x, y, 32.5, 18.5, 1.3, 4.2), 'W')
    p.area(lambda x, y: ell(x, y, 27.5, 18.5, 0.6, 3) or ell(x, y, 32.5, 18.5, 0.6, 3), 'P')
    p.put(28, 26, 'E', False); p.put(32, 26, 'E', False); p.put(30, 27, 'P'); p.put(26, 28, 'P'); p.put(34, 28, 'P')
    # 송편 접시
    p.area(lambda x, y: ell(x, y, 30, 41, 7, 1.6), 'U', lambda x, y: (x + y) % 2 == 0)
    for sx, k in ((26, 'W'), (29, 'P'), (32, 'G'), (35, 'Y'), (27.5, 'G'), (30.5, 'W'), (33.5, 'P')):
        sy = 39 if sx in (26, 29, 32, 35) else 37.5
        p.area(lambda x, y, sx=sx, sy=sy: ell(x, y, sx, sy, 1.6, 1.1), k)
    return p.out(pal)


# ───── 경복궁과 한복 ─────
def palace():
    pal = {'S': '#9ED8FF', 's': '#7FC2EE', 'C': '#FFFFFF', 'c': '#E2EEF9', 'M': '#6F9A82', 'm': '#557C66',
           'K': '#4A5468', 'k': '#363E50', 'U': '#3FB8A0', 'u': '#2A9480', 'R': '#C8432E', 'r': '#A33322',
           'Y': '#FFD23F', 'y': '#E3B52A', 'H': '#E6DCC8', 'h': '#C9BEA6', 'D': '#7A4E33', 'd': '#5C3820',
           'G': '#CFC6B4', 'g': '#AFA691', 'P': '#FF6F91', 'p': '#E0567A', 'B': '#4F7BE8', 'b': '#3A60C4',
           'L': '#FFE3C2', 'l': '#F1C99C', 'E': '#0B0F1A', 'e': '#0B0F1A', 'T': '#3CC46C', 't': '#24935A'}
    p = Pic('S', lambda x, y: wave(x, y, 0.29, 0.37, 0.45, 0.19) > 0.3)
    p.area(lambda x, y: ell(x, y, 10, 5, 5, 1.8) or ell(x, y, 48, 4, 6, 2), 'C', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: y >= 18 - 8 * math.exp(-((x - 30) / 12) ** 2) + 2 * math.sin(x / 4), 'M', leafy)
    # 기단과 건물
    p.area(lambda x, y: 6 <= x <= 54 and 33 <= y <= 36, 'G', lambda x, y: (x + y * 3) % 5 != 0)
    p.area(lambda x, y: 12 <= x <= 48 and 24 <= y <= 32, 'R', lambda x, y: not (x % 5 == 2 and y > 25))
    p.area(lambda x, y: 12 <= x <= 48 and 24 <= y <= 25, 'U', lambda x, y: (x // 2) % 2 == 0)
    for dx in range(15, 47, 6):
        p.area(lambda x, y, dx=dx: dx <= x <= dx + 2 and 27 <= y <= 32, 'D', lambda x, y: (x + y) % 2 == 0)
    # 기와지붕 두 겹 (끝이 살짝 올라감)
    for y0, half, h in ((12, 18, 5), (18, 24, 6)):
        p.area(lambda x, y, y0=y0, half=half, h=h: y0 <= y <= y0 + h and abs(x - 30) <= half + (y - y0) * 0.9 - (2 if y == y0 + h else 0), 'K', lambda x, y: (x % 2 == 0) or y % 2 == 0)
        p.put(30 - half - h - 1, y0 + h - 2, 'K'); p.put(30 + half + h + 1, y0 + h - 2, 'K')
    p.area(lambda x, y: 18 <= x <= 42 and y == 17, 'U', lambda x, y: x % 3 != 0)
    p.area(lambda x, y: 20 <= x <= 40 and y == 11, 'K')
    # 마당
    p.area(lambda x, y: y >= 37, 'H', lambda x, y: (x * 2 + y * 3) % 7 not in (0, 3))
    # 한복 입은 아이 둘
    for cx, top, bottom, skirt in ((22, 'Y', 'P', True), (38, 'T', 'B', False)):
        p.area(lambda x, y, cx=cx: ell(x, y, cx, 38, 2.2, 2.2), 'L')
        p.area(lambda x, y, cx=cx: ell(x, y, cx, 37, 2.4, 1.3) and y <= 37, 'E', lambda x, y: False)
        p.put(cx - 1, 38, 'E', False); p.put(cx + 1, 38, 'E', False)
        p.area(lambda x, y, cx=cx: abs(x - cx) <= 2.5 and 41 <= y <= 43, top, lambda x, y, cx=cx: x != cx)
        p.put(cx, 42, 'R')
        if skirt:
            p.area(lambda x, y, cx=cx: 44 <= y <= 49 and abs(x - cx) <= 2 + (y - 44) * 0.6, bottom, lambda x, y: y % 3 != 0)
        else:
            p.area(lambda x, y, cx=cx: 44 <= y <= 48 and abs(x - cx) <= 2.5 and x != cx, bottom, lambda x, y: y != 46)
            p.put(cx - 2, 49, 'E', False); p.put(cx + 2, 49, 'E', False)
    return p.out(pal)


# ───── 거북선 ─────
def turtle_ship():
    pal = {'S': '#A8DCFF', 's': '#86C6F0', 'C': '#FFFFFF', 'c': '#E2EEF9', 'A': '#2E7FC4', 'a': '#1E5F9E',
           'V': '#69B3E8', 'v': '#4C97D2', 'D': '#8A5634', 'd': '#6A3F24', 'K': '#4A5468', 'k': '#363E50',
           'R': '#E2504C', 'r': '#B23B3B', 'Y': '#FFD23F', 'y': '#E3B52A', 'W': '#F4F4F4', 'w': '#D4D8E0',
           'E': '#0B0F1A', 'e': '#0B0F1A', 'T': '#3CA86A', 't': '#24804D', 'G': '#9AA3B8', 'g': '#7A8299'}
    p = Pic('S', lambda x, y: wave(x, y, 0.31, 0.29, 0.47, 0.21) > 0.3)
    p.area(lambda x, y: ell(x, y, 10, 5, 6, 2) or ell(x, y, 50, 7, 5, 1.8) or ell(x, y, 53, 5.5, 3, 1.4), 'C', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: ell(x, y, 52, 27, 9, 5) and y <= 27, 'T', leafy)
    for gx, gy in ((20, 8), (24, 6), (40, 12)):
        p.put(gx - 1, gy, 'W'); p.put(gx + 1, gy, 'W'); p.put(gx, gy + 1, 'W')
    p.area(lambda x, y: y >= 27, 'A', lambda x, y: wave(x, y, 0.5, 0.7, 0.3, 0.4) > 0.1)
    p.area(lambda x, y: y >= 27 and (y % 4 == 1) and (x + y // 4 * 3) % 8 < 4, 'V')
    # 돛대와 돛
    for mx in (24, 36):
        p.area(lambda x, y, mx=mx: x == mx and 4 <= y <= 22, 'D')
        p.area(lambda x, y, mx=mx: mx - 5 <= x <= mx + 5 and 6 <= y <= 18, 'R', lambda x, y, mx=mx: (y // 2) % 2 == 0 or abs(x - mx) > 4)
        p.area(lambda x, y, mx=mx: mx - 5 <= x <= mx + 5 and 6 <= y <= 18 and (y // 2) % 2 == 1, 'W', lambda x, y: x % 3 != 0)
    # 선체
    p.area(lambda x, y: 28 <= y <= 36 and 10 + (36 - y) * -0.6 + 2 <= x <= 50 - (y - 28) * 0.4, 'D', lambda x, y: (y % 3) != 0)
    # 거북 등 지붕 (뾰족한 쇠못)
    p.area(lambda x, y: 20 <= y <= 28 and ell(x, y, 30, 28, 18, 8), 'K', lambda x, y: (x + (y // 2) * 2) % 4 != 0)
    for sx in range(14, 47, 3):
        top = 28 - 8 * math.sqrt(max(0, 1 - ((sx - 30) / 18) ** 2))
        p.put(sx, top - 1, 'G'); p.put(sx, top - 2, 'G', sx % 2 == 0)
    # 용머리
    p.area(lambda x, y: ell(x, y, 9, 26, 4, 3), 'R', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: 4 <= x <= 7 and 27 <= y <= 28, 'Y')
    p.put(8, 24, 'E', False); p.put(10, 23, 'Y'); p.put(11, 22, 'Y')
    p.area(lambda x, y: 11 <= x <= 13 and 27 <= y <= 30, 'R')
    # 노
    for ox in range(16, 46, 4):
        for k in range(5):
            p.put(ox - k * 0.5, 36 + k, 'D')
    return p.out(pal)


# ───── 한강 불꽃놀이 ─────
def fireworks():
    pal = {'S': '#1F2860', 's': '#121A44', 'R': '#FF5C78', 'r': '#E04460', 'Y': '#FFE14D', 'y': '#E8C83A',
           'U': '#6EC6FF', 'u': '#4BA8E8', 'G': '#5CF0A0', 'g': '#3CC97E', 'V': '#C08CFF', 'v': '#A070E0',
           'K': '#3A4466', 'k': '#2A3150', 'L': '#FFD98A', 'l': '#E8BE68', 'A': '#2A4A8A', 'a': '#1D3570',
           'B': '#8A93C2', 'b': '#6B739E', 'O': '#FF9A3C', 'o': '#D8772B'}
    p = Pic('S', lambda x, y: wave(x, y, 0.55, 0.41, 0.63, 0.31) > 0.45)
    for cx, cy, r, k in ((15, 9, 7, 'R'), (32, 6, 6, 'Y'), (47, 11, 7, 'U'), (24, 17, 5, 'G'), (54, 3, 4, 'V'), (6, 3, 3.5, 'O')):
        for a in range(16):
            t = a * math.pi / 8
            for rr in range(1, int(r) + 1):
                if rr > 1 or a % 2 == 0:
                    p.put(cx + rr * math.cos(t), cy + rr * math.sin(t), k, (rr + a) % 3 != 0 or rr == int(r))
        p.put(cx, cy, 'Y')
    # 도시
    for bx, bw, bh in ((0, 5, 12), (5, 4, 8), (9, 6, 15), (15, 4, 10), (19, 5, 18), (24, 3, 9), (27, 6, 13), (33, 4, 20), (37, 5, 11), (42, 6, 16), (48, 4, 9), (52, 8, 14)):
        p.area(lambda x, y, bx=bx, bw=bw, bh=bh: bx <= x < bx + bw and 36 - bh <= y <= 35, 'K', lambda x, y: True)
        p.area(lambda x, y, bx=bx, bw=bw, bh=bh: bx < x < bx + bw - 1 and 36 - bh < y <= 34 and (x + y) % 3 == 0 and y % 2 == 0, 'L')
    p.area(lambda x, y: 35 <= x <= 35 and 10 <= y <= 15, 'B')
    # 강과 다리
    p.area(lambda x, y: y >= 38, 'A', lambda x, y: wave(x, y, 0.8, 0.9, 0.2, 0.5) > 0.2)
    p.area(lambda x, y: y == 37, 'B')
    p.area(lambda x, y: 32 <= y <= 33, 'B', lambda x, y: x % 6 != 0)
    for ax in range(0, 60, 12):
        p.area(lambda x, y, ax=ax: 34 <= y <= 37 and abs(x - ax - 6) >= 5 - (37 - y) * 1.2, 'B', lambda x, y: True)
    for i in range(30):
        x = (i * 7) % 60
        y = 39 + (i * 5) % 10
        p.put(x, y, 'RYUGV'[i % 5])
    return p.out(pal)


# ───── 성과 용 ─────
def castle():
    pal = {'S': '#FFB38A', 's': '#F29670', 'V': '#B58CF0', 'v': '#9570D6', 'Y': '#FFE14D', 'y': '#E8C83A',
           'K': '#9AA3B8', 'k': '#7A8299', 'D': '#6B7393', 'd': '#525A78', 'R': '#E2504C', 'r': '#B23B3B',
           'U': '#4FC3FF', 'u': '#2B8FC4', 'G': '#5CC25C', 'g': '#3E9A44', 'L': '#D8F08A', 'l': '#B8D468',
           'M': '#7A6A9C', 'm': '#5E5080', 'E': '#0B0F1A', 'e': '#0B0F1A', 'W': '#FFFFFF', 'w': '#E3E8F0',
           'B': '#7A4E33', 'b': '#5C3820', 'O': '#FF8A3C', 'o': '#D96A26'}
    p = Pic('S', lambda x, y: wave(x, y, 0.31, 0.29, 0.47, 0.21) > 0.3)
    p.area(lambda x, y: y < 12 and wave(x, y, 0.2, 0.5, 0.3, 0.1) > 0.8, 'V')
    p.area(lambda x, y: ell(x, y, 8, 24, 5, 5) and y <= 24, 'Y')
    p.area(lambda x, y: y >= 22 + 6 * math.sin(x / 7.0 + 1) + 3 * math.sin(x / 3.0), 'M', leafy)
    p.area(lambda x, y: y >= 42, 'G', grass)
    # 성
    p.area(lambda x, y: 18 <= x <= 42 and 26 <= y <= 43, 'K', lambda x, y: not (y % 3 == 0 or (x + (y // 3) * 2) % 5 == 0))
    for tx in (16, 28, 40):
        top = 12 if tx == 28 else 18
        p.area(lambda x, y, tx=tx, top=top: tx - 3 <= x <= tx + 4 and top <= y <= 43, 'D', lambda x, y: not (y % 3 == 0 or (x + y // 3) % 4 == 0))
        p.area(lambda x, y, tx=tx, top=top: tri(x, y, (tx + 0.5, top - 7), (tx - 4.5, top), (tx + 5.5, top)), 'U', lambda x, y: (x + y) % 3 != 0)
        p.area(lambda x, y, tx=tx, top=top: x == tx and top - 11 <= y <= top - 7, 'B')
        p.area(lambda x, y, tx=tx, top=top: tx + 1 <= x <= tx + 3 and top - 11 <= y <= top - 9, 'R')
        p.area(lambda x, y, tx=tx, top=top: tx - 1 <= x <= tx + 2 and top + 4 <= y <= top + 6, 'Y', lambda x, y, tx=tx: x not in (tx, tx + 1) or True)
    for bx in range(18, 43, 2):
        p.put(bx, 25, 'K')
    p.area(lambda x, y: 25 <= x <= 32 and 35 <= y <= 43 and (y >= 37 or ell(x, y, 28.5, 37, 3.6, 2.5)), 'B', lambda x, y: x % 2 == 0)
    # 용 (오른쪽 위를 날고 있음)
    p.area(lambda x, y: ell(x, y, 50, 12, 6, 2.6), 'G', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: ell(x, y, 50.5, 13.5, 4, 1), 'L')
    p.area(lambda x, y: tri(x, y, (47, 10), (42, 2), (53, 9)), 'G', lambda x, y: (x - y) % 3 != 0)
    p.area(lambda x, y: ell(x, y, 57, 9, 2.8, 2), 'G')
    p.put(58, 8, 'E', False); p.put(56, 6, 'G'); p.put(55, 7, 'G')
    for k in range(9):
        p.put(44 - k, 13 + k * 0.4 + math.sin(k) * 0.7, 'G'); p.put(44 - k, 14 + k * 0.4, 'G', k % 2 == 0)
    for k, c in ((1, 'O'), (2, 'Y'), (3, 'O')):
        p.put(59, 9 + k * 0.5, c)
    return p.out(pal)


# ───── 해적선과 보물섬 ─────
def pirate():
    pal = {'S': '#A8DCFF', 's': '#86C6F0', 'C': '#FFFFFF', 'c': '#E2EEF9', 'A': '#2E7FC4', 'a': '#1E5F9E',
           'V': '#69B3E8', 'v': '#4C97D2', 'D': '#8A5634', 'd': '#6A3F24', 'K': '#2A2F45', 'k': '#1A1E30',
           'W': '#F4F4F4', 'w': '#D4D8E0', 'Y': '#FFD23F', 'y': '#E3B52A', 'N': '#F2D49B', 'n': '#D8B877',
           'T': '#3CC46C', 't': '#24935A', 'R': '#E2504C', 'r': '#B23B3B', 'E': '#0B0F1A', 'e': '#0B0F1A'}
    p = Pic('S', lambda x, y: wave(x, y, 0.31, 0.29, 0.47, 0.21) > 0.3)
    p.area(lambda x, y: ell(x, y, 52, 6, 4, 4), 'Y')
    p.area(lambda x, y: ell(x, y, 10, 5, 6, 2) or ell(x, y, 38, 3, 5, 1.6), 'C', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: y >= 32, 'A', lambda x, y: wave(x, y, 0.5, 0.7, 0.3, 0.4) > 0.1)
    p.area(lambda x, y: y >= 32 and (y % 4 == 1) and (x + y // 4 * 3) % 8 < 4, 'V')
    # 보물섬
    p.area(lambda x, y: ell(x, y, 50, 36, 10, 5) and y <= 36, 'N', lambda x, y: (x + y) % 4 != 0)
    for y in range(18, 34):
        x = 52 + math.sin((y - 18) / 6) * 2
        p.put(x, y, 'D', y % 3 != 0)
    for ang in (-2.7, -2.0, -1.1, -0.4, 0.3):
        for r in range(1, 7):
            p.put(52 + r * math.cos(ang), 18 + r * math.sin(ang) + r * r * 0.07, 'T')
    p.area(lambda x, y: 44 <= x <= 49 and 30 <= y <= 33, 'D', lambda x, y: y != 31)
    p.area(lambda x, y: 44 <= x <= 49 and y in (29, 31), 'Y', lambda x, y: True)
    p.put(46, 28, 'Y'); p.put(48, 28, 'Y'); p.put(47, 27, 'Y')
    # 해적선
    p.area(lambda x, y: 28 <= y <= 36 and 6 + (y - 28) * 0.8 <= x <= 40 - (y - 28) * 0.6, 'D', lambda x, y: (y % 3) != 0)
    p.area(lambda x, y: 7 <= x <= 39 and y == 30, 'Y', lambda x, y: x % 3 != 0)
    for wx in (12, 18, 24, 30):
        p.put(wx, 33, 'K')
    for mx, top in ((16, 4), (30, 8)):
        p.area(lambda x, y, mx=mx, top=top: x == mx and top <= y <= 28, 'D')
        p.area(lambda x, y, mx=mx, top=top: mx - 6 <= x <= mx + 6 and top + 3 <= y <= top + 14 and abs(x - mx) <= 4 + (y - top - 3) * 0.2, 'K', lambda x, y: (x + y) % 5 != 0)
        p.area(lambda x, y, mx=mx, top=top: mx - 6 <= x <= mx + 6 and y in (top + 2, top + 15), 'D')
    # 해골 무늬 (만화 느낌)
    p.area(lambda x, y: ell(x, y, 16, 12, 2.6, 2.3), 'W')
    p.put(15, 12, 'K'); p.put(17, 12, 'K')
    for dx, dy in ((-3, 15), (3, 15), (-2, 16), (2, 16), (-1, 14), (1, 14)):
        p.put(16 + dx, dy, 'W')
    p.area(lambda x, y: 16 <= x <= 20 and 2 <= y <= 4, 'R', lambda x, y: (x + y) % 2 == 0 or x < 19)
    return p.out(pal)


# ───── 유니콘과 구름 성 ─────
def unicorn():
    pal = {'S': '#C8B6FF', 's': '#AE98F0', 'C': '#FFFFFF', 'c': '#EEE8FA', 'P': '#FFB3CF', 'p': '#F294B8',
           'V': '#B58CF0', 'v': '#9570D6', 'Y': '#FFE14D', 'y': '#E8C83A', 'U': '#7FD8FF', 'u': '#5CBCEB',
           'R': '#FF6B6B', 'r': '#E05353', 'O': '#FFA94D', 'o': '#E58E33', 'G': '#7FE3A0', 'g': '#5CC47E',
           'W': '#FFFDF8', 'w': '#E8E2F0', 'E': '#0B0F1A', 'e': '#0B0F1A', 'K': '#F5D88A', 'k': '#DDBE68'}
    p = Pic('S', lambda x, y: wave(x, y, 0.29, 0.37, 0.45, 0.19) > 0.25)
    for sx, sy, big in [(4, 4, 1), (55, 4, 1), (12, 14, 0), (50, 18, 0), (20, 3, 0), (44, 2, 0), (3, 22, 0), (57, 26, 1)]:
        p.star(sx, sy, 'Y', big)
    # 구름 성
    p.area(lambda x, y: 34 <= x <= 54 and 10 <= y <= 26, 'P', lambda x, y: (x + y) % 4 != 0)
    for tx in (35, 44, 53):
        top = 4 if tx == 44 else 8
        p.area(lambda x, y, tx=tx, top=top: tx - 2 <= x <= tx + 2 and top <= y <= 26, 'V', lambda x, y: y % 3 != 0)
        p.area(lambda x, y, tx=tx, top=top: tri(x, y, (tx, top - 5), (tx - 3, top), (tx + 3, top)), 'Y')
    p.area(lambda x, y: 42 <= x <= 46 and 19 <= y <= 26 and (y >= 21 or ell(x, y, 44, 21, 2.2, 2)), 'V')
    p.area(lambda x, y: (38 <= x <= 39 or 49 <= x <= 50) and 14 <= y <= 15, 'Y')
    # 구름
    p.area(lambda x, y: ell(x, y, 44, 28, 14, 3.5) or ell(x, y, 36, 27, 5, 3) or ell(x, y, 53, 27, 5, 3)
           or ell(x, y, 24, 44, 16, 4) or ell(x, y, 14, 42, 6, 3.4) or ell(x, y, 34, 42, 7, 3.4) or ell(x, y, 8, 10, 6, 2.2), 'C', lambda x, y: (x * 2 + y) % 5 != 0)
    # 무지개 다리
    for k, r in zip('ROYGUV', (17, 16, 15, 14, 13, 12)):
        p.area(lambda x, y, r=r: y < 40 and r - 0.5 <= math.hypot(x - 22, (y - 42) * 1.3) < r + 0.5 and x > 22, k, lambda x, y: (x + y) % 5 != 0)
    # 유니콘
    p.area(lambda x, y: ell(x, y, 19, 32, 7, 4.2), 'W', lambda x, y: not ((x + 2 * y) % 7 == 0))
    p.area(lambda x, y: ell(x, y, 12.5, 25, 2.6, 5) , 'W')
    p.area(lambda x, y: ell(x, y, 10, 21, 3.6, 2.6), 'W')
    p.put(9, 20, 'E', False); p.put(7, 22, 'P')
    p.area(lambda x, y: tri(x, y, (11, 14), (10, 19), (12.5, 19)), 'K', lambda x, y: y % 2 == 0)
    for leg in (14, 17, 22, 25):
        p.area(lambda x, y, leg=leg: leg <= x <= leg + 1 and 35 <= y <= 40, 'W', lambda x, y: y != 40)
        p.put(leg, 40, 'V'); p.put(leg + 1, 40, 'V')
    for k, c in enumerate('RROOYGGUUV'):
        p.put(14 + (k % 3) * 0.6, 18 + k * 1.2, c); p.put(15 + (k % 2), 18 + k * 1.2, c)
    for k, c in enumerate('PVUPV'):
        p.put(26 + k * 0.8, 30 + k, c); p.put(27 + k * 0.8, 30 + k, c)
    return p.out(pal)


# ───── 판다 대나무 숲 ─────
def panda():
    pal = {'S': '#C9F0D8', 's': '#A6DDBB', 'T': '#3CC46C', 't': '#24935A', 'B': '#7FD36A', 'b': '#5CB44A',
           'W': '#FFFFFF', 'w': '#E3E8F0', 'K': '#2A2F45', 'k': '#1A1E30', 'P': '#FF9EC0', 'p': '#E880A4',
           'G': '#6FC27A', 'g': '#4FA35B', 'Y': '#FFE14D', 'y': '#E8C83A', 'N': '#B5916A', 'n': '#94734E',
           'E': '#0B0F1A', 'e': '#0B0F1A', 'O': '#FF9A3C', 'o': '#D8772B'}
    p = Pic('S', lambda x, y: wave(x, y, 0.31, 0.29, 0.47, 0.21) > 0.3)
    for bx in (2, 7, 12, 47, 52, 57, 20, 40):
        p.area(lambda x, y, bx=bx: bx <= x <= bx + 1 and y <= 44, 'T', lambda x, y, bx=bx: y % 6 != 0)
        for ly in range(4, 40, 7):
            d = 1 if (bx + ly) % 2 else -1
            for k in range(1, 4):
                p.put(bx + (1 + k if d > 0 else -k), ly - k * 0.5, 'B')
    p.area(lambda x, y: y >= 42, 'G', grass)
    p.area(lambda x, y: ell(x, y, 30, 46, 14, 3) and y >= 44, 'N', lambda x, y: (x + y) % 3 != 0)
    # 판다
    p.area(lambda x, y: ell(x, y, 30, 34, 9, 8.5), 'W', lambda x, y: not ((x * 2 + y) % 9 == 0))
    p.area(lambda x, y: ell(x, y, 22, 33, 2.6, 4) or ell(x, y, 38, 31, 2.6, 4), 'K', lambda x, y: (x + y) % 4 != 0)
    p.area(lambda x, y: ell(x, y, 24, 41, 3.4, 2.6) or ell(x, y, 36, 41, 3.4, 2.6), 'K', lambda x, y: (x + y) % 4 != 1)
    p.area(lambda x, y: ell(x, y, 24, 41.5, 1.3, 1) or ell(x, y, 36, 41.5, 1.3, 1), 'P')
    p.area(lambda x, y: ell(x, y, 30, 21, 7.5, 6.5), 'W', lambda x, y: not ((x + y) % 8 == 0))
    p.area(lambda x, y: ell(x, y, 24.5, 15.5, 2.4, 2.2) or ell(x, y, 35.5, 15.5, 2.4, 2.2), 'K')
    p.area(lambda x, y: ell(x, y, 27, 20.5, 1.8, 2.2) or ell(x, y, 33, 20.5, 1.8, 2.2), 'K')
    p.put(27, 20, 'W'); p.put(33, 20, 'W')
    p.area(lambda x, y: ell(x, y, 30, 24, 1.3, 0.8), 'K')
    p.put(29, 26, 'E', False); p.put(31, 26, 'E', False)
    p.put(25, 24, 'P'); p.put(35, 24, 'P')
    # 대나무 먹기
    for k in range(10):
        p.put(36 + k * 0.4, 31 - k * 1.2, 'T', k % 3 != 0)
    for k in range(1, 4):
        p.put(40 + k, 20 - k, 'B'); p.put(40 - k, 21 - k * 0.6, 'B')
    # 나비
    for bx, by, c in ((15, 10, 'Y'), (46, 14, 'O')):
        for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1), (-2, -1), (2, -1)):
            p.put(bx + dx, by + dy, c)
        p.put(bx, by, 'E', False)
    return p.out(pal)


# ───── 남극 펭귄 ─────
def penguin():
    pal = {'S': '#B8E4FF', 's': '#96CFF2', 'U': '#7FE3C7', 'u': '#5CC9AA', 'I': '#E8F6FF', 'i': '#C4E2F5',
           'A': '#3A8FD6', 'a': '#2870B4', 'K': '#2A2F45', 'k': '#1A1E30', 'W': '#FFFFFF', 'w': '#E3E8F0',
           'Y': '#FFD23F', 'y': '#E3B52A', 'O': '#FF9A3C', 'o': '#D8772B', 'E': '#0B0F1A', 'e': '#0B0F1A',
           'R': '#E2504C', 'r': '#B23B3B', 'G': '#9AA3B8', 'g': '#7A8299'}
    p = Pic('S', lambda x, y: wave(x, y, 0.31, 0.29, 0.47, 0.21) > 0.3)
    p.area(lambda x, y: abs(y - (5 + 2.5 * math.sin(x / 6.0))) <= 1.4, 'U', lambda x, y: (x + y) % 3 != 0)
    # 빙산
    p.area(lambda x, y: tri(x, y, (8, 10), (-2, 30), (18, 30)) or tri(x, y, (50, 6), (38, 30), (62, 30)) or tri(x, y, (56, 14), (48, 30), (63, 30)), 'I', lambda x, y: (x * 2 + y) % 5 != 0)
    p.area(lambda x, y: tri(x, y, (8, 10), (5, 18), (9, 18)) or tri(x, y, (50, 6), (46, 16), (51, 16)), 'G', lambda x, y: (x + y) % 2 == 0)
    p.area(lambda x, y: 27 <= y <= 33, 'A', lambda x, y: wave(x, y, 0.5, 0.7, 0.3, 0.4) > 0.1)
    p.area(lambda x, y: y >= 33 or (y >= 30 and abs(x - 30) < 20), 'I', lambda x, y: (x * 3 + y * 2) % 7 not in (0, 4))
    # 펭귄 셋
    for cx, cy, s, scarf in ((30, 28, 1.0, 'R'), (18, 33, 0.8, None), (42, 33, 0.8, 'Y')):
        p.area(lambda x, y, cx=cx, cy=cy, s=s: ell(x, y, cx, cy, 6 * s, 9 * s), 'K', lambda x, y: (x + y) % 5 != 0)
        p.area(lambda x, y, cx=cx, cy=cy, s=s: ell(x, y, cx, cy + 2 * s, 4 * s, 6.5 * s), 'W', lambda x, y: (x * 2 + y) % 7 != 0)
        p.area(lambda x, y, cx=cx, cy=cy, s=s: ell(x, y, cx, cy - 6 * s, 4.3 * s, 3.6 * s), 'K')
        p.area(lambda x, y, cx=cx, cy=cy, s=s: ell(x, y, cx - 1.6 * s, cy - 6 * s, 1.4 * s, 1.6 * s) or ell(x, y, cx + 1.6 * s, cy - 6 * s, 1.4 * s, 1.6 * s), 'W')
        p.put(cx - 1.6 * s, cy - 6 * s, 'E', False); p.put(cx + 1.6 * s, cy - 6 * s, 'E', False)
        p.put(cx, cy - 4.5 * s, 'O'); p.put(cx - 0.6, cy - 4 * s, 'O')
        p.put(cx - 2.5 * s, cy + 9 * s, 'O'); p.put(cx + 2.5 * s, cy + 9 * s, 'O'); p.put(cx - 3.3 * s, cy + 9 * s, 'O'); p.put(cx + 3.3 * s, cy + 9 * s, 'O')
        if scarf:
            p.area(lambda x, y, cx=cx, cy=cy, s=s: abs(x - cx) <= 4.4 * s and abs(y - (cy - 2.5 * s)) <= 0.6, scarf, lambda x, y: x % 2 == 0 or True)
    # 물고기
    for fx, fy in ((8, 40), (52, 42)):
        p.area(lambda x, y, fx=fx, fy=fy: ell(x, y, fx, fy, 2.6, 1.3), 'U')
        p.area(lambda x, y, fx=fx, fy=fy: tri(x, y, (fx + 2.5, fy), (fx + 4.5, fy - 1.5), (fx + 4.5, fy + 1.5)), 'U')
        p.put(fx - 1, fy, 'E', False)
    for i in range(30):
        x, y = (i * 37) % 60, (i * 23) % 26
        if p.kind[y][x] == 'S':
            p.put(x, y, 'W')
    return p.out(pal)


# ───── 태양계 ─────
def solar():
    pal = {'K': '#151C42', 'k': '#0C1230', 'Y': '#FFE14D', 'y': '#F2C93A', 'O': '#FF8A3C', 'o': '#D96A26',
           'G': '#A89C92', 'g': '#83786F', 'N': '#F2C98A', 'n': '#D6AA68', 'U': '#4FA8FF', 'u': '#2E80D6',
           'T': '#3CC46C', 't': '#24935A', 'R': '#E2504C', 'r': '#B23B3B', 'J': '#E8B07A', 'j': '#C48C58',
           'Q': '#FFD27A', 'q': '#D9AD55', 'C': '#8FE6F0', 'c': '#6CC6D2', 'B': '#4F6BE8', 'b': '#3A52C4',
           'W': '#FFFFFF', 'w': '#D4DAF0'}
    p = Pic('K', lambda x, y: wave(x, y, 0.61, 0.43, 0.57, 0.23) > 0.35)
    for i in range(40):
        x, y = (i * 29 + 3) % 60, (i * 17 + 1) % 50
        if p.kind[y][x] == 'K':
            p.put(x, y, 'W', i % 3 != 0)
    # 태양
    p.area(lambda x, y: ell(x, y, -4, 25, 14, 20), 'O', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: ell(x, y, -4, 25, 11, 17), 'Y', lambda x, y: (x * 2 + y) % 5 != 0)
    # 행성들 (궤도를 따라)
    planets = [(14, 18, 1.4, 'G'), (19, 30, 2.0, 'N'), (25, 20, 2.3, 'U'), (30, 33, 1.8, 'R'), (39, 22, 5.0, 'J'), (49, 34, 3.6, 'Q'), (53, 14, 2.8, 'C'), (57, 41, 2.6, 'B')]
    for i, (cx, cy, r, k) in enumerate(planets):
        if k == 'J':
            p.area(lambda x, y, cx=cx, cy=cy, r=r: ell(x, y, cx, cy, r, r), 'J', lambda x, y, cy=cy: (y - cy) % 3 != 0)
            p.area(lambda x, y, cx=cx, cy=cy, r=r: ell(x, y, cx + 1.5, cy + 1.5, 1.5, 1), 'R')
        elif k == 'Q':
            p.area(lambda x, y, cx=cx, cy=cy, r=r: ell(x, y, cx, cy, r + 4, 1.4) and not ell(x, y, cx, cy, r + 1, 0.8), 'N', lambda x, y: x % 2 == 0)
            p.area(lambda x, y, cx=cx, cy=cy, r=r: ell(x, y, cx, cy, r, r), 'Q', lambda x, y, cy=cy: (y - cy) % 2 == 0 or True)
            p.area(lambda x, y, cx=cx, cy=cy, r=r: y == cy and ell(x, y, cx, cy, r + 4, 1.4), 'N')
        elif k == 'U':
            p.area(lambda x, y, cx=cx, cy=cy, r=r: ell(x, y, cx, cy, r, r), 'U')
            p.put(cx - 1, cy - 1, 'T'); p.put(cx, cy - 1, 'T'); p.put(cx + 1, cy + 1, 'T')
            p.put(cx + 4, cy - 2, 'G')
        else:
            p.area(lambda x, y, cx=cx, cy=cy, r=r: ell(x, y, cx, cy, r, r), k, lambda x, y: (x + y) % 3 != 0 or True)
    # 소행성 띠
    for i in range(14):
        a = i / 14 * 3.0 - 1.5
        p.put(10 + 27 * math.cos(a) * 0.9 + 6, 25 + 24 * math.sin(a), 'G', i % 2 == 0)
    # 혜성
    for k in range(7):
        p.put(46 - k, 4 + k * 0.4, 'C', k < 4)
    p.put(46, 4, 'W')
    return p.out(pal)


# ───── 꽃밭 곤충 ─────
def garden():
    pal = {'S': '#A8DCFF', 's': '#86C6F0', 'C': '#FFFFFF', 'c': '#E2EEF9', 'G': '#6FD38A', 'g': '#4CB46B',
           'T': '#3CA86A', 't': '#24804D', 'Y': '#FFD23F', 'y': '#E3B52A', 'D': '#8A5634', 'd': '#6A3F24',
           'R': '#FF5C78', 'r': '#E04460', 'P': '#FF9EC0', 'p': '#E880A4', 'V': '#B58CF0', 'v': '#9570D6',
           'O': '#FF9A3C', 'o': '#D8772B', 'U': '#6EC6FF', 'u': '#4BA8E8', 'K': '#2A2F45', 'k': '#1A1E30',
           'W': '#FFFFFF', 'w': '#E3E8F0', 'E': '#0B0F1A', 'e': '#0B0F1A', 'N': '#C9A46A', 'n': '#A9864F'}
    p = Pic('S', lambda x, y: wave(x, y, 0.31, 0.29, 0.47, 0.21) > 0.3)
    p.area(lambda x, y: ell(x, y, 8, 5, 5, 1.8) or ell(x, y, 50, 4, 6, 2), 'C', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: y >= 38, 'G', grass)
    # 해바라기
    p.area(lambda x, y: x in (10, 11) and 14 <= y <= 46, 'T', lambda x, y: y % 4 != 0)
    p.area(lambda x, y: ell(x, y, 8, 28, 3, 1.4) or ell(x, y, 13, 22, 3, 1.4), 'T')
    p.area(lambda x, y: ell(x, y, 10.5, 11, 7, 7), 'Y', lambda x, y: (x + y) % 3 != 0)
    p.area(lambda x, y: ell(x, y, 10.5, 11, 3.6, 3.6), 'D', lambda x, y: (x + y) % 2 == 0)
    # 튤립과 데이지
    for fx, fy, k in ((44, 26, 'R'), (51, 30, 'V'), (56, 24, 'O'), (38, 33, 'P')):
        p.area(lambda x, y, fx=fx, fy=fy: x == fx and fy + 3 <= y <= 46, 'T')
        p.put(fx + 1, fy + 8, 'T'); p.put(fx + 2, fy + 7, 'T')
        p.area(lambda x, y, fx=fx, fy=fy: ell(x, y, fx, fy + 1, 2.6, 2.4) or (y == fy - 1 and abs(x - fx) in (0, 2)), k, lambda x, y: True)
    for fx, fy in ((20, 40), (28, 43), (5, 44), (48, 42), (56, 45), (34, 46)):
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            p.put(fx + dx, fy + dy, 'W')
        p.put(fx, fy, 'Y')
    # 큰 나비 (가운데)
    p.area(lambda x, y: ell(x, y, 24, 14, 5, 4.5) or ell(x, y, 36, 14, 5, 4.5), 'U', lambda x, y: (x + y) % 4 != 0)
    p.area(lambda x, y: ell(x, y, 25, 22, 3.6, 3) or ell(x, y, 35, 22, 3.6, 3), 'V', lambda x, y: (x + y) % 4 != 1)
    for sx, sy in ((23, 13), (37, 13), (25, 22), (35, 22)):
        p.area(lambda x, y, sx=sx, sy=sy: ell(x, y, sx, sy, 1.3, 1.2), 'Y')
    p.area(lambda x, y: x in (29, 30) and 11 <= y <= 25, 'K')
    p.put(28, 9, 'K'); p.put(27, 8, 'K'); p.put(31, 9, 'K'); p.put(32, 8, 'K')
    # 무당벌레 (잎 위)
    p.area(lambda x, y: ell(x, y, 22, 33, 5, 1.6), 'T')
    p.area(lambda x, y: ell(x, y, 22, 31, 2.4, 1.8) and y <= 31.5, 'R')
    p.put(21, 30, 'K'); p.put(23, 31, 'K'); p.put(22, 29, 'K'); p.put(19, 31, 'K')
    # 꿀벌
    p.area(lambda x, y: ell(x, y, 46, 10, 3, 2), 'Y', lambda x, y: x % 2 == 0)
    p.area(lambda x, y: ell(x, y, 46, 10, 3, 2) and x % 2 == 1, 'K')
    p.area(lambda x, y: ell(x, y, 45, 7, 1.6, 1.2) or ell(x, y, 47.5, 7, 1.6, 1.2), 'W')
    p.put(43, 10, 'E', False)
    for k in range(5):
        p.put(41 - k * 1.5, 12 + math.sin(k) * 1.5, 'W', k % 2 == 0)
    # 달팽이
    p.area(lambda x, y: ell(x, y, 31, 44, 2.6, 2.4), 'O', lambda x, y: (x + y) % 2 == 0)
    p.area(lambda x, y: 26 <= x <= 33 and y == 46, 'N')
    p.put(27, 45, 'N'); p.put(27, 44, 'N'); p.put(26, 43, 'K'); p.put(28, 43, 'K')
    return p.out(pal)


SCENES2 = [
    ('cherry', '벚꽃길 소풍', cherry, None),
    ('autumn', '단풍 숲 다람쥐', autumn, {'16': [1, 1], '20': [1, 1], '25': [1, 0]}),
    ('chuseok', '추석 보름달 토끼', chuseok, None),
    ('palace', '경복궁과 한복', palace, {'16': [1, 1], '20': [1, 1], '25': [1, 0]}),
    ('turtle-ship', '거북선', turtle_ship, {'16': [0, 1], '20': [0, 1], '25': [0, 0]}),
    ('fireworks', '한강 불꽃놀이', fireworks, None),
    ('castle', '성과 용', castle, None),
    ('pirate', '해적선과 보물섬', pirate, {'16': [0, 0], '20': [0, 0], '25': [0, 0]}),
    ('unicorn', '유니콘과 구름 성', unicorn, {'16': [0, 1], '20': [0, 1], '25': [0, 0]}),
    ('panda', '판다 대나무 숲', panda, {'16': [1, 1], '20': [1, 1], '25': [1, 0]}),
    ('penguin', '남극 펭귄', penguin, {'16': [1, 1], '20': [1, 1], '25': [1, 0]}),
    ('solar', '태양계 행성', solar, {'16': [1, 0], '20': [1, 0], '25': [1, 0]}),
    ('garden', '꽃밭 곤충', garden, {'16': [1, 0], '20': [1, 0], '25': [1, 0]}),
]
