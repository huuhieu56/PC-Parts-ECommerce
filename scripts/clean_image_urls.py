"""Utility to drop image URLs that return non-OK HTTP responses."""

from __future__ import annotations

import argparse
import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from threading import local
from typing import Dict, Iterable, List, Tuple

import requests


LOGGER = logging.getLogger(__name__)
_THREAD_LOCAL = local()


@dataclass
class CleanerConfig:
    input_path: Path
    output_path: Path
    timeout: float
    allow_redirects: bool
    user_agent: str
    workers: int


def parse_args() -> CleanerConfig:
    parser = argparse.ArgumentParser(description="Loại bỏ img_url không truy cập được")
    parser.add_argument(
        "input_path",
        nargs="?",
        default="image_query_cache.json",
        help="Đường dẫn file JSON chứa mapping tên -> list URL",
    )
    parser.add_argument(
        "output_path",
        nargs="?",
        default="image_query_cache.cleaned.json",
        help="Đường dẫn file JSON kết quả sau khi lọc",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=3.0,
        help="Timeout cho mỗi request tới ảnh (giây)",
    )
    parser.add_argument(
        "--no-redirect",
        action="store_true",
        help="Không follow redirect khi kiểm tra URL",
    )
    parser.add_argument(
        "--user-agent",
        default=(
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/129.0 Safari/537.36"
        ),
        help="User-Agent sẽ gửi kèm trong request",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=12,
        help="Số luồng kiểm tra song song (nên <= 32)",
    )

    args = parser.parse_args()
    workers = max(1, min(args.workers, 64))
    return CleanerConfig(
        input_path=Path(args.input_path).expanduser().resolve(),
        output_path=Path(args.output_path).expanduser().resolve(),
        timeout=args.timeout,
        allow_redirects=not args.no_redirect,
        user_agent=args.user_agent,
        workers=workers,
    )


def load_mapping(path: Path) -> Dict[str, List[str]]:
    with path.open("r", encoding="utf-8") as fp:
        data = json.load(fp)
        if not isinstance(data, dict):
            raise ValueError("File JSON phải là object mapping string -> list")
        normalized: Dict[str, List[str]] = {}
        for key, value in data.items():
            if not isinstance(value, Iterable):
                continue
            normalized[key] = [str(url) for url in value]
        return normalized


def is_url_accessible(url: str, *, timeout: float, allow_redirects: bool, user_agent: str) -> bool:
    try:
        session = getattr(_THREAD_LOCAL, "session", None)
        if session is None:
            session = requests.Session()
            session.headers.update({"User-Agent": user_agent})
            _THREAD_LOCAL.session = session
        response = session.get(
            url,
            timeout=timeout,
            allow_redirects=allow_redirects,
            stream=True,
        )
        return response.ok
    except requests.RequestException as exc:  # pragma: no cover - defensive
        LOGGER.debug("URL check failed", exc_info=exc)
        return False


def _check_single(
    name: str,
    url: str,
    *,
    timeout: float,
    allow_redirects: bool,
    user_agent: str,
) -> Tuple[str, str, bool]:
    return (
        name,
        url,
        is_url_accessible(
            url,
            timeout=timeout,
            allow_redirects=allow_redirects,
            user_agent=user_agent,
        ),
    )


def filter_mapping(
    mapping: Dict[str, List[str]],
    *,
    timeout: float,
    allow_redirects: bool,
    user_agent: str,
    workers: int,
) -> Dict[str, List[str]]:
    cleaned: Dict[str, List[str]] = {key: [] for key in mapping}
    futures = []
    dropped_total = 0
    total_urls = sum(len(urls) for urls in mapping.values())
    LOGGER.info("Submitting %d URL checks with %d workers", total_urls, workers)

    with ThreadPoolExecutor(max_workers=workers) as executor:
        for name, urls in mapping.items():
            for url in urls:
                futures.append(
                    executor.submit(
                        _check_single,
                        name,
                        url,
                        timeout=timeout,
                        allow_redirects=allow_redirects,
                        user_agent=user_agent,
                    )
                )

        for idx, future in enumerate(as_completed(futures), start=1):
            name, url, is_ok = future.result()
            if is_ok:
                cleaned[name].append(url)
            else:
                dropped_total += 1
                LOGGER.debug("Drop 403/invalid URL for '%s': %s", name, url)
            if idx % 500 == 0 or idx == total_urls:
                LOGGER.info("Progress: %d/%d URLs processed", idx, total_urls)

    cleaned = {name: urls for name, urls in cleaned.items() if urls}
    LOGGER.info("Removed %d URLs; %d entries remain", dropped_total, len(cleaned))
    return cleaned


def save_mapping(path: Path, mapping: Dict[str, List[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fp:
        json.dump(mapping, fp, indent=2, ensure_ascii=False)
        fp.write("\n")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
    config = parse_args()
    LOGGER.info("Loading data from %s", config.input_path)
    mapping = load_mapping(config.input_path)
    LOGGER.info("Checking %d entries", len(mapping))
    cleaned = filter_mapping(
        mapping,
        timeout=config.timeout,
        allow_redirects=config.allow_redirects,
        user_agent=config.user_agent,
        workers=config.workers,
    )
    LOGGER.info("Saving cleaned data to %s", config.output_path)
    save_mapping(config.output_path, cleaned)


if __name__ == "__main__":
    main()