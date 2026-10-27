#!/usr/bin/env python3
"""Verify bundle integrity and syntax; does not execute application workflows."""
from pathlib import Path
import hashlib,json,subprocess,tempfile,shutil,re
root=Path(__file__).resolve().parents[1]
count=0
for line in (root/'SHA256SUMS').read_text().splitlines():
    expected,name=line.split('  ',1)
    p=root/name
    assert p.is_file(),f'Missing: {name}'
    assert hashlib.sha256(p.read_bytes()).hexdigest()==expected,f'Modified: {name}'
    count+=1
backlog=json.loads((root/'implementation-tasks.json').read_text())
ids={t['id'] for t in backlog['tasks']}
assert len(ids)==len(backlog['tasks'])
for t in backlog['tasks']:
    assert set(t['depends_on'])<=ids
    assert t['status']=='not_started'
for p in (root/'contracts').glob('*.json'): json.loads(p.read_text())
if shutil.which('node'):
    script=re.search(r'<script>(.*?)</script>',(root/'prototype/index.html').read_text(),re.S).group(1)
    with tempfile.TemporaryDirectory() as d:
        p=Path(d)/'prototype.js';p.write_text(script)
        subprocess.run(['node','--check',str(p)],check=True)
else:
    print('Node absent: JavaScript syntax check skipped')
print(f'PASS: {count} file hashes, {len(ids)} task IDs/dependencies, JSON serialization; JS syntax checked when Node available.')
print('LIMIT: no browser workflow, cloud integration, proof or security qualification is certified.')
