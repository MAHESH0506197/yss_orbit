# yss_orbit\backend\core\testing\assertion_helpers.py
"""
Common test assertions.
"""
def assert_api_success(response, expected_status: int = 200):
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}. Content: {response.content}"
    assert response.data["success"] is True

def assert_api_error(response, expected_status: int = 400, expected_code: str = None):
    assert response.status_code == expected_status
    assert response.data["success"] is False
    if expected_code:
        assert response.data["error"]["code"] == expected_code
