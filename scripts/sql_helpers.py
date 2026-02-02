"""Shared SQL utility helpers for fake data generation scripts."""

from __future__ import annotations

from typing import Final


def _escape_sql_literal(value: str) -> str:
    """Escape a Python string to be safely embedded as a SQL literal."""

    return value.replace("'", "''")


_BOOL_MAP: Final = {True: "true", False: "false"}


def build_image_insert_sql(
    product_name: str,
    category_name: str,
    image_url: str,
    is_primary: bool,
) -> str:
    """Return an idempotent INSERT statement for the product_images table."""

    if not product_name:
        raise ValueError("product_name must be provided")
    if not category_name:
        raise ValueError("category_name must be provided")
    if not image_url:
        raise ValueError("image_url must be provided")

    product_literal = _escape_sql_literal(product_name.strip())
    category_literal = _escape_sql_literal(category_name.strip())
    image_literal = _escape_sql_literal(image_url.strip())
    bool_literal = _BOOL_MAP[bool(is_primary)]

    return (
        "INSERT INTO product_images (product_id, image_url, is_primary) "
        "SELECT p.id, '{url}', {is_primary} FROM products p "
        "WHERE p.name = '{name}' AND p.category_id = "
        "(SELECT id FROM categories WHERE name = '{category}') "
        "AND NOT EXISTS (SELECT 1 FROM product_images i "
        "WHERE i.product_id = p.id AND i.image_url = '{url}');"
    ).format(
        url=image_literal,
        is_primary=bool_literal,
        name=product_literal,
        category=category_literal,
    )


__all__ = ["build_image_insert_sql"]
