import asyncio
from playwright.async_api import async_playwright

async def test_p6():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1200, "height": 900})
        print("Navigating to project 6 with domcontentloaded...")
        try:
            await page.goto("https://swuid2025.com/project/6", wait_until="domcontentloaded", timeout=15000)
            print("Loaded DOM!")
            await page.wait_for_timeout(2000)
            title = await page.title()
            print("Title:", title)
        except Exception as e:
            print("Error:", e)
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(test_p6())
