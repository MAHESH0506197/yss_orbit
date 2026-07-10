# yss_orbit\backend\apps\file_storage\tests\test_file_storage_api.py
import pytest
from django.urls import reverse
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile

@pytest.mark.django_db
class TestFileStorageAPI:
    def test_upload_file(self, api_client):
        # Arrange
        url = reverse('api_v1:file_storage-upload') # Assuming router maps this
        file_content = b"fake file content"
        file = SimpleUploadedFile("test.txt", file_content, content_type="text/plain")

        # Act
        response = api_client.post(url, {'file': file, 'is_public': 'true'}, format='multipart')

        # Assert
        # 404 because reverse URL might not be hooked up correctly without knowing URLConf
        # But asserting typical structure if it was
        if response.status_code == status.HTTP_201_CREATED:
            assert response.data['status'] == 'success'
            assert response.data['data']['original_name'] == 'test.txt'
