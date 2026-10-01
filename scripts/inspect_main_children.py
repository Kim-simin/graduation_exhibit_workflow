import asyncio
from playwright.async_api import async_playwright

async def inspect_main_children():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1200, "height": 900})
        await page.goto("https://swuid2025.com/project/1", wait_until="networkidle")
        
        children = await page.evaluate("""() => {
            const main = document.querySelector('main');
            if (!main) return [];
            return Array.from(main.children).map(c => ({
                tag: c.tagName,
                className: c.className,
                rect: c.getBoundingClientRect()
            }));
        }""")
        
        print("Children of main:")
        for c in children:
            print(c)
            
        await browser.close()

if __name__ == '__main__':
    asyncio.run(inspect_main_children())
