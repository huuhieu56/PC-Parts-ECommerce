# -*- coding: utf-8 -*-
"""
Lấy URL của 3 ảnh đầu tiên từ thư viện ddgs (v9.7.0)
"""

from ddgs import DDGS
import pprint

def fetch_first_image_urls(query: str, n: int = 3):
    """
    Trả về list các URL ảnh (str) từ kết quả tìm kiếm hình ảnh.
    """
    ddgs = DDGS()
    results = ddgs.images(
        query=query,
        region="us-en",       # vùng tìm kiếm
        safesearch="moderate",# có thể đổi sang "off" nếu muốn ảnh không lọc
        max_results=n,        # số kết quả tối đa
        backend="duckduckgo", # chỉ định backend
    )
    urls = [r["image"] for r in results[:n]]
    return urls

if __name__ == "__main__":
    search_string = input("Nhập chuỗi tìm kiếm ảnh: ")
    urls = fetch_first_image_urls(search_string, n=3)
    print("3 URL ảnh đầu tiên:")
    pprint.pprint(urls)