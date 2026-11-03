"""모든 그림을 만들고 조각마다 난이도를 맞춰 js/pictures.js로 내보낸다.

사용법: python3 make_pictures.py
- 지붕 위 고양이는 roof-cat.json(이미 맞춘 결과)을 그대로 쓴다.
- 나머지는 scenes.py의 장면을 그린 뒤 roof_cat.py의 tune으로 보통·어려움 두 벌을 만든다.
- 미리보기: 미리보기/<id>.png
"""
import json, os, sys
from multiprocessing import Pool
from PIL import Image
import roof_cat as rc
import scenes

P = 10


def tune_scene(kind, fill, seed):
    levels = {}
    for lv, (lo, hi) in rc.LEVELS.items():
        jobs = []
        for pr in range(rc.H // P):
            for pc in range(rc.W // P):
                g = [[1 if fill[pr * P + r][pc * P + c] else 0 for c in range(P)] for r in range(P)]
                jobs.append((g, lo, hi, seed * 1000 + pr * 100 + pc + (0 if lv == 'normal' else 7)))
        with Pool(2) as pool:
            res = pool.map(rc.tune, jobs)
        f2 = [row[:] for row in fill]
        ns = []
        for i, (g, best, n, tries) in enumerate(res):
            pr, pc = divmod(i, rc.W // P)
            if best[:2] != (0, 0):
                raise SystemExit(f'조각 {pr},{pc} 난이도 맞추기 실패: {best}')
            ns.append(n)
            for r in range(P):
                for c in range(P):
                    f2[pr * P + r][pc * P + c] = bool(g[r][c])
        levels[lv] = [''.join(kind[y][x] if f2[y][x] else kind[y][x].lower() for x in range(rc.W)) for y in range(rc.H)]
        print(f'  {lv}: 조각마다 {sorted(set(ns))}회', file=sys.stderr)
    return levels


def save_png(rows, pal, path):
    img = Image.new('RGB', (rc.W, rc.H))
    for y in range(rc.H):
        for x in range(rc.W):
            c = pal[rows[y][x]]
            img.putpixel((x, y), tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)))
    img.resize((rc.W * 12, rc.H * 12), Image.NEAREST).save(path)


def main():
    os.makedirs('미리보기', exist_ok=True)
    out = []
    d = json.load(open('roof-cat.json'))
    out.append({'id': 'roof-cat', 'name': '지붕 위 고양이', 'w': 60, 'h': 50, 'pal': d['pal'], 'levels': d['levels']})
    save_png(d['levels']['normal'], d['pal'], '미리보기/roof-cat.png')
    for i, (sid, name, fn, crop) in enumerate(scenes.SCENES):
        print(name, file=sys.stderr)
        kind, fill, pal = fn()
        lv = tune_scene(kind, fill, i + 1)
        item = {'id': sid, 'name': name, 'w': 60, 'h': 50, 'pal': pal, 'levels': lv}
        if crop:
            item['crop'] = crop
        out.append(item)
        save_png(lv['normal'], pal, f'미리보기/{sid}.png')
    with open('../js/pictures.js', 'w', encoding='utf-8') as f:
        f.write('// 그림 데이터. 그림/make_pictures.py로 만든다. 직접 고치지 않는다.\n')
        f.write('// 대문자는 칠하는 칸, 소문자는 비우는 칸. 글자 종류가 칠판 색을 정한다.\n')
        f.write('// levels.normal: 조각마다 4회, levels.hard: 조각마다 5회 훑어야 풀린다.\n')
        f.write('// crop: 작은 판으로 잘라 쓸 위치(조각 단위 [가로, 세로]). 없으면 js/game.js의 기본값.\n')
        f.write('export const PICTURES = [\n')
        for item in out:
            f.write(json.dumps(item, ensure_ascii=False, separators=(',', ':')) + ',\n')
        f.write('];\n')


if __name__ == '__main__':
    main()
