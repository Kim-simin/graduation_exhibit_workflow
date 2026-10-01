import asyncio
from playwright.async_api import async_playwright

async def inspect_bg_white_children():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1200, "height": 900})
        await page.goto("https://swuid2025.com/project/1", wait_until="networkidle")
        
        children = await page.evaluate("""() => {
            const container = document.querySelector('main > div.bg-white');
            if (!container) return [];
            return Array.from(container.children).map(c => ({
                tag: c.tagName,
                className: c.className,
                text: c.innerText ? c.innerText.substring(0, 60) : '',
                rect: c.getBoundingClientRect()
            }));
        }""")
        
        print("Children of main > div.bg-white:")
        for c in children:
            print(c)
            
        await browser.close()

if __name__ == '__main__':
    asyncio.run(inspect_bg_white_children())
