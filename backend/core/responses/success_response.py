from rest_framework import status
from rest_framework.response import Response
from .api_response import StandardAPIResponse
from .response_codes import ResponseCode


class SuccessResponse(StandardAPIResponse):
    """
    Standard success response (HTTP 200).
    """
    def __init__(
        self,
        data=None,
        message="Operation completed successfully.",
        code=ResponseCode.SUCCESS,
        status_code=status.HTTP_200_OK,
        meta=None,
        headers=None,
        **kwargs
    ):
        super().__init__(
            success=True,
            status_code=status_code,
            code=code,
            message=message,
            data=data,
            meta=meta,
            headers=headers,
            **kwargs
        )


class CreatedResponse(SuccessResponse):
    """
    Standard created response (HTTP 201).
    """
    def __init__(
        self, 
        data=None, 
        message="Resource created successfully.", 
        meta=None, 
        headers=None,
        **kwargs
    ):
        super().__init__(
            data=data,
            message=message,
            code=ResponseCode.CREATED,
            status_code=status.HTTP_201_CREATED,
            meta=meta,
            headers=headers,
            **kwargs
        )


class NoContentResponse(Response):
    """
    Standard no content response (HTTP 204).
    """
    def __init__(self, message="No content.", headers=None, **kwargs):
        # HTTP 204 must NOT contain a response body.
        # We inherit directly from rest_framework.response.Response to bypass StandardAPIResponse formatting.
        super().__init__(
            status=status.HTTP_204_NO_CONTENT,
            data=None,
            headers=headers,
            **kwargs
        )
