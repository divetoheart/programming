from __future__ import annotations

import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ENTRY = ROOT / 'src' / 'main.js'
IMPORT_RE = re.compile(r"(?P<prefix>\bfrom\s*|\bimport\s*)(?P<quote>['\"])(?P<path>\.{1,2}/[^'\"]+)(?P=quote)")


def dependencies(path: Path) -> list[Path]:
    code = path.read_text()
    result = []
    for match in IMPORT_RE.finditer(code):
        target = (path.parent / match.group('path')).resolve()
        if target.suffix == '':
            target = target.with_suffix('.js')
        result.append(target)
    return result


def topological(entry: Path) -> list[Path]:
    ordered: list[Path] = []
    visiting: set[Path] = set()
    visited: set[Path] = set()

    def visit(path: Path) -> None:
        if path in visited:
            return
        if path in visiting:
            raise RuntimeError(f'Circular module dependency involving {path}')
        visiting.add(path)
        for dependency in dependencies(path):
            visit(dependency)
        visiting.remove(path)
        visited.add(path)
        ordered.append(path)

    visit(entry)
    return ordered


def rewritten(path: Path, urls: dict[Path, str]) -> str:
    code = path.read_text()

    def replace(match: re.Match[str]) -> str:
        target = (path.parent / match.group('path')).resolve()
        if target.suffix == '':
            target = target.with_suffix('.js')
        return f"{match.group('prefix')}{match.group('quote')}{urls[target]}{match.group('quote')}"

    return IMPORT_RE.sub(replace, code)


def main() -> None:
    css = '\n'.join(path.read_text() for path in [
        ROOT / 'styles' / 'tokens.css', ROOT / 'styles' / 'base.css', ROOT / 'styles' / 'game.css',
        ROOT / 'styles' / 'components.css', ROOT / 'styles' / 'responsive.css'
    ])
    modules = topological(ENTRY)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path='/usr/bin/chromium',
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        page = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        errors: list[str] = []
        page.on('console', lambda message: errors.append(f'console:{message.type}:{message.text}') if message.type == 'error' else None)
        page.on('pageerror', lambda error: errors.append(f'pageerror:{error}'))
        page.set_content(f'<!doctype html><html><head><style>{css}</style></head><body><div id="app"></div></body></html>')
        page.evaluate("""
          Object.defineProperty(window, 'localStorage', { value: (() => {
            const store = new Map();
            return { getItem: key => store.has(key) ? store.get(key) : null, setItem: (key, value) => store.set(key, String(value)), removeItem: key => store.delete(key), clear: () => store.clear() };
          })() });
          if (!navigator.clipboard) Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} } });
        """)
        urls: dict[Path, str] = {}
        for module in modules:
            code = rewritten(module, urls)
            url = page.evaluate("code => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))", code)
            urls[module] = url
        page.evaluate("url => import(url)", urls[ENTRY])
        page.wait_for_selector('[data-setup-form]')
        assert page.locator('[data-setup-form]').count() == 1
        page.screenshot(path=str(ROOT / 'tests' / 'setup-mobile.png'), full_page=True)
        page.locator('[data-setup-form]').evaluate('(form) => form.requestSubmit()')
        page.wait_for_selector('[data-game-shell]')
        page.wait_for_timeout(300)
        assert page.locator('[data-region-id]').count() == 20
        assert page.locator('[data-slot-id]').count() == 60
        assert page.locator('[data-game-dock] button').count() == 5
        assert page.locator('[data-bottom-sheet]').count() == 1
        page.screenshot(path=str(ROOT / 'tests' / 'game-mobile.png'), full_page=True)
        assert page.locator('[data-army-id]').count() >= 4
        assert page.locator('[data-command="show-moves"]').count() == 1
        if errors:
            raise AssertionError('\n'.join(errors))
        print(json.dumps({
            'setup': 'pass', 'game': 'pass', 'regions': 20, 'slots': 60,
            'viewport': '390x844', 'console_errors': 0
        }))
        browser.close()


if __name__ == '__main__':
    main()
