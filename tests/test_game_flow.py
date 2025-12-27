
import os
import re
import time
from playwright.sync_api import sync_playwright, expect

def test_game_flow():
    with sync_playwright() as p:
        # Launch Browser
        browser = p.chromium.launch(headless=True)

        # --- Player A ---
        context_a = browser.new_context()
        page_a = context_a.new_page()
        # Capture logs
        page_a.on("console", lambda msg: print(f"A-CONSOLE: {msg.text}"))
        page_a.on("pageerror", lambda exc: print(f"A-ERROR: {exc}"))

        page_a.goto("http://localhost:8000")

        # Login A
        page_a.fill("#inpName", "Player A")
        page_a.click("#btnEnter")
        expect(page_a.locator("#screenGame")).to_have_class(re.compile(r"active"), timeout=10000)

        # Get Room Code
        code_el = page_a.locator("#dispCode")
        room_code = code_el.inner_text()
        print(f"Room Code: {room_code}")

        # --- Player B ---
        context_b = browser.new_context()
        page_b = context_b.new_page()
        # Capture logs
        page_b.on("console", lambda msg: print(f"B-CONSOLE: {msg.text}"))
        page_b.on("pageerror", lambda exc: print(f"B-ERROR: {exc}"))

        page_b.goto(f"http://localhost:8000/?room={room_code}")

        # Login B
        page_b.fill("#inpName", "Player B")
        page_b.click("#btnEnter")
        expect(page_b.locator("#screenGame")).to_have_class(re.compile(r"active"), timeout=10000)

        # Check Players List
        expect(page_a.locator("#dispCount")).to_have_text("2")
        expect(page_b.locator("#dispCount")).to_have_text("2")

        # --- Round 1: Player A's Turn ---
        print("Checking turn 1...")
        # A should see "IT'S YOUR TURN!"
        expect(page_a.locator("#dispTurn")).to_contain_text("YOUR TURN")
        # B should see "Waiting for Player A"
        expect(page_b.locator("#dispTurn")).to_contain_text("Waiting for Player A")

        # A Predicts
        page_a.click("#btnPredH")

        # A Flips (using the coin click)
        print("Player A flipping...")
        page_a.locator(".coin-scene").click()

        # Verify Coin Spins (transform changes)
        # We can't easily check animation, but we can check status text or wait for result
        # Result takes 3s to appear
        time.sleep(4)

        # Verify Result
        res_a = page_a.locator("#dispResult").inner_text()
        res_b = page_b.locator("#dispResult").inner_text()
        print(f"Result A: {res_a}, Result B: {res_b}")
        assert res_a in ["HEADS", "TAILS"]
        assert res_a == res_b

        # --- Round 2: Player B's Turn ---
        print("Checking turn 2...")
        # Turn should pass to B
        expect(page_b.locator("#dispTurn")).to_contain_text("YOUR TURN")
        expect(page_a.locator("#dispTurn")).to_contain_text("Waiting for Player B")

        # B Predicts
        page_b.click("#btnPredT")

        # B Flips
        print("Player B flipping...")
        btn_flip_b = page_b.locator("#btnFlip")
        expect(btn_flip_b).to_be_enabled()
        btn_flip_b.click()

        time.sleep(4)

        res_a_2 = page_a.locator("#dispResult").inner_text()
        print(f"Result Round 2: {res_a_2}")

        # --- Test Reset ---
        print("Testing Reset...")
        page_a.on("dialog", lambda dialog: dialog.accept())
        page_a.click("#btnReset")
        time.sleep(1)

        # Verify Reset State
        # Count should be 0
        # Result should be WAITING...
        expect(page_a.locator("#dispResult")).to_have_text("WAITING...")
        expect(page_b.locator("#dispResult")).to_have_text("WAITING...")

        # Success if we got here
        print("Game flow test passed!")

        browser.close()

if __name__ == "__main__":
    test_game_flow()
