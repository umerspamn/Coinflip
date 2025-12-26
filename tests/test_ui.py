
import os
from playwright.sync_api import sync_playwright, expect

def test_start_screen(page):
    # Capture console logs and errors
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

    # Load the page
    page.goto("http://localhost:8000")

    # Check title
    expect(page).to_have_title("Coin Flip Dare")

    # Check start card visibility
    start_card = page.locator(".start-card")
    expect(start_card).to_be_visible()

    # Check title text
    title = page.locator(".start-title")
    expect(title).to_have_text("Coin Flip Dare")

    # Enter name
    name_input = page.locator("#inpName")
    expect(name_input).to_be_visible()
    name_input.fill("Tester")

    # Check Enter button
    enter_btn = page.locator("#btnEnter")
    expect(enter_btn).to_be_visible()
    expect(enter_btn).to_have_text("ENTER ROOM")

    # Check for error toasts (wait a bit to ensure they would appear)
    page.wait_for_timeout(1000)
    error_toast = page.locator(".toast.error")
    if error_toast.count() > 0:
        print(f"Error toast found: {error_toast.first.inner_text()}")
    expect(error_toast).to_have_count(0)

    # Take screenshot of start screen
    if not os.path.exists("tests/screenshots"):
        os.makedirs("tests/screenshots")
    page.screenshot(path="tests/screenshots/start_screen.png")

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_start_screen(page)
            print("Start screen test passed!")
        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run_tests()
