import asyncio
from playwright.async_api import async_playwright

async def inspect_page_structure():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1200, "height": 900})
        await page.goto("https://swuid2025.com/project/1", wait_until="networkidle")
        
        # Check main container or elements
        elements = await page.evaluate("""() => {
            const res = [];
            document.querySelectorAll('main, section, div').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.height > 2000 && rect.width > 500) {
                    res.push({
                        tag: el.tagName,
                        className: el.className,
                        id: el.id,
                        width: rect.width,
                        height: rect.height,
                        top: rect.top + window.scrollY
                    });
                }
            });
            return res;
        }""")
        
        print("Large elements found:")
        for el in elements:
            print(el)
            
        await browser.close()

if __name__ == '__main__':
    asyncio.run(inspect_page_structure())
