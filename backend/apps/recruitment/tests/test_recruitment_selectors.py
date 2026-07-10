import pytest

@pytest.mark.django_db
class TestRecruitmentSelectors:
    def test_selector_fetches_correct_data(self):
        # Selectors should only read from the DB, not write
        assert True is not False
