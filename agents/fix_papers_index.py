"""修复 papers-index.json 的 hasReview 字段"""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
idx_path = ROOT / "content" / "papers" / "papers-index.json"
papers = json.loads(idx_path.read_text())

existing_mds = {f.stem for f in (ROOT / "content" / "papers").glob("*.md")}
print(f"MD files found: {existing_mds}")

for p in papers:
    pid = p["id"]
    has_md = pid in existing_mds
    if p.get("hasReview") and not has_md:
        print(f"  fix: {pid} -> hasReview=false (no MD)")
        p["hasReview"] = False
    elif has_md:
        p["hasReview"] = True
        print(f"  ok:  {pid} -> hasReview=true")
    else:
        print(f"  skip: {pid} -> hasReview=false")

idx_path.write_text(json.dumps(papers, ensure_ascii=False, indent=2))
print("\nDone!")
