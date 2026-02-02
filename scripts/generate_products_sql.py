#!/usr/bin/env python3
"""Generate SQL INSERT statements for products based on JSONL datasets.

This script scans all *.jsonl files inside the pc-part dataset folder, maps each file to a
product category, builds normalized attribute JSON objects per category, and produces a
single SQL file with INSERT statements that are idempotent (guarded by WHERE NOT EXISTS).
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
from collections import deque
from concurrent.futures import Future, ProcessPoolExecutor
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Deque, Dict, Iterable, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Attribute metadata (mirrors database attribute_definitions)
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_ATTR_JSON = os.path.join(SCRIPT_DIR, 'attribute_category.json')
ATTR_META: Dict[str, Dict[str, Dict[str, Any]]] = {}
_WORKER_SEARCH_HELPER: Optional['DdgsSearchHelper'] = None
logger = logging.getLogger(__name__)


def load_attribute_metadata(path: str) -> Dict[str, Dict[str, Dict[str, Any]]]:
    with open(path, 'r', encoding='utf-8') as handle:
        raw: Dict[str, Dict[str, Dict[str, Any]]] = json.load(handle)

    normalized: Dict[str, Dict[str, Dict[str, Any]]] = {}
    for category, attrs in raw.items():
        sorted_items = sorted(
            attrs.items(),
            key=lambda item: (int(item[1].get('sort_order', 0)), item[0]),
        )
        ordered: Dict[str, Dict[str, Any]] = {}
        for code, meta in sorted_items:
            ordered[code] = meta
        normalized[category] = ordered
    return normalized


class DdgsUnavailableError(RuntimeError):
    pass


class DdgsSearchHelper:
    def __init__(
        self,
        max_results: int,
        region: str,
        safesearch: str,
        backend: str,
        timeout: int,
    ) -> None:
        try:
            from ddgs import DDGS  # type: ignore
        except ImportError as exc:  # pragma: no cover - optional dependency
            raise DdgsUnavailableError('Không tìm thấy thư viện ddgs. Cài đặt bằng "pip install ddgs" để bật tra cứu.') from exc
        self.client = DDGS(timeout=timeout)
        self.max_results = max_results
        self.region = region
        self.safesearch = safesearch
        self.backend = backend
        self._cache: Dict[str, str] = {}

    def _fetch_text(self, query: str) -> str:
        if not query:
            return ''
        cached = self._cache.get(query)
        if cached is not None:
            return cached
        try:
            results = self.client.text(
                query=query,
                region=self.region,
                safesearch=self.safesearch,
                backend=self.backend,
                max_results=self.max_results,
            )
        except Exception:
            self._cache[query] = ''
            return ''
        parts: List[str] = []
        for item in results or []:
            for key in ('title', 'body', 'href'):
                value = item.get(key)
                if value:
                    parts.append(str(value))
        text = ' '.join(parts)
        self._cache[query] = text
        return text

    def infer_from_search(
        self,
        rec: Dict[str, Any],
        category: str,
        attr_code: str,
        attr_meta: Dict[str, Any],
    ) -> Optional[Any]:
        name = rec.get('name') or 'Unnamed Product'
        display = attr_meta.get('display_name') or attr_code
        query = ' '.join(part for part in (name, category, display, 'specs') if part)
        logger.info(
            "[DDGS][QUERY] product='%s' category='%s' attr='%s' display='%s'",
            name,
            category,
            attr_code,
            display,
        )
        text = self._fetch_text(query)
        if not text:
            logger.info(
                "[DDGS][NO_RESULT] product='%s' category='%s' attr='%s'",
                name,
                category,
                attr_code,
            )
            return None
        lower, compact = _normalize_search_text(text)
        inferred = _infer_value_from_options(attr_meta, lower, compact)
        if inferred is not None:
            logger.info(
                "[DDGS][HIT] product='%s' category='%s' attr='%s' value='%s'",
                name,
                category,
                attr_code,
                inferred,
            )
        else:
            logger.info(
                "[DDGS][MISS] product='%s' category='%s' attr='%s'",
                name,
                category,
                attr_code,
            )
        return inferred

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------


def usd_to_vnd(usd: Optional[float]) -> Optional[float]:
    if usd is None:
        return None
    try:
        rate = float(os.getenv('USD_TO_VND', '25000'))
        vnd = round(float(usd) * rate / 1000.0) * 1000.0
        return vnd
    except Exception:
        return float(usd) * 25000.0


def parse_brand(name: str) -> Optional[str]:
    if not name:
        return None
    first = name.split()[0].strip('"\'')
    mapping = {
        'MSI': 'MSI', 'Asus': 'ASUS', 'ASUS': 'ASUS', 'Gigabyte': 'Gigabyte', 'Sapphire': 'Sapphire',
        'Intel': 'Intel', 'AMD': 'AMD', 'G.Skill': 'G.Skill', 'Corsair': 'Corsair', 'Kingston': 'Kingston',
        'Seagate': 'Seagate', 'Samsung': 'Samsung', 'WD': 'Western Digital', 'Western': 'Western Digital',
        'EVGA': 'EVGA', 'ASRock': 'ASRock', 'Logitech': 'Logitech', 'LG': 'LG', 'Acer': 'Acer', 'Dell': 'Dell',
        'NZXT': 'NZXT', 'Thermaltake': 'Thermaltake', 'Cooler': 'Cooler Master', 'Razer': 'Razer',
    }
    return mapping.get(first, first)


@dataclass
class ProductRow:
    name: str
    description: str
    price_vnd: float
    category_name: str
    attributes: Dict[str, Any]
    specifications: Dict[str, Any]
    quantity: int
    low_stock_threshold: int


@dataclass(frozen=True)
class MapperConfig:
    category_name: str
    attr_builder: Callable[[Dict[str, Any]], Dict[str, Any]]
    description_builder: Optional[Callable[[Dict[str, Any]], str]] = None


@dataclass
class PendingJob:
    future: Future
    current_index: int
    global_index: int


@dataclass(frozen=True)
class DdgsConfig:
    max_results: int
    region: str
    safesearch: str
    backend: str
    timeout: int


# ---------------------------------------------------------------------------
# Formatting helpers for tricky datasets
# ---------------------------------------------------------------------------


def format_memory_speed(raw: Any) -> Optional[str]:
    if raw is None:
        return None
    if isinstance(raw, list) and len(raw) == 2:
        gen, speed = raw
        if isinstance(gen, (int, float)):
            prefix = f"DDR{int(gen)}"
        else:
            try:
                prefix = f"DDR{int(str(gen))}"
            except Exception:
                prefix = str(gen)
        try:
            speed_text = int(speed)
        except Exception:
            speed_text = speed
        return f"{prefix}-{speed_text}"
    return str(raw)


def format_modules(raw: Any) -> Optional[str]:
    if raw is None:
        return None
    if isinstance(raw, list) and len(raw) == 2:
        count, size = raw
        unit = 'GB'
        try:
            count = int(count)
            size = int(size)
            return f"{count} x {size}{unit}"
        except Exception:
            pass
    return str(raw)


def format_resolution(raw: Any) -> Optional[str]:
    if raw is None:
        return None
    if isinstance(raw, list) and len(raw) == 2:
        return f"{raw[0]}x{raw[1]}"
    return str(raw)


def format_range_string(raw: Any, unit: Optional[str] = None) -> Optional[str]:
    if raw is None:
        return None
    if isinstance(raw, list) and len(raw) == 2:
        lo, hi = raw
        if lo == hi:
            text = f"{hi}"
        else:
            text = f"{lo}-{hi}"
        return f"{text} {unit}".strip() if unit else text
    return f"{raw} {unit}".strip() if unit else str(raw)


def format_frequency_response(raw: Any, unit: str = 'Hz') -> Optional[str]:
    if raw is None:
        return None
    if isinstance(raw, list) and len(raw) == 2:
        lo, hi = raw
        return f"{lo}-{hi} {unit}"
    return str(raw)


def format_architecture(value: Any) -> Optional[str]:
    if value is None:
        return None
    try:
        return f"{int(value)}-bit"
    except Exception:
        return str(value)


def list_to_string(raw: Any, sep: str = ', ') -> Optional[str]:
    if raw is None:
        return None
    if isinstance(raw, list):
        return sep.join(str(item) for item in raw)
    return str(raw)


def normalize_modular(raw: Any) -> Optional[str]:
    if raw is None:
        return None
    if isinstance(raw, bool):
        return 'Full' if raw else 'No'
    text = str(raw).strip().lower()
    if text in {'full', 'fully'}:
        return 'Full'
    if text in {'semi', 'partial', 'semi-modular'}:
        return 'Semi'
    if text in {'none', 'non-modular', 'no'}:
        return 'No'
    return raw if isinstance(raw, str) else text


# ---------------------------------------------------------------------------
# Keyword metadata & fuzzy helpers for attribute extraction
# ---------------------------------------------------------------------------


CPU_MANUFACTURER_KEYWORDS = [
    ('Intel', ('intel', 'core i', 'xeon')),
    ('AMD', ('amd', 'ryzen', 'threadripper', 'athlon')),
]

GPU_MANUFACTURER_KEYWORDS = [
    ('ASUS', ('asus', 'rog strix', 'tuf gaming')),
    ('MSI', ('msi', 'suprim', 'ventus', 'gaming x')),
    ('Gigabyte', ('gigabyte', 'aorus', 'eagle')),
    ('Sapphire', ('sapphire',)),
    ('EVGA', ('evga',)),
    ('Zotac', ('zotac',)),
    ('PNY', ('pny',)),
    ('PowerColor', ('powercolor',)),
    ('ASRock', ('asrock',)),
    ('Palit', ('palit',)),
    ('Inno3D', ('inno3d',)),
    ('NVIDIA', ('nvidia', 'founders edition')),
    ('AMD', ('amd', 'radeon')),
]

PCIE_INTERFACE_KEYWORDS = [
    ('PCIe 5.0 x16', ('pcie 5.0', 'pci express 5.0', 'gen5')),
    ('PCIe 4.0 x16', ('pcie 4.0', 'pci express 4.0', 'gen4')),
    ('PCIe 3.0 x16', ('pcie 3.0', 'pci express 3.0', 'gen3')),
    ('PCIe x16', ('pcie x16', 'pci express x16')),
]

COOLING_TYPE_KEYWORDS = [
    ('Liquid', ('liquid', 'water', 'aio', 'hydro')),
    ('Hybrid', ('hybrid',)),
    ('Blower', ('blower',)),
    ('Air', ('dual fan', 'triple fan', 'air', 'fan', 'windforce')),
]

MEMORY_TYPE_KEYWORDS = [
    ('DDR5', ('ddr5', 'pc5-')),
    ('DDR4', ('ddr4', 'pc4-')),
    ('DDR3', ('ddr3', 'pc3-')),
    ('DDR2', ('ddr2', 'pc2-')),
]

CPU_SERIES_KEYWORDS = [
    ('Intel Core i9', ('core i9', 'i9-')),
    ('Intel Core i7', ('core i7', 'i7-')),
    ('Intel Core i5', ('core i5', 'i5-')),
    ('Intel Core i3', ('core i3', 'i3-')),
    ('Intel Xeon', ('xeon',)),
    ('AMD Ryzen 9', ('ryzen 9', 'r9-')),
    ('AMD Ryzen 7', ('ryzen 7', 'r7-')),
    ('AMD Ryzen 5', ('ryzen 5', 'r5-')),
    ('AMD Ryzen 3', ('ryzen 3', 'r3-')),
    ('AMD Threadripper', ('threadripper', 'tr ')),
]

CPU_SOCKET_KEYWORDS = [
    ('LGA1700', ('lga1700',)),
    ('LGA1200', ('lga1200',)),
    ('LGA1151', ('lga1151',)),
    ('LGA2011', ('lga2011', 'lga 2011')),
    ('AM5', ('am5',)),
    ('AM4', ('am4',)),
    ('sTRX4', ('strx4', 'sTRX4', 'socket strx4')),
    ('TR4', ('tr4', 'socket tr4')),
]

MOTHERBOARD_CHIPSET_KEYWORDS = [
    ('X870', ('x870',)),
    ('X670', ('x670',)),
    ('X570', ('x570',)),
    ('B650', ('b650',)),
    ('B550', ('b550',)),
    ('B450', ('b450',)),
    ('A620', ('a620',)),
    ('Z890', ('z890',)),
    ('Z790', ('z790',)),
    ('Z690', ('z690',)),
    ('Z590', ('z590',)),
    ('Z490', ('z490',)),
    ('Z390', ('z390',)),
    ('Z370', ('z370',)),
    ('B760', ('b760',)),
    ('H770', ('h770',)),
    ('H670', ('h670',)),
    ('H610', ('h610',)),
    ('Q670', ('q670',)),
]

CASE_FORM_FACTOR_KEYWORDS = [
    ('E-ATX', ('e-atx', 'eatx')),
    ('ATX', ('atx',)),
    ('Micro ATX', ('micro atx', 'matx')),
    ('Mini ITX', ('mini itx', 'mitx', 'mini-itx')),
    ('ITX', (' itx',)),
]

CASE_TYPE_KEYWORDS = [
    ('Full Tower', ('full tower',)),
    ('Mid Tower', ('mid tower',)),
    ('Micro Tower', ('micro tower', 'micro-atx tower')),
    ('Mini Tower', ('mini tower',)),
    ('Small Form Factor', ('sff', 'small form factor')),
]

CASE_SIDE_PANEL_KEYWORDS = [
    ('Tempered Glass', ('tempered glass', 'glass side')),
    ('Mesh', ('mesh',)),
    ('Solid', ('solid panel',)),
]

GPU_COLOR_KEYWORDS = [
    ('Black', ('black', 'đen')),
    ('White', ('white', 'trắng')),
    ('Silver', ('silver',)),
    ('Red', ('red', 'đỏ')),
    ('Blue', ('blue', 'xanh dương')),
]

OPTICAL_INTERFACE_KEYWORDS = [
    ('SATA', ('sata',)),
    ('USB', ('usb',)),
    ('IDE', ('ide', 'pata')),
]

NIC_SPEED_KEYWORDS = [
    ('10 Gbps', ('10g', '10 gbps', '10000mbps')),
    ('5 Gbps', ('5g', '5 gbps')),
    ('2.5 Gbps', ('2.5g', '2.5 gbps', '2500mbps')),
    ('1 Gbps', ('1g', '1 gbps', '1000mbps', 'gigabit')),
    ('100 Mbps', ('100mbps', 'fast ethernet')),
]

BEARING_TYPE_KEYWORDS = [
    ('Fluid Dynamic', ('fluid', 'hydraulic')),
    ('Ball', ('ball bearing', 'dual ball')),
    ('Sleeve', ('sleeve',)),
    ('Rifle', ('rifle',)),
]

COOLER_TYPE_KEYWORDS = [
    ('Liquid', ('liquid', 'water', 'aio')),
    ('Air', ('air', 'tower cooler', 'fan')),
    ('Hybrid', ('hybrid',)),
]

ADAPTIVE_SYNC_KEYWORDS = [
    ('G-Sync', ('g-sync',)),
    ('FreeSync', ('freesync',)),
    ('Adaptive Sync', ('adaptive sync',)),
]

EFFICIENCY_KEYWORDS = [
    ('80+ Titanium', ('80+ titanium', 'titanium')),
    ('80+ Platinum', ('80+ platinum', 'platinum')),
    ('80+ Gold', ('80+ gold', 'gold')),
    ('80+ Silver', ('80+ silver', 'silver')),
    ('80+ Bronze', ('80+ bronze', 'bronze')),
    ('80+ White', ('80+ white', 'white 80+')),
]

def _flatten_strings(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, (int, float)):
        return [str(value)]
    if isinstance(value, list):
        parts: List[str] = []
        for item in value:
            parts.extend(_flatten_strings(item))
        return parts
    if isinstance(value, dict):
        parts: List[str] = []
        for item in value.values():
            parts.extend(_flatten_strings(item))
        return parts
    return []


def aggregate_text(rec: Dict[str, Any], extra_fields: Optional[Iterable[Any]] = None) -> str:
    parts: List[str] = []
    for value in rec.values():
        parts.extend(_flatten_strings(value))
    if extra_fields:
        for value in extra_fields:
            parts.extend(_flatten_strings(value))
    return ' '.join(part for part in parts if part)


def _normalize_search_text(text: Optional[str]) -> Tuple[str, str]:
    if not text:
        return '', ''
    lowered = text.lower()
    compact = re.sub(r'[\s\-_/\\]+', '', lowered)
    return lowered, compact


def _has_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str) and not value.strip():
        return False
    if isinstance(value, (list, dict)) and len(value) == 0:
        return False
    return True


def _match_option_in_text(
    option: Any,
    unit: Optional[str],
    text_lower: str,
    text_compact: str,
) -> bool:
    if option is None:
        return False
    option_text = str(option)
    if not option_text:
        return False

    option_lower = option_text.lower()
    option_compact = re.sub(r'[\s\-_/\\]+', '', option_lower)

    if option_lower in text_lower:
        return True
    if option_compact and option_compact in text_compact:
        return True

    if isinstance(option, (int, float)):
        # Match whole numbers (e.g. 16) using word boundaries when possible.
        pattern = rf'\b{re.escape(option_lower)}\b'
        if re.search(pattern, text_lower):
            return True

    token_parts = [part for part in re.split(r'[\s\-_/]+', option_lower) if part]
    if len(token_parts) >= 2:
        # Allow matching without leading brand tokens (e.g., "AMD Zen 5" -> "Zen 5").
        for start_idx in range(1, len(token_parts)):
            candidate_tokens = token_parts[start_idx:]
            if not candidate_tokens:
                continue
            candidate = ' '.join(candidate_tokens)
            if len(candidate) < 3:
                continue
            candidate_compact = re.sub(r'[\s\-_/]+', '', candidate)
            if candidate in text_lower or candidate_compact in text_compact:
                return True

    if unit:
        unit_lower = str(unit).lower()
        unit_compact = re.sub(r'[\s\-_/\\]+', '', unit_lower)
        combos = [
            f"{option_lower} {unit_lower}",
            f"{option_lower}{unit_lower}",
            f"{option_lower}{unit_compact}",
            f"{option_compact}{unit_compact}",
        ]
        for candidate in combos:
            candidate_compact = re.sub(r'[\s\-_/\\]+', '', candidate)
            if candidate_compact and candidate_compact in text_compact:
                return True
    return False


def _infer_value_from_options(attr_meta: Dict[str, Any], text_lower: str, text_compact: str) -> Optional[Any]:
    options = attr_meta.get('options')
    if not options:
        return None
    unit = attr_meta.get('unit')
    for option in options:
        if _match_option_in_text(option, unit, text_lower, text_compact):
            return option
    return None


def keyword_search(text: str, mapping: Iterable[Tuple[str, Iterable[str]]]) -> Optional[str]:
    if not text:
        return None
    lowered = text.lower()
    for value, keywords in mapping:
        for keyword in keywords:
            needle = keyword.lower()
            if needle and needle in lowered:
                return value
    return None


def collect_all_keywords(text: str, mapping: Iterable[Tuple[str, Iterable[str]]]) -> List[str]:
    results: List[str] = []
    if not text:
        return results
    lowered = text.lower()
    for value, keywords in mapping:
        for keyword in keywords:
            if keyword.lower() in lowered:
                if value not in results:
                    results.append(value)
                break
    return results


def bool_from_keywords(
    text: str,
    true_keywords: Iterable[str],
    false_keywords: Optional[Iterable[str]] = None,
) -> Optional[bool]:
    if not text:
        return None
    lowered = text.lower()
    for keyword in true_keywords:
        if keyword.lower() in lowered:
            return True
    if false_keywords:
        for keyword in false_keywords:
            if keyword.lower() in lowered:
                return False
    return None


def extract_int_from_pattern(text: str, pattern: str) -> Optional[int]:
    if not text:
        return None
    match = re.search(pattern, text, flags=re.IGNORECASE)
    if match:
        try:
            return int(match.group(1))
        except (ValueError, TypeError):
            return None
    return None


def extract_float_from_pattern(text: str, pattern: str) -> Optional[float]:
    if not text:
        return None
    match = re.search(pattern, text, flags=re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except (ValueError, TypeError):
            return None
    return None


def calc_total_capacity(modules: Any) -> Optional[int]:
    if isinstance(modules, list) and len(modules) == 2:
        try:
            count = int(modules[0])
            size = int(modules[1])
            return count * size
        except (TypeError, ValueError):
            return None
    return None


def capacity_from_name(text: str) -> Optional[int]:
    return extract_int_from_pattern(text, r'(\d+)\s*gb') if text else None


def detect_os_version(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    text = name.replace('Microsoft', '').strip()
    for token in (' - ', ' OEM', ' Retail', '('):
        if token in text:
            text = text.split(token)[0].strip()
    return text or None


# ---------------------------------------------------------------------------
# Attribute mappers per dataset kind
# ---------------------------------------------------------------------------


def cpu_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    manufacturer = keyword_search(text, CPU_MANUFACTURER_KEYWORDS) or parse_brand(rec.get('name', ''))
    series = keyword_search(text, CPU_SERIES_KEYWORDS)
    socket = keyword_search(text, CPU_SOCKET_KEYWORDS)
    return {
        'socket': socket,
        'manufacturer': manufacturer,
        'series': series,
        'core_count': rec.get('core_count'),
        'core_clock': rec.get('core_clock'),
        'boost_clock': rec.get('boost_clock'),
        'microarchitecture': rec.get('microarchitecture'),
        'tdp': rec.get('tdp'),
        'graphics': rec.get('graphics'),
    }


def video_card_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    manufacturer = keyword_search(text, GPU_MANUFACTURER_KEYWORDS) or parse_brand(rec.get('name', ''))
    interface = keyword_search(text, PCIE_INTERFACE_KEYWORDS)
    cooling_type = keyword_search(text, COOLING_TYPE_KEYWORDS)
    color = rec.get('color') or keyword_search(text, GPU_COLOR_KEYWORDS)
    return {
        'manufacturer': manufacturer,
        'chipset': rec.get('chipset'),
        'memory': rec.get('memory'),
        'core_clock': rec.get('core_clock'),
        'boost_clock': rec.get('boost_clock'),
        'interface': interface,
        'cooling_type': cooling_type,
        'length': rec.get('length'),
        'color': color,
    }


def memory_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    ram_type = keyword_search(text, MEMORY_TYPE_KEYWORDS)
    total_capacity = rec.get('total_capacity') or calc_total_capacity(rec.get('modules')) or capacity_from_name(text)
    ecc = bool_from_keywords(text, ('ecc', 'error correcting'), ('non-ecc', 'non ecc'))
    return {
        'type': ram_type,
        'total_capacity': total_capacity,
        'speed': format_memory_speed(rec.get('speed')),
        'modules': format_modules(rec.get('modules')),
        'ecc': ecc,
        'price_per_gb': rec.get('price_per_gb'),
        'color': rec.get('color'),
        'first_word_latency': rec.get('first_word_latency'),
        'cas_latency': rec.get('cas_latency'),
    }


def motherboard_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    chipset = rec.get('chipset') or keyword_search(text, MOTHERBOARD_CHIPSET_KEYWORDS)
    memory_type = rec.get('memory_type') or keyword_search(text, MEMORY_TYPE_KEYWORDS)
    wifi = rec.get('wifi')
    if wifi is None:
        wifi = bool_from_keywords(text, ('wifi', 'wi-fi', 'wireless'), ('no wifi', 'without wifi'))
    return {
        'socket': rec.get('socket'),
        'chipset': chipset,
        'form_factor': rec.get('form_factor'),
        'memory_type': memory_type,
        'max_memory': rec.get('max_memory'),
        'memory_slots': rec.get('memory_slots'),
        'wifi': wifi,
        'color': rec.get('color'),
    }


def psu_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    efficiency = rec.get('efficiency')
    if isinstance(efficiency, str):
        efficiency = efficiency.strip()
    if not efficiency:
        efficiency = keyword_search(text, EFFICIENCY_KEYWORDS)
    if isinstance(efficiency, str) and not efficiency.lower().startswith('80+'):
        efficiency = efficiency.title()
    modular = normalize_modular(rec.get('modular'))
    connectors = rec.get('connectors')
    if connectors is None:
        connectors = extract_int_from_pattern(text, r'(\d+)\s*(?:x\s*)?(?:6\+2|8)(?:-pin)?')
    return {
        'type': rec.get('type'),
        'efficiency': efficiency,
        'wattage': rec.get('wattage'),
        'modular': modular,
        'connectors': connectors,
        'color': rec.get('color'),
    }


def case_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    case_type = rec.get('type') or keyword_search(text, CASE_TYPE_KEYWORDS)
    side_panel = rec.get('side_panel') or keyword_search(text, CASE_SIDE_PANEL_KEYWORDS)
    motherboard_support_list = collect_all_keywords(text, CASE_FORM_FACTOR_KEYWORDS)
    motherboard_support = ' / '.join(motherboard_support_list) if motherboard_support_list else rec.get('motherboard_support')
    fan_included = rec.get('fan_included')
    if fan_included is None:
        fan_included = extract_int_from_pattern(text, r'(\d+)\s*(?:pre-?installed\s*)?fans?')
    rgb = rec.get('rgb')
    if rgb is None:
        rgb = bool_from_keywords(text, ('rgb', 'argb', 'addressable rgb'), ('no rgb', 'non-rgb'))
    return {
        'type': case_type,
        'motherboard_support': motherboard_support,
        'color': rec.get('color'),
        'psu': rec.get('psu'),
        'side_panel': side_panel,
        'external_volume': rec.get('external_volume'),
        'internal_35_bays': rec.get('internal_35_bays'),
        'fan_included': fan_included,
        'rgb': rgb,
    }


def monitor_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    adaptive_sync = keyword_search(text, ADAPTIVE_SYNC_KEYWORDS)
    curved = rec.get('curved')
    if curved is None:
        curved = bool_from_keywords(text, ('curved', 'curve'), ('flat', 'non-curved'))
    return {
        'screen_size': rec.get('screen_size') or rec.get('size'),
        'resolution': format_resolution(rec.get('resolution')),
        'refresh_rate': rec.get('refresh_rate'),
        'response_time': rec.get('response_time'),
        'panel_type': rec.get('panel_type') or rec.get('panel'),
        'adaptive_sync': adaptive_sync,
        'curved': curved,
        'aspect_ratio': rec.get('aspect_ratio'),
    }


def keyboard_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    mechanical = rec.get('mechanical')
    if mechanical is None:
        mechanical = bool_from_keywords(text, ('mechanical', 'switch'), ('membrane', 'scissor'))
    return {
        'style': rec.get('style'),
        'switches': rec.get('switches'),
        'mechanical': mechanical,
        'backlit': rec.get('backlit'),
        'tenkeyless': rec.get('tenkeyless'),
        'connection_type': rec.get('connection_type'),
        'color': rec.get('color'),
    }


def mouse_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    connection = rec.get('connection_type')
    if isinstance(connection, str) and ',' in connection:
        connection = ' / '.join(part.strip() for part in connection.split(','))
    text = aggregate_text(rec)
    buttons = rec.get('buttons')
    if buttons is None:
        buttons = extract_int_from_pattern(text, r'(\d+)\s*(?:buttons|btns|nút)')
    return {
        'tracking_method': rec.get('tracking_method'),
        'connection_type': connection,
        'max_dpi': rec.get('max_dpi'),
        'buttons': buttons,
        'hand_orientation': rec.get('hand_orientation'),
        'color': rec.get('color'),
    }


def headphones_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    noise_cancelling = rec.get('noise_cancelling')
    if noise_cancelling is None:
        noise_cancelling = bool_from_keywords(text, ('noise cancelling', 'noise-cancelling', 'anc', 'active noise'), ('passive noise', 'no anc'))
    return {
        'type': rec.get('type'),
        'frequency_response': format_frequency_response(rec.get('frequency_response')),
        'microphone': rec.get('microphone'),
        'wireless': rec.get('wireless'),
        'noise_cancelling': noise_cancelling,
        'enclosure_type': rec.get('enclosure_type'),
        'color': rec.get('color'),
    }


def os_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    version = rec.get('version') or detect_os_version(rec.get('name'))
    return {
        'version': version,
        'mode': format_architecture(rec.get('mode')),
        'max_memory': rec.get('max_memory'),
    }


def sound_card_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    channels = rec.get('channels')
    if isinstance(channels, (int, float)):
        channels = f"{channels:.1f}" if isinstance(channels, float) and not channels.is_integer() else str(int(channels))
    text = aggregate_text(rec)
    ports = rec.get('ports')
    if ports is None:
        ports = extract_int_from_pattern(text, r'(\d+)\s*(?:ports|jacks|outputs)')
    return {
        'channels': channels,
        'digital_audio': rec.get('digital_audio'),
        'snr': rec.get('snr'),
        'sample_rate': rec.get('sample_rate'),
        'chipset': rec.get('chipset'),
        'interface': rec.get('interface'),
        'ports': ports,
    }


def speakers_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    configuration = rec.get('configuration')
    if isinstance(configuration, (int, float)):
        configuration = f"{configuration:.1f}" if isinstance(configuration, float) and not configuration.is_integer() else f"{int(configuration)}.0"
    text = aggregate_text(rec)
    wireless = rec.get('wireless')
    if wireless is None:
        wireless = bool_from_keywords(text, ('wireless', 'bluetooth'), ('wired', '3.5mm only'))
    return {
        'configuration': configuration,
        'wattage': rec.get('wattage'),
        'frequency_response': format_frequency_response(rec.get('frequency_response')),
        'wireless': wireless,
        'color': rec.get('color'),
    }


def ups_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    battery_time = rec.get('battery_time')
    if battery_time is None:
        battery_time = extract_int_from_pattern(text, r'(\d+)\s*(?:min|minutes)')
    return {
        'capacity_w': rec.get('capacity_w'),
        'capacity_va': rec.get('capacity_va'),
        'battery_time': battery_time,
    }


def webcam_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    frame_rate = rec.get('frame_rate')
    if frame_rate is None:
        frame_rate = extract_int_from_pattern(text, r'(\d+)\s*(?:fps)')
    return {
        'resolutions': list_to_string(rec.get('resolutions')),
        'connection': rec.get('connection'),
        'focus_type': rec.get('focus_type'),
        'os': list_to_string(rec.get('os')),
        'fov': rec.get('fov'),
        'frame_rate': frame_rate,
    }


def webcam_description(rec: Dict[str, Any]) -> str:
    resolutions = rec.get('resolutions')
    if isinstance(resolutions, list) and resolutions:
        return str(resolutions[0])
    return rec.get('name') or ''


def wired_nic_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    speed = rec.get('speed') or keyword_search(text, NIC_SPEED_KEYWORDS)
    return {
        'interface': rec.get('interface'),
        'speed': speed,
        'color': rec.get('color'),
    }


def wireless_nic_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    bluetooth = rec.get('bluetooth')
    if bluetooth is None:
        bluetooth = bool_from_keywords(text, ('bluetooth',), ('no bluetooth', 'without bluetooth'))
    return {
        'protocol': rec.get('protocol'),
        'interface': rec.get('interface'),
        'bluetooth': bluetooth,
        'color': rec.get('color'),
    }


def case_accessory_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    form_factor = rec.get('form_factor')
    if form_factor is not None and not isinstance(form_factor, str):
        form_factor = str(form_factor)
    text = aggregate_text(rec)
    compatibility = rec.get('compatibility')
    if compatibility is None and text:
        match = re.search(r'(?:for|compatible with)\s+([A-Za-z0-9\-+ ]+)', text, flags=re.IGNORECASE)
        if match:
            compatibility = match.group(1).strip(' .,-')
    return {
        'type': rec.get('type'),
        'form_factor': form_factor,
        'compatibility': compatibility,
    }


def case_fan_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    size = rec.get('size')
    if isinstance(size, list) and size:
        size = size[0]
    text = aggregate_text(rec)
    bearing_type = rec.get('bearing_type') or keyword_search(text, BEARING_TYPE_KEYWORDS)
    return {
        'size': size,
        'color': rec.get('color'),
        'rpm': format_range_string(rec.get('rpm'), 'RPM') if rec.get('rpm') is not None else None,
        'airflow': format_range_string(rec.get('airflow'), 'CFM'),
        'noise_level': format_range_string(rec.get('noise_level'), 'dBA'),
        'pwm': rec.get('pwm'),
        'bearing_type': bearing_type,
    }


def cpu_cooler_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    size = rec.get('size')
    if isinstance(size, list) and size:
        size = size[-1]
    text = aggregate_text(rec)
    cooler_type = rec.get('type') or keyword_search(text, COOLER_TYPE_KEYWORDS)
    return {
        'type': cooler_type,
        'rpm': format_range_string(rec.get('rpm'), 'RPM'),
        'noise_level': format_range_string(rec.get('noise_level'), 'dBA'),
        'color': rec.get('color'),
        'size': size,
    }


def external_drive_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    portable = rec.get('portable')
    if portable is None:
        portable = bool_from_keywords(text, ('portable', 'pocket'), ('desktop', 'stationary'))
    return {
        'type': rec.get('type'),
        'interface': rec.get('interface'),
        'capacity': rec.get('capacity'),
        'price_per_gb': rec.get('price_per_gb'),
        'portable': portable,
        'color': rec.get('color'),
    }


def internal_drive_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'capacity': rec.get('capacity'),
        'price_per_gb': rec.get('price_per_gb'),
        'type': rec.get('type'),
        'cache': rec.get('cache'),
        'form_factor': rec.get('form_factor'),
        'interface': rec.get('interface'),
    }


def optical_drive_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    interface = rec.get('interface') or keyword_search(text, OPTICAL_INTERFACE_KEYWORDS)
    return {
        'bd': rec.get('bd'),
        'dvd': rec.get('dvd'),
        'cd': rec.get('cd'),
        'bd_write': rec.get('bd_write'),
        'dvd_write': rec.get('dvd_write'),
        'cd_write': rec.get('cd_write'),
        'interface': interface,
    }


def fan_controller_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    display = rec.get('display')
    if display is None:
        display = bool_from_keywords(text, ('display', 'screen', 'lcd', 'touchscreen'), ('no display', 'screenless'))
    return {
        'channels': rec.get('channels'),
        'channel_wattage': rec.get('channel_wattage'),
        'pwm': rec.get('pwm'),
        'form_factor': rec.get('form_factor'),
        'display': display,
        'color': rec.get('color'),
    }


def thermal_paste_attrs(rec: Dict[str, Any]) -> Dict[str, Any]:
    text = aggregate_text(rec)
    conductivity = rec.get('conductivity')
    if conductivity is None:
        conductivity = extract_float_from_pattern(text, r'(\d+(?:\.\d+)?)\s*(?:w/mk)')
    return {
        'amount': rec.get('amount'),
        'conductivity': conductivity,
    }


# ---------------------------------------------------------------------------
# Mapper registry
# ---------------------------------------------------------------------------


CATEGORY_MAPPERS: Dict[str, MapperConfig] = {
    'cpu': MapperConfig('CPU', cpu_attrs, lambda rec: f"{rec.get('core_count')}C/{rec.get('core_clock')}GHz {rec.get('microarchitecture') or ''}".strip()),
    'video-card': MapperConfig('Video Card', video_card_attrs, lambda rec: rec.get('chipset') or ''),
    'memory': MapperConfig('Memory', memory_attrs, lambda rec: f"{format_modules(rec.get('modules')) or ''} {format_memory_speed(rec.get('speed')) or ''}".strip()),
    'motherboard': MapperConfig('Motherboard', motherboard_attrs, lambda rec: f"{rec.get('socket')} {rec.get('chipset') or ''}".strip()),
    'power-supply': MapperConfig('Power Supply', psu_attrs, lambda rec: f"{rec.get('wattage')}W {rec.get('efficiency')}".strip()),
    'case': MapperConfig('Case', case_attrs, lambda rec: rec.get('type') or ''),
    'monitor': MapperConfig('Monitor', monitor_attrs, lambda rec: f"{rec.get('screen_size')}\" {format_resolution(rec.get('resolution'))}".strip()),
    'keyboard': MapperConfig('Keyboard', keyboard_attrs, lambda rec: rec.get('style') or ''),
    'mouse': MapperConfig('Mouse', mouse_attrs, lambda rec: rec.get('tracking_method') or ''),
    'headphones': MapperConfig('Headphones', headphones_attrs, lambda rec: rec.get('type') or ''),
    'os': MapperConfig('Operating System', os_attrs, lambda rec: rec.get('name') or ''),
    'sound-card': MapperConfig('Sound Card', sound_card_attrs, lambda rec: rec.get('chipset') or ''),
    'speakers': MapperConfig('Speakers', speakers_attrs, lambda rec: rec.get('configuration') or ''),
    'ups': MapperConfig('UPS', ups_attrs, lambda rec: rec.get('capacity_va') or ''),
    'webcam': MapperConfig('Webcam', webcam_attrs, webcam_description),
    'wired-network-card': MapperConfig('Wired Network Card', wired_nic_attrs, lambda rec: rec.get('interface') or ''),
    'wireless-network-card': MapperConfig('Wireless Network Card', wireless_nic_attrs, lambda rec: rec.get('protocol') or ''),
    'case-accessory': MapperConfig('Case Accessory', case_accessory_attrs, lambda rec: rec.get('type') or ''),
    'case-fan': MapperConfig('Case Fan', case_fan_attrs, lambda rec: f"{rec.get('size')}mm Fan" if rec.get('size') else rec.get('name') or ''),
    'cpu-cooler': MapperConfig('CPU Cooler', cpu_cooler_attrs, lambda rec: rec.get('name') or ''),
    'external-hard-drive': MapperConfig('External Hard Drive', external_drive_attrs, lambda rec: rec.get('type') or ''),
    'internal-hard-drive': MapperConfig('Internal Hard Drive', internal_drive_attrs, lambda rec: rec.get('type') or ''),
    'optical-drive': MapperConfig('Optical Drive', optical_drive_attrs, lambda rec: rec.get('name') or ''),
    'fan-controller': MapperConfig('Fan Controller', fan_controller_attrs, lambda rec: rec.get('name') or ''),
    'thermal-paste': MapperConfig('Thermal Paste', thermal_paste_attrs, lambda rec: rec.get('name') or ''),
}


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


def compose_attributes(
    category: str,
    values: Dict[str, Any],
    rec: Dict[str, Any],
    search_helper: Optional[DdgsSearchHelper] = None,
) -> Dict[str, Any]:
    meta = ATTR_META.get(category)
    if not meta:
        raise ValueError(f'No attribute metadata for category {category}')

    enriched = dict(values)
    text = aggregate_text(rec)
    text_lower, text_compact = _normalize_search_text(text)
    product_name = rec.get('name') or 'Unnamed Product'
    for code, attr_meta in meta.items():
        if _has_value(enriched.get(code)):
            continue
        inferred = _infer_value_from_options(attr_meta, text_lower, text_compact)
        if inferred is not None:
            enriched[code] = inferred
            continue
        if search_helper:
            options = attr_meta.get('options') or []
            if not options:
                logger.info(
                    "[DDGS][SKIP] product='%s' category='%s' attr='%s' do metadata không có options",
                    product_name,
                    category,
                    code,
                )
                continue
            inferred = search_helper.infer_from_search(rec, category, code, attr_meta)
            if inferred is not None:
                enriched[code] = inferred

    ordered: Dict[str, Any] = {}
    for code in meta.keys():
        ordered[code] = enriched.get(code)
    return ordered


def iter_jsonl(path: str) -> Iterable[Dict[str, Any]]:
    with open(path, 'r', encoding='utf-8') as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)


def count_jsonl_records(path: str) -> int:
    total = 0
    with open(path, 'r', encoding='utf-8') as handle:
        for line in handle:
            if line.strip():
                total += 1
    return total


def sql_quote(value: Optional[str]) -> str:
    if value is None:
        return 'NULL'
    safe = value.replace("'", "''")
    return f"'{safe}'"


def json_to_sql(obj: Dict[str, Any]) -> str:
    text = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    text = text.replace("'", "''")
    return f"'{text}'::jsonb"


def build_insert_statement(row: ProductRow) -> str:
    name_sql = sql_quote(row.name)
    desc_sql = sql_quote(row.description)
    price_sql = f"{row.price_vnd:.2f}"
    specs_sql = json_to_sql(row.specifications)
    attrs_sql = json_to_sql(row.attributes)
    category_sql = sql_quote(row.category_name)
    return (
        "INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications, attributes) "
        "SELECT {name}, {desc}, {price}, {qty}, {low}, (SELECT id FROM categories WHERE name = {cat}), {specs}, {attrs} "
        "WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = {name} AND p.category_id = (SELECT id FROM categories WHERE name = {cat}));"
    ).format(
        name=name_sql,
        desc=desc_sql,
        price=price_sql,
        qty=row.quantity,
        low=row.low_stock_threshold,
        cat=category_sql,
        specs=specs_sql,
        attrs=attrs_sql,
    )


def normalize_description(desc: Optional[str]) -> str:
    if not desc:
        return ''
    return ' '.join(str(desc).split())


def build_product_record(
    rec: Dict[str, Any],
    filename: str,
    mapper: MapperConfig,
    quantity: int,
    low_stock: int,
    search_helper: Optional[DdgsSearchHelper] = None,
    fallback_description: Optional[str] = None,
    price_override_vnd: Optional[float] = None,
) -> Optional[ProductRow]:
    raw_price = rec.get('price')
    price_vnd = price_override_vnd if price_override_vnd is not None else usd_to_vnd(raw_price)
    out_of_stock = price_vnd is None or price_vnd <= 0
    if price_vnd is None:
        price_vnd = 0.0
    attrs = compose_attributes(mapper.category_name, mapper.attr_builder(rec), rec, search_helper)
    description = fallback_description or ''
    if mapper.description_builder:
        try:
            description = mapper.description_builder(rec) or description
        except Exception:
            pass
    description = normalize_description(description)
    specs = dict(rec)
    specs.pop('price', None)
    specs['brand'] = parse_brand(rec.get('name', ''))
    specs['source_file'] = os.path.basename(filename)
    specs['source_category'] = mapper.category_name
    return ProductRow(
        name=rec.get('name') or 'Unnamed Product',
        description=description,
        price_vnd=price_vnd,
        category_name=mapper.category_name,
        attributes=attrs,
        specifications=specs,
        quantity=0 if out_of_stock else quantity,
        low_stock_threshold=low_stock,
    )


def _worker_initializer(
    attr_meta: Dict[str, Dict[str, Dict[str, Any]]],
    ddgs_config: Optional[DdgsConfig],
) -> None:
    global ATTR_META, _WORKER_SEARCH_HELPER
    ATTR_META = attr_meta
    if ddgs_config:
        _WORKER_SEARCH_HELPER = DdgsSearchHelper(
            max_results=ddgs_config.max_results,
            region=ddgs_config.region,
            safesearch=ddgs_config.safesearch,
            backend=ddgs_config.backend,
            timeout=ddgs_config.timeout,
        )
    else:
        _WORKER_SEARCH_HELPER = None


def _worker_build_insert(payload: Tuple[Dict[str, Any], str, str, int, int, Optional[float]]) -> Optional[str]:
    rec, path, slug, quantity, low_stock, price_override = payload
    mapper = CATEGORY_MAPPERS[slug]
    row = build_product_record(
        rec,
        path,
        mapper,
        quantity,
        low_stock,
        search_helper=_WORKER_SEARCH_HELPER,
        price_override_vnd=price_override,
    )
    if row is None:
        return None
    return build_insert_statement(row)


def discover_files(source_dir: str, only: Optional[List[str]] = None) -> List[str]:
    all_files = []
    for entry in sorted(os.listdir(source_dir)):
        if not entry.endswith('.jsonl'):
            continue
        slug = os.path.splitext(entry)[0]
        if only and slug not in only:
            continue
        if slug not in CATEGORY_MAPPERS:
            continue
        all_files.append(os.path.join(source_dir, entry))
    return all_files


def generate_sql(
    args: argparse.Namespace,
    search_helper: Optional[DdgsSearchHelper] = None,
    ddgs_config: Optional[DdgsConfig] = None,
) -> None:
    source_dir = os.path.abspath(os.path.expanduser(args.source))
    files = discover_files(source_dir, args.only)
    if not files:
        raise SystemExit('Không tìm thấy JSONL phù hợp. Kiểm tra --source hoặc --only.')
    file_infos = []
    global_target_total = 0
    for path in files:
        slug = os.path.splitext(os.path.basename(path))[0]
        mapper = CATEGORY_MAPPERS.get(slug)
        if not mapper:
            continue
        available_records = count_jsonl_records(path)
        effective_limit = args.limit if args.limit is not None else available_records
        target_total = min(available_records, effective_limit)
        file_infos.append(
            {
                'path': path,
                'slug': slug,
                'mapper': mapper,
                'available': available_records,
                'target': target_total,
            }
        )
        global_target_total += target_total

    if not file_infos:
        raise SystemExit('Không có mapper phù hợp cho các JSONL được chọn.')
    if global_target_total == 0:
        raise SystemExit('Không có bản ghi nào để xử lý (có thể do limit quá nhỏ hoặc file rỗng).')

    logger.info('[GLOBAL] Tổng sản phẩm dự kiến: %d', global_target_total)
    out_path = os.path.abspath(os.path.expanduser(args.out))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    executor: Optional[ProcessPoolExecutor] = None
    try:
        if args.workers > 1:
            executor = ProcessPoolExecutor(
                max_workers=args.workers,
                initializer=_worker_initializer,
                initargs=(ATTR_META, ddgs_config),
            )

        with open(out_path, 'w', encoding='utf-8') as handle:
            handle.write('-- ============================================\n')
            handle.write('-- Generated product data\n')
            handle.write(f"-- Generated on {datetime.now().isoformat(timespec='seconds')}\n")
            handle.write('-- ============================================\n')
            handle.write('BEGIN;\n\n')

            total_products = 0
            global_processed = 0
            for info in file_infos:
                path = info['path']
                slug = info['slug']
                mapper = info['mapper']
                available_records = info['available']
                target_total = info['target']
                display_total = target_total or available_records or 0
                handle.write(f"-- ===== {slug} ({mapper.category_name}) =====\n")
                if target_total == 0:
                    logger.info("[PRODUCT][%s] Không có dữ liệu để xử lý", slug)
                    handle.write('\n')
                    continue

                count = 0
                limit_reached = False
                pending_jobs: Deque[PendingJob] = deque()
                max_pending = max(args.workers, 1) if executor else 0

                def process_job(job: PendingJob) -> None:
                    nonlocal count, total_products, global_processed, limit_reached
                    result = job.future.result()
                    if limit_reached:
                        logger.info(
                            "%d/%d (global %d/%d): skipped (đã đạt limit)",
                            job.current_index,
                            display_total,
                            job.global_index,
                            global_target_total,
                        )
                        return
                    if result is None:
                        logger.info(
                            "%d/%d (global %d/%d): skipped",
                            job.current_index,
                            display_total,
                            job.global_index,
                            global_target_total,
                        )
                        return
                    handle.write(result + '\n')
                    handle.flush()
                    global_processed += 1
                    total_products += 1
                    count += 1
                    logger.info(
                        "%d/%d (global %d/%d): saved",
                        job.current_index,
                        display_total,
                        global_processed,
                        global_target_total,
                    )
                    if target_total and count >= target_total:
                        limit_reached = True

                def drain_pending(force: bool = False) -> None:
                    if not executor:
                        return
                    if force:
                        while pending_jobs:
                            process_job(pending_jobs.popleft())
                    else:
                        if pending_jobs:
                            process_job(pending_jobs.popleft())

                for rec in iter_jsonl(path):
                    if limit_reached:
                        break
                    if executor and target_total:
                        while not limit_reached and (count + len(pending_jobs)) >= (target_total + max_pending):
                            drain_pending(force=False)
                            if limit_reached:
                                break
                        if limit_reached:
                            break
                    converted_price = usd_to_vnd(rec.get('price'))
                    if args.skip_free and (converted_price is None or converted_price <= 0):
                        continue
                    inflight = len(pending_jobs) if executor else 0
                    current_index_hint = count + inflight + 1
                    current_index = min(current_index_hint, display_total) if display_total else current_index_hint
                    global_hint = global_processed + inflight + 1
                    global_index = min(global_hint, global_target_total)
                    logger.info(
                        "Sản phẩm %d/%d (global %d/%d): searching",
                        current_index,
                        display_total,
                        global_index,
                        global_target_total,
                    )
                    if executor:
                        future = executor.submit(
                            _worker_build_insert,
                            (rec, path, slug, args.quantity, args.low_stock, converted_price),
                        )
                        pending_jobs.append(PendingJob(future, current_index, global_index))
                        if len(pending_jobs) > max_pending:
                            drain_pending(force=False)
                    else:
                        row = build_product_record(
                            rec,
                            path,
                            mapper,
                            args.quantity,
                            args.low_stock,
                            search_helper,
                            price_override_vnd=converted_price,
                        )
                        if row is None:
                            logger.info(
                                "%d/%d (global %d/%d): skipped",
                                current_index,
                                display_total,
                                global_index,
                                global_target_total,
                            )
                            continue
                        handle.write(build_insert_statement(row) + '\n')
                        handle.flush()
                        global_processed += 1
                        total_products += 1
                        count += 1
                        logger.info(
                            "%d/%d (global %d/%d): saved",
                            current_index,
                            display_total,
                            global_processed,
                            global_target_total,
                        )
                        if target_total and count >= target_total:
                            limit_reached = True
                            break

                if executor:
                    drain_pending(force=True)
                handle.write('\n')

            handle.write('COMMIT;\n')

    finally:
        if executor:
            executor.shutdown(wait=True, cancel_futures=True)

    print(f'Đã tạo {total_products} sản phẩm vào {out_path}')


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Generate product INSERT SQL from JSONL datasets')
    parser.add_argument('--source', default=os.path.join('pc-part-dataset', 'data', 'jsonl'), help='Thư mục chứa các file *.jsonl')
    parser.add_argument('--out', default='fake_data_product.sql', help='Đường dẫn file SQL xuất ra')
    parser.add_argument('--only', nargs='*', help='Chỉ xử lý các kind cụ thể (ví dụ: cpu video-card)')
    parser.add_argument('--limit', type=int, help='Giới hạn số bản ghi mỗi file')
    parser.add_argument('--quantity', type=int, default=20, help='Số lượng tồn kho mặc định')
    parser.add_argument('--low-stock', type=int, default=5, help='Ngưỡng cảnh báo tồn kho thấp')
    parser.add_argument('--skip-free', action='store_true', help='Bỏ qua sản phẩm có giá bằng 0')
    parser.add_argument('--attribute-config', default=DEFAULT_ATTR_JSON, help='Đường dẫn tới attribute_category.json')
    parser.add_argument('--ddgs-enabled', dest='ddgs_enabled', action='store_true', default=True, help='Dùng ddgs để truy vấn bổ sung khi thuộc tính bị thiếu (mặc định bật)')
    parser.add_argument('--no-ddgs', dest='ddgs_enabled', action='store_false', help='Tắt ddgs nếu muốn chạy offline hoàn toàn')
    parser.add_argument('--ddgs-max-results', type=int, default=5, help='Số kết quả lấy cho mỗi truy vấn ddgs')
    parser.add_argument('--ddgs-region', default='us-en', help='Region cho ddgs (vd: us-en, vn-vi)')
    parser.add_argument('--ddgs-safesearch', default='moderate', choices=('on', 'moderate', 'off'), help='Mức safesearch khi truy vấn ddgs')
    parser.add_argument('--ddgs-backend', default='auto', help='Backend chuỗi cho ddgs (vd: google, brave)')
    parser.add_argument('--ddgs-timeout', type=int, default=10, help='Timeout cho mỗi request ddgs (giây)')
    parser.add_argument('--workers', type=int, default=1, help='Số process xử lý song song (>=1)')
    return parser.parse_args()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
    args = parse_args()
    if args.workers < 1:
        args.workers = 1
    config_path = os.path.abspath(os.path.expanduser(args.attribute_config))
    if not os.path.isfile(config_path):
        raise SystemExit(f'Không tìm thấy file attribute config: {config_path}')
    global ATTR_META
    ATTR_META = load_attribute_metadata(config_path)
    search_helper: Optional[DdgsSearchHelper] = None
    ddgs_config: Optional[DdgsConfig] = None
    if args.ddgs_enabled:
        ddgs_config = DdgsConfig(
            max_results=args.ddgs_max_results,
            region=args.ddgs_region,
            safesearch=args.ddgs_safesearch,
            backend=args.ddgs_backend,
            timeout=args.ddgs_timeout,
        )
        try:
            search_helper = DdgsSearchHelper(
                max_results=ddgs_config.max_results,
                region=ddgs_config.region,
                safesearch=ddgs_config.safesearch,
                backend=ddgs_config.backend,
                timeout=ddgs_config.timeout,
            )
        except DdgsUnavailableError as exc:
            print(f"[WARN] {exc}")
            ddgs_config = None
            args.ddgs_enabled = False
    generate_sql(args, search_helper, ddgs_config)


if __name__ == '__main__':
    main()
