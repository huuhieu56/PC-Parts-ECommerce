#!/usr/bin/env python3
"""Generate attribute_definitions SQL from attribute_category.json."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

DEFAULT_JSON = Path(__file__).with_name('attribute_category.json')
DEFAULT_SQL = Path(__file__).with_name('attr_defs_from_json.sql')


def sql_string(value: Any) -> str:
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    return "'" + str(value).replace("'", "''") + "'"


def json_literal(options: Any) -> str:
    if options is None:
        return 'NULL'
    return sql_string(json.dumps(options, ensure_ascii=False))


def normalize_attributes(attrs: Dict[str, Dict[str, Any]]) -> List[Tuple[str, Dict[str, Any]]]:
    def sort_key(item: Tuple[str, Dict[str, Any]]) -> Tuple[int, str]:
        meta = item[1]
        return (int(meta.get('sort_order', 0)), item[0])

    return sorted(attrs.items(), key=sort_key)


def build_values_rows(attrs: Dict[str, Dict[str, Any]]) -> str:
    rows: List[str] = []
    for code, meta in normalize_attributes(attrs):
        display_name = sql_string(meta.get('display_name'))
        data_type = sql_string(meta.get('data_type'))
        input_type = sql_string(meta.get('input_type'))
        unit = sql_string(meta.get('unit'))
        sort_order = meta.get('sort_order', 0)
        options = json_literal(meta.get('options'))
        rows.append(
            f"    ({sql_string(code)}, {display_name}, {data_type}, {input_type}, {unit}, {sort_order}, {options})"
        )
    return ',\n'.join(rows)


def build_section(category: str, attrs: Dict[str, Dict[str, Any]]) -> str:
    values_block = build_values_rows(attrs)
    category_name = sql_string(category)
    return (
        f"-- {category}\n"
        "INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)\n"
        "SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb\n"
        "FROM categories c\n"
        "CROSS JOIN (VALUES\n"
        f"{values_block}\n"
        ") AS attr(code, display_name, data_type, input_type, unit, sort_order, options)\n"
        f"WHERE c.name = {category_name}\n"
        "ON CONFLICT (category_id, code) DO UPDATE SET\n"
        "    display_name = EXCLUDED.display_name,\n"
        "    data_type = EXCLUDED.data_type,\n"
        "    input_type = EXCLUDED.input_type,\n"
        "    unit = EXCLUDED.unit,\n"
        "    sort_order = EXCLUDED.sort_order,\n"
        "    options = EXCLUDED.options;\n"
    )


def generate_sql(data: Dict[str, Dict[str, Any]]) -> str:
    sections = [build_section(category, attrs) for category, attrs in data.items()]
    header = "-- Auto-generated from attribute_category.json\n"
    return header + '\n'.join(sections)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Generate attribute_definitions SQL from JSON config')
    parser.add_argument('--json', default=str(DEFAULT_JSON), help='Path to attribute_category.json')
    parser.add_argument('--out', default=str(DEFAULT_SQL), help='Output SQL file path')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source_path = Path(args.json)
    with source_path.open('r', encoding='utf-8') as handle:
        data = json.load(handle)

    sql_text = generate_sql(data)

    out_path = Path(args.out)
    out_path.write_text(sql_text, encoding='utf-8')
    print(f'Generated SQL for {len(data)} categories into {out_path}')


if __name__ == '__main__':
    main()
