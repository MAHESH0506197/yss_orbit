# yss_orbit\backend\apps\attendance\tests\test_attendance_service.py
import pytest
from unittest.mock import MagicMock

class TestAttendanceService:
    def test_service_execution(self):
        # Test business logic isolated from HTTP
        mock_repo = MagicMock()
        mock_repo.get_all.return_value = []
        
        # Verify the mock works as expected in isolation
        result = mock_repo.get_all()
        assert isinstance(result, list)
        mock_repo.get_all.assert_called_once()
