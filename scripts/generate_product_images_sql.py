#!/usr/bin/env python3
"""Generate SQL insert statements for product images.

The script reads `fake_data_product.sql`, extracts product names and category names,
queries DuckDuckGo Images for each product, and writes a SQL file that inserts up to
three images per product into `product_images`.

Usage (PowerShell examples):
    python scripts/generate_product_images_sql.py \
        --products-sql fake_data_product.sql --out fake_img_product.sql
    python scripts/generate_product_images_sql.py --limit 50 --delay 1.5

Notes:
- Results are idempotent: every INSERT uses a NOT EXISTS clause.
- The first image for each product is marked as primary.
- A simple JSON cache is supported to avoid repeat requests.
- The output SQL file flushes after each product so you can follow progress in real time.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence

try:
    from sql_helpers import build_image_insert_sql  # type: ignore
except ModuleNotFoundError as exc:  # pragma: no cover - helpful error when script moved
    raise ModuleNotFoundError(
        "Cannot import build_image_insert_sql from sql_helpers."
        " Ensure you run this script from the repository root."
    ) from exc

try:
    from image_fetch_urls import fetch_first_image_urls  # type: ignore
except ModuleNotFoundError as exc:  # pragma: no cover - must keep parity with existing helper script
    raise ModuleNotFoundError(
        "Cannot import fetch_first_image_urls from image_fetch_urls."
        " Please keep generate_product_images_sql.py inside the scripts folder."
    ) from exc


@dataclass
class ProductRef:
    name: str
    category: str


def parse_products_from_sql(sql_text: str) -> List[ProductRef]:
    """Extract product name + category pairs from INSERT statements."""

    products: List[ProductRef] = []
    # Designed to match each INSERT INTO products ...; block
    stmt_pattern = re.compile(r"INSERT\s+INTO\s+products.*?;", re.IGNORECASE | re.DOTALL)
    name_pattern = re.compile(r"SELECT\s+'((?:''|[^'])*)'", re.IGNORECASE)
    category_pattern = re.compile(r"\(SELECT\s+id\s+FROM\s+categories\s+WHERE\s+name\s*=\s*'((?:''|[^'])*)'\)", re.IGNORECASE)

    for match in stmt_pattern.finditer(sql_text):
        stmt = match.group(0)
        if "INSERT INTO products" not in stmt:
            continue
        name_match = name_pattern.search(stmt)
        cat_match = category_pattern.search(stmt)
        if not name_match or not cat_match:
            continue
        raw_name = name_match.group(1)
        raw_cat = cat_match.group(1)
        name = raw_name.replace("''", "'").strip()
        category = raw_cat.replace("''", "'").strip()
        if not name or not category:
            continue
        products.append(ProductRef(name=name, category=category))
    return products


class QueryCache:
    """Simple JSON-backed cache for query -> [urls]."""

    def __init__(self, path: Optional[str]) -> None:
        self.path = os.path.abspath(os.path.expanduser(path)) if path else None
        self._data: Dict[str, List[str]] = {}
        self._dirty = False
        if self.path and os.path.isfile(self.path):
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        self._data = {str(k): list(v) for k, v in data.items() if isinstance(v, list)}
            except Exception:
                self._data = {}

    def get(self, key: str) -> Optional[List[str]]:
        return self._data.get(key)

    def put(self, key: str, value: Sequence[str]) -> None:
        if self.path is None:
            return
        existing = self._data.get(key)
        if existing == list(value):
            return
        self._data[key] = list(value)
        self._dirty = True

    def save(self) -> None:
        if not self.path or not self._dirty:
            return
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self._data, f, ensure_ascii=False, indent=2)
        self._dirty = False


def dedupe_urls(urls: Iterable[str], limit: int) -> List[str]:
    out: List[str] = []
    seen = set()
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
        if len(out) >= limit:
            break
    return out


def fetch_image_urls(
    query: str,
    per_product: int,
    retries: int,
    delay: float,
    cache: Optional[QueryCache],
) -> List[str]:
    cached = cache.get(query) if cache else None
    if cached is not None:
        return cached[:per_product]

    attempt = 0
    last_error: Optional[Exception] = None
    while attempt < retries:
        attempt += 1
        try:
            raw_urls = fetch_first_image_urls(query, n=per_product * 2)
            deduped = dedupe_urls(raw_urls, per_product)
            if cache is not None:
                cache.put(query, deduped)
            if delay:
                time.sleep(delay)
            return deduped
        except Exception as exc:
            last_error = exc
            time.sleep(min(3.0, delay + attempt))
    if last_error:
        print(f"[warn] query failed after {retries} attempts: {query} -> {last_error}")
    else:
        print(f"[warn] no images found for query: {query}")
    if cache is not None:
        cache.put(query, [])
    return []


def load_products(sql_path: str) -> List[ProductRef]:
    with open(sql_path, "r", encoding="utf-8") as f:
        text = f.read()
    products = parse_products_from_sql(text)
    if not products:
        raise ValueError("No INSERT INTO products statements found in the SQL file.")
    return products


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate product image SQL using DuckDuckGo image search")
    parser.add_argument("--products-sql", default=os.path.join(os.path.dirname(__file__), os.pardir, "fake_data_product.sql"), help="Path to fake_data_product.sql generated earlier")
    parser.add_argument("--out", default=os.path.join(os.path.dirname(__file__), os.pardir, "fake_img_product.sql"), help="Output SQL file path")
    parser.add_argument("--per-product", type=int, default=3, help="Number of images per product (default: 3)")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of products (for testing)")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay (seconds) between successful queries")
    parser.add_argument("--retries", type=int, default=3, help="Number of retries per query")
    parser.add_argument("--query-template", default="{name} {category} product photo", help="Template for search query (use {name} and {category})")
    parser.add_argument("--cache", default=os.path.join(os.path.dirname(__file__), "image_query_cache.json"), help="Optional JSON cache for query results")
    args = parser.parse_args()

    products_sql_path = os.path.abspath(os.path.expanduser(args.products_sql))
    if not os.path.isfile(products_sql_path):
        print(f"Products SQL file not found: {products_sql_path}")
        return 2

    products = load_products(products_sql_path)
    if args.limit:
        products = products[: args.limit]

    out_path = os.path.abspath(os.path.expanduser(args.out))

    cache = QueryCache(args.cache) if args.cache else None
    per_product = max(1, args.per_product)
    delay = max(0.0, args.delay)
    retries = max(1, args.retries)

    total_products = len(products)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    header_lines = [
        "-- ============================================",
        "-- Fake data for product_images",
        f"-- Generated by generate_product_images_sql.py on {__import__('datetime').datetime.now().isoformat(timespec='seconds')}",
        "-- ============================================",
        "",
        "BEGIN;",
    ]

    success_count = 0
    with open(out_path, "w", encoding="utf-8") as out_file:
        out_file.write("\n".join(header_lines) + "\n")
        out_file.flush()

        for idx, product in enumerate(products, start=1):
            print(f"[info] {idx}/{total_products} Searching images for {product.name}", flush=True)
            query = args.query_template.format(name=product.name, category=product.category)
            urls = fetch_image_urls(
                query=query,
                per_product=per_product,
                retries=retries,
                delay=delay,
                cache=cache,
            )
            if urls:
                success_count += 1
                out_file.write(f"\n-- Images for {product.name}\n")
                for index, url in enumerate(urls):
                    sql = build_image_insert_sql(product.name, product.category, url, index == 0)
                    out_file.write(sql + "\n")
                message = f"[ok] {idx}/{total_products} {product.name}: {len(urls)} image(s) saved"
            else:
                out_file.write(f"\n-- No images found for {product.name}\n")
                message = f"[warn] {idx}/{total_products} {product.name}: no images found"
            out_file.flush()
            print(message, flush=True)

        out_file.write("\nCOMMIT;\n")
        out_file.flush()

    if cache:
        cache.save()

    processed = total_products
    missing = processed - success_count
    print(f"Done. Products processed: {processed}, products with images: {success_count}, missing: {missing}")
    print(f"SQL written to: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
