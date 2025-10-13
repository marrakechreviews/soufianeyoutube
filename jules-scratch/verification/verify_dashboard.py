import re
from playwright.sync_api import Page, expect

def test_dashboard_initial_state(page: Page):
    """
    This test verifies that a new user sees the correct initial
    state on the dashboard before connecting a YouTube account.
    """
    # 1. Arrange: Go to the registration page.
    page.goto("http://localhost:3001/register")

    # 2. Act: Register a new user.
    # Using unique details to avoid conflicts on re-runs.
    page.get_by_placeholder("Name").fill("Test User")
    page.get_by_placeholder("Email address").fill("test.user@example.com")
    page.get_by_placeholder("Password").fill("password123")
    page.get_by_role("button", name="Sign up").click()

    # 3. Assert: Confirm navigation to the dashboard and see the correct message.
    # The page should redirect to the dashboard after registration.
    expect(page).to_have_url(re.compile(r".*/dashboard"))

    # Check for the main heading.
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible()

    # Check for the message indicating no channels are connected.
    expect(page.get_by_text("No YouTube channels found.")).to_be_visible()

    # 4. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/dashboard-initial-state.png")
