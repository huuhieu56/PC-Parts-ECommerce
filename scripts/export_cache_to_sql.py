"""Generate product_images SQL from a pre-scraped image cache."""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence

from sql_helpers import build_image_insert_sql  # type: ignore


@dataclass
class ProductRef:
    name: str
    category: str


INSERT_PATTERN = re.compile(r"INSERT\s+INTO\s+products.*?;", re.IGNORECASE | re.DOTALL)
NAME_PATTERN = re.compile(r"SELECT\s+'((?:''|[^'])*)'", re.IGNORECASE)
CATEGORY_PATTERN = re.compile(r"\(SELECT\s+id\s+FROM\s+categories\s+WHERE\s+name\s*=\s*'((?:''|[^'])*)'\)", re.IGNORECASE)


def parse_products_from_sql(text: str) -> List[ProductRef]:
    products: List[ProductRef] = []
    for match in INSERT_PATTERN.finditer(text):
        stmt = match.group(0)
        name_match = NAME_PATTERN.search(stmt)
        cat_match = CATEGORY_PATTERN.search(stmt)
        if not name_match or not cat_match:
            continue
        name = name_match.group(1).replace("''", "'").strip()
        category = cat_match.group(1).replace("''", "'").strip()
        if name and category:
            products.append(ProductRef(name=name, category=category))
    return products


def dedupe(urls: Iterable[str], limit: Optional[int]) -> List[str]:
    seen: set[str] = set()
    out: List[str] = []
    for url in urls:
        if not isinstance(url, str):
            continue
        normalized = url.strip()
        if not normalized.lower().startswith("http"):
            continue
        if normalized in seen:
            continue
        seen.add(normalized)
        out.append(normalized)
        if limit is not None and len(out) >= limit:
            break
    return out


def load_cache(path: Path) -> Dict[str, List[str]]:
    with path.open("r", encoding="utf-8") as fp:
        data = json.load(fp)
    result: Dict[str, List[str]] = {}
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, Sequence):
                result[str(key)] = [str(item) for item in value]
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert cached image URLs to SQL inserts")
    parser.add_argument("--products-sql", default=os.path.join(Path(__file__).resolve().parent.parent, "fake_data_product.sql"))
    parser.add_argument("--cache", default=os.path.join(Path(__file__).resolve().parent, "image_query_cache.cleaned.json"))
    parser.add_argument("--out", default=os.path.join(Path(__file__).resolve().parent.parent, "fake_img_product.cleaned.sql"))
    parser.add_argument("--query-template", default="{name} {category} product photo")
    parser.add_argument("--per-product", type=int, default=0,
                        help="Giới hạn ảnh mỗi sản phẩm (0 = dùng toàn bộ URL trong cache)")
    args = parser.parse_args()

    products_sql = Path(args.products_sql).expanduser().resolve()
    cache_path = Path(args.cache).expanduser().resolve()
    out_path = Path(args.out).expanduser().resolve()

    if not products_sql.is_file():
        raise FileNotFoundError(f"Products SQL not found: {products_sql}")
    if not cache_path.is_file():
        raise FileNotFoundError(f"Cache file not found: {cache_path}")

    with products_sql.open("r", encoding="utf-8") as fp:
        products = parse_products_from_sql(fp.read())
    cache = load_cache(cache_path)

    per_product = None if args.per_product <= 0 else max(1, args.per_product)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fp:
        fp.write("-- Generated from cached image URLs\nBEGIN;\n")
        missing = []
        for product in products:
            query_key = args.query_template.format(name=product.name, category=product.category)
            urls = dedupe(cache.get(query_key, []), per_product)
            if not urls:
                missing.append(product.name)
                fp.write(f"\n-- No cached images for {product.name}\n")
                continue
            fp.write(f"\n-- Images for {product.name}\n")
            for idx, url in enumerate(urls):
                sql = build_image_insert_sql(product.name, product.category, url, idx == 0)
                fp.write(sql + "\n")
        fp.write("\nCOMMIT;\n")

    if missing:
        print(f"Missing cached URLs for {len(missing)} products")
    else:
        print("All products have cached URLs")
    print(f"SQL written to: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())