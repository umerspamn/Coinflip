
import os
import re
import time
from playwright.sync_api import sync_playwright, expect

def test_dare_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # --- Setup Players ---
        context_a = browser.new_context()
        page_a = context_a.new_page()
        page_a.goto("http://localhost:8000")
        page_a.fill("#inpName", "Winner")
        page_a.click("#btnEnter")
        expect(page_a.locator("#screenGame")).to_have_class(re.compile(r"active"))
        room_code = page_a.locator("#dispCode").inner_text()

        context_b = browser.new_context()
        page_b = context_b.new_page()
        page_b.goto(f"http://localhost:8000/?room={room_code}")
        page_b.fill("#inpName", "Loser")
        page_b.click("#btnEnter")
        expect(page_b.locator("#screenGame")).to_have_class(re.compile(r"active"))

        # --- Loop until Player A wins a round ---
        max_attempts = 10
        winner_found = False

        for i in range(max_attempts):
            print(f"Round {i+1}...")
            # Determine whose turn it is
            turn_txt = page_a.locator("#dispTurn").inner_text()
            is_a_turn = "YOUR TURN" in turn_txt

            flipper_page = page_a if is_a_turn else page_b
            other_page = page_b if is_a_turn else page_a

            # Flipper predicts HEADS
            flipper_page.click("#btnPredH")

            # Flip
            flipper_page.locator(".coin-scene").click()
            time.sleep(4)

            result = flipper_page.locator("#dispResult").inner_text()
            print(f"Result: {result}")

            if result == "HEADS":
                # Flipper WON
                print("Flipper WON!")
                # Check if input is enabled
                expect(flipper_page.locator("#inpDare")).to_be_enabled()

                # Send Dare
                dare_text = "Do 10 jumping jacks"
                flipper_page.fill("#inpDare", dare_text)
                flipper_page.click("#btnSendDare")

                # Verify Overlay on BOTH
                time.sleep(1)
                expect(page_a.locator("#overlayDare")).to_have_class(re.compile(r"visible"))
                expect(page_b.locator("#overlayDare")).to_have_class(re.compile(r"visible"))

                # Verify Button Visibility
                # Flipper (Winner) should SEE button
                expect(flipper_page.locator("#btnDoneDare")).to_be_visible()

                # Other (Loser) should NOT SEE button
                expect(other_page.locator("#btnDoneDare")).not_to_be_visible()

                print("Dare button visibility verified!")
                winner_found = True
                break
            else:
                # Flipper LOST
                print("Flipper LOST. Trying next round...")
                # If lost, no dare can be sent. Next turn.

        if not winner_found:
            print("Could not verify dare flow (random chance failure).")

        browser.close()

if __name__ == "__main__":
    test_dare_flow()
