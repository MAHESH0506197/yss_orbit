# yss_orbit\backend\apps\recruitment\api\views\recruitment_views.py
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from apps.platform.core_response import success_response, created_response, no_content_response
from apps.platform.core_pagination import StandardResultsPagination
from apps.platform.core_exceptions import MissingBusinessUnitHeaderError
from apps.platform.core_permissions import IsAuthenticated, IsTenantMember
from apps.recruitment.services.recruitment_service import RecruitmentService
from apps.recruitment.api.serializers.recruitment_serializer import (
    JobPostingSerializer, JobApplicationSerializer, AppraisalSerializer, InterviewStageSerializer, InterviewSerializer
)

class BaseRecruitmentView(APIView):
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get_bu_id(self, request: Request) -> str:
        bu_id = getattr(request, "business_unit_id", None)
        if not bu_id:
            raise MissingBusinessUnitHeaderError()
        return str(bu_id)

    def get_ctx(self, request: Request):
        return getattr(request, "security_context", None)


class JobPostingListView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()
        self.pagination_class = StandardResultsPagination

    def get(self, request: Request) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        qs = self.service.list_job_postings(ctx, bu_id)
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = JobPostingSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
            
        serializer = JobPostingSerializer(qs, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        serializer = JobPostingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        posting = self.service.create_job_posting(ctx, bu_id, serializer.validated_data)
        return created_response(data=JobPostingSerializer(posting).data, request=request)


class JobPostingDetailView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()

    def get(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        posting = self.service.get_job_posting(ctx, bu_id, pk)
        return success_response(data=JobPostingSerializer(posting).data, request=request)

    def put(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        serializer = JobPostingSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        posting = self.service.update_job_posting(ctx, bu_id, pk, serializer.validated_data)
        return success_response(data=JobPostingSerializer(posting).data, request=request)

    def delete(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        self.service.delete_job_posting(ctx, bu_id, pk)
        return no_content_response(request=request)


class JobApplicationListView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()
        self.pagination_class = StandardResultsPagination

    def get(self, request: Request) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        qs = self.service.list_job_applications(ctx, bu_id)
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = JobApplicationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
            
        serializer = JobApplicationSerializer(qs, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        serializer = JobApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        app = self.service.create_job_application(ctx, bu_id, serializer.validated_data)
        return created_response(data=JobApplicationSerializer(app).data, request=request)


class JobApplicationDetailView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()

    def get(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        app = self.service.get_job_application(ctx, bu_id, pk)
        return success_response(data=JobApplicationSerializer(app).data, request=request)

    def put(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        serializer = JobApplicationSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        app = self.service.update_job_application(ctx, bu_id, pk, serializer.validated_data)
        return success_response(data=JobApplicationSerializer(app).data, request=request)


class JobApplicationAdvanceView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()

    def post(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        app = self.service.advance_application_stage(ctx, bu_id, pk)
        return success_response(data=JobApplicationSerializer(app).data, request=request)


class AppraisalListView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()
        self.pagination_class = StandardResultsPagination

    def get(self, request: Request) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        qs = self.service.list_appraisals(ctx, bu_id)
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = AppraisalSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
            
        serializer = AppraisalSerializer(qs, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        serializer = AppraisalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appraisal = self.service.create_appraisal(ctx, bu_id, serializer.validated_data)
        return created_response(data=AppraisalSerializer(appraisal).data, request=request)


class AppraisalDetailView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()

    def get(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        appraisal = self.service.get_appraisal(ctx, bu_id, pk)
        return success_response(data=AppraisalSerializer(appraisal).data, request=request)

    def put(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        serializer = AppraisalSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        appraisal = self.service.update_appraisal(ctx, bu_id, pk, serializer.validated_data)
        return success_response(data=AppraisalSerializer(appraisal).data, request=request)


class AppraisalSubmitView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()

    def post(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        appraisal = self.service.submit_appraisal(ctx, bu_id, pk)
        return success_response(data=AppraisalSerializer(appraisal).data, request=request)
class InterviewStageListView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()

    def get(self, request: Request) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        qs = self.service.list_interview_stages(ctx, bu_id)
        return success_response(data=InterviewStageSerializer(qs, many=True).data, request=request)

    def post(self, request: Request) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        serializer = InterviewStageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stage = self.service.create_interview_stage(ctx, bu_id, serializer.validated_data)
        return created_response(data=InterviewStageSerializer(stage).data, request=request)

class InterviewStageDetailView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()

    def get(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        stage = self.service.get_interview_stage(ctx, bu_id, pk)
        return success_response(data=InterviewStageSerializer(stage).data, request=request)


class InterviewListView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()
        self.pagination_class = StandardResultsPagination

    def get(self, request: Request) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        qs = self.service.list_interviews(ctx, bu_id)
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            serializer = InterviewSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
            
        serializer = InterviewSerializer(qs, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        serializer = InterviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        interview = self.service.create_interview(ctx, bu_id, serializer.validated_data)
        return created_response(data=InterviewSerializer(interview).data, request=request)


class InterviewDetailView(BaseRecruitmentView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = RecruitmentService()

    def get(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        interview = self.service.get_interview(ctx, bu_id, pk)
        return success_response(data=InterviewSerializer(interview).data, request=request)

    def put(self, request: Request, pk: str) -> Response:
        ctx = self.get_ctx(request)
        bu_id = self.get_bu_id(request)
        serializer = InterviewSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        interview = self.service.update_interview(ctx, bu_id, pk, serializer.validated_data)
        return success_response(data=InterviewSerializer(interview).data, request=request)

