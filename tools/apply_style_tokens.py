from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src"

STYLE_BLOCK_PATTERN = re.compile(r"(<style\b[^>]*>)(.*?)(</style>)", re.IGNORECASE | re.DOTALL)

SIMPLE_REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"font-size\s*:\s*12px", re.IGNORECASE), "font-size: var(--font-size-xs)"),
    (re.compile(r"font-size\s*:\s*13px", re.IGNORECASE), "font-size: var(--font-size-sm)"),
    (re.compile(r"font-size\s*:\s*14px", re.IGNORECASE), "font-size: var(--font-size-md)"),
    (re.compile(r"font-size\s*:\s*15px", re.IGNORECASE), "font-size: var(--font-size-md-plus)"),
    (re.compile(r"font-size\s*:\s*16px", re.IGNORECASE), "font-size: var(--font-size-lg)"),
    (re.compile(r"font-size\s*:\s*18px", re.IGNORECASE), "font-size: var(--font-size-xl)"),
    (re.compile(r"font-size\s*:\s*20px", re.IGNORECASE), "font-size: var(--font-size-xxl)"),
    (re.compile(r"font-size\s*:\s*24px", re.IGNORECASE), "font-size: var(--font-size-display)"),
    (re.compile(r"border-radius\s*:\s*4px", re.IGNORECASE), "border-radius: var(--border-radius-sm)"),
    (re.compile(r"border-radius\s*:\s*8px", re.IGNORECASE), "border-radius: var(--border-radius-md)"),
    (re.compile(r"border-radius\s*:\s*12px", re.IGNORECASE), "border-radius: var(--border-radius-lg)"),
]

COLOR_MAP = {
    "#409eff": "var(--primary-color)",
    "#3b82f6": "var(--primary-color)",
    "#337ecc": "var(--primary-color-hover)",
    "#2563eb": "var(--primary-color-dark)",
    "#ffffff": "var(--background-color)",
    "#fff": "var(--background-color)",
    "#f9fafb": "var(--background-color-light)",
    "#f8f9fa": "var(--background-color-light)",
    "#f5f7fa": "var(--background-color-muted)",
    "#fff2f2": "var(--status-danger-bg)",
    "#f3f4f6": "var(--border-color-light)",
    "#ebeef5": "var(--border-color-muted)",
    "#e5e7eb": "var(--border-color)",
    "#dcdfe6": "var(--border-color-soft)",
    "#333": "var(--text-color-heading)",
    "#303133": "var(--text-color-heading)",
    "#1f2937": "var(--text-color-primary)",
    "#374151": "var(--text-color-primary)",
    "#606266": "var(--text-color-regular)",
    "#666": "var(--text-color-secondary)",
    "#6b7280": "var(--text-color-secondary)",
    "#909399": "var(--text-color-placeholder)",
    "#999": "var(--text-color-placeholder)",
    "#f56c6c": "var(--status-danger)",
    "#fbc4c4": "var(--status-danger-border)",
    "#67c23a": "var(--status-success)",
    "#d1fae5": "var(--status-success-bg)",
    "#a7f3d0": "var(--status-success-border)",
    "#e6a23c": "var(--status-warning)",
    "#fef3c7": "var(--status-warning-bg)",
    "#fde68a": "var(--status-warning-border)",
}

HEX_PATTERN = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})")

RGBA_PRIMARY_PATTERN = re.compile(
    r"rgba\(\s*64\s*,\s*158\s*,\s*255\s*,\s*(0?\.\d+|1)\s*\)",
    re.IGNORECASE,
)

BORDER_DECL_PATTERN = re.compile(
    r"(border(?:-(?:top|right|bottom|left))?)\s*:\s*1px(\s+[^;]*;)",
    re.IGNORECASE,
)

BORDER_WIDTH_PATTERN = re.compile(r"border-width\s*:\s*1px", re.IGNORECASE)


def replace_simple_tokens(css: str) -> tuple[str, bool]:
    changed = False
    updated = css

    for pattern, replacement in SIMPLE_REPLACEMENTS:
        updated, count = pattern.subn(replacement, updated)
        if count:
            changed = True

    def _replace_hex(match: re.Match[str]) -> str:
        nonlocal changed
        hex_value = match.group(0)
        replacement = COLOR_MAP.get(hex_value.lower())
        if replacement:
            changed = True
            return replacement
        return hex_value

    updated = HEX_PATTERN.sub(_replace_hex, updated)

    def _replace_rgba(match: re.Match[str]) -> str:
        nonlocal changed
        changed = True
        alpha = match.group(1)
        return f"rgba(var(--primary-color-rgb), {alpha})"

    updated = RGBA_PRIMARY_PATTERN.sub(_replace_rgba, updated)

    def _replace_border(match: re.Match[str]) -> str:
        nonlocal changed
        prop = match.group(1)
        suffix = match.group(2)
        changed = True
        return f"{prop}: var(--border-width-thin){suffix}" if suffix else f"{prop}: var(--border-width-thin);"

    updated = BORDER_DECL_PATTERN.sub(_replace_border, updated)

    updated, count = BORDER_WIDTH_PATTERN.subn("border-width: var(--border-width-thin)", updated)
    if count:
        changed = True

    return updated, changed


def transform_vue_file(path: Path) -> bool:
    content = path.read_text(encoding="utf-8")
    changed = False

    def _replace(match: re.Match[str]) -> str:
        nonlocal changed
        start, block, end = match.groups()
        transformed, block_changed = replace_simple_tokens(block)
        if block_changed:
            changed = True
        return f"{start}{transformed}{end}"

    updated = STYLE_BLOCK_PATTERN.sub(_replace, content)

    if changed:
        path.write_text(updated, encoding="utf-8")
    return changed


def transform_css_file(path: Path) -> bool:
    content = path.read_text(encoding="utf-8")
    updated, changed = replace_simple_tokens(content)
    if changed:
        path.write_text(updated, encoding="utf-8")
    return changed


def main() -> None:
    changed_files: set[Path] = set()

    for file_path in SRC_DIR.rglob("*.vue"):
        if transform_vue_file(file_path):
            changed_files.add(file_path)

    styles_dir = ROOT / "src" / "styles"
    for file_path in styles_dir.rglob("*.css"):
        if file_path.name == "variables.css":
            continue
        if transform_css_file(file_path):
            changed_files.add(file_path)

    if changed_files:
        print("Updated style tokens in the following files:")
        for path in sorted(changed_files):
            print(path.relative_to(ROOT))
    else:
        print("No changes were necessary.")


if __name__ == "__main__":
    main()
