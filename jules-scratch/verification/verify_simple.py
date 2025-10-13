from playwright.sync_api import Page, expect

def test_login_page_loads(page: Page):
    """
    This test verifies that the login page loads correctly.
    """
    # 1. Arrange: Go to the login page.
    page.goto("http://localhost:3001/login")

    # 2. Assert: Check for the main heading.
    expect(page.get_by_role("heading", name="Sign in to your account")).to_be_visible()

    # 3. Screenshot: Capture the page for visual verification.
    page.screenshot(path="jules-scratch/verification/login-page.png")
