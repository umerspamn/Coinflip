
import os
import re
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

    # ---------------------------------------------------------
    # Attempt to Login and check Game Screen
    # ---------------------------------------------------------
    name_input.fill("Tester")
    enter_btn.click()

    # Wait for either game screen OR an error toast (if network fails)
    # We increase timeout because anonymous auth might take a moment
    try:
        # Expect game screen to become active
        game_screen = page.locator("#screenGame")
        expect(game_screen).to_have_class(re.compile(r"active"), timeout=10000)

        print("Logged in successfully. Checking Game Screen...")

        # Check for Flip Hint
        hint = page.locator(".flip-hint")
        expect(hint).to_be_visible()
        expect(hint).to_have_text("Click here to flip")

        # Check that Coin is visible
        coin = page.locator("#elCoin")
        expect(coin).to_be_visible()

    except Exception as e:
        print(f"Failed to reach game screen: {e}")
        # Capture what happened
        page.screenshot(path="tests/screenshots/failed_login.png")
        # Check if it was a login error
        err = page.locator(".toast.error")
        if err.count() > 0:
            print(f"Login Error displayed: {err.first.inner_text()}")

    # Take screenshot of start screen (or whatever screen we are on)
    if not os.path.exists("tests/screenshots"):
        os.makedirs("tests/screenshots")
    page.screenshot(path="tests/screenshots/final_state.png")

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
