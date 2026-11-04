"""올리기 전에 실행: 파일 주소에 판 번호를 붙여 브라우저가 예전 파일을 쓰지 않게 한다.

사용법: python3 tools/stamp.py
- index.html의 css·js 주소와 js/*.js 안의 import 주소에 ?v=판번호 를 붙인다(이미 있으면 바꾼다).
- js/version.js에 판 번호를 적는다. 첫 화면 아래에 보인다.
판 번호는 한국 시각 기준 '월일-시분' (예: 1104-1105).
"""
import datetime, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
v = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime('%m%d-%H%M')

(root / 'js' / 'version.js').write_text(f"// tools/stamp.py가 적는다. 직접 고치지 않는다.\nexport const VERSION = '{v}';\n", encoding='utf-8')

pat = re.compile(r"""((?:from|import)\s*\(?\s*['"])(\./[\w-]+\.js)(?:\?v=[\w-]+)?(['"])""")
for f in (root / 'js').glob('*.js'):
    s = f.read_text(encoding='utf-8')
    s2 = pat.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={v}{m.group(3)}", s)
    if s2 != s:
        f.write_text(s2, encoding='utf-8')

idx = root / 'index.html'
s = idx.read_text(encoding='utf-8')
s = re.sub(r'(href="css/style\.css)(?:\?v=[\w-]+)?"', rf'\1?v={v}"', s)
s = re.sub(r'(src="js/main\.js)(?:\?v=[\w-]+)?"', rf'\1?v={v}"', s)
idx.write_text(s, encoding='utf-8')
print('판 번호', v)
