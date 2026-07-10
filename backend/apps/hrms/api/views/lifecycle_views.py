"""
YSS Orbit — HRMS Lifecycle API Views

Endpoints for: Onboarding, Transfer, Promotion, Exit, Asset, Training.
All views follow the existing HRMS pattern:
  - IsAuthenticated permission
  - _require_bu() for BU scoping
  - success_response / error_response helpers
  - Service layer delegation (no business logic in views)

URL prefix: /api/v1/hrms/
"""
from __future__ import annotations

import uuid
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, created_response, error_response
from apps.hrms.api.views.utils import _require_bu
from apps.hrms.services import (
    OnboardingService, OnboardingError,
    TransferService, TransferError,
    PromotionService, PromotionError,
    ConfirmationService, SalaryRevisionService,
    ExitWorkflowService, ExitWorkflowError,
    AssetService, AssetError,
    TrainingService, TrainingError,
)


# ─── Onboarding ────────────────────────────────────────────────────────────────

class OnboardingInitView(APIView):
    """
    POST /hrms/employees/{emp_pk}/onboarding/init/
    Initialize onboarding for an employee from a template.
    Body: { template_id, start_date? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        template_id = request.data.get("template_id")
        if not template_id:
            return error_response("VALIDATION_ERROR", "template_id is required.", http_status=400, request=request)

        try:
            onboarding = OnboardingService.initialize(
                bu_id=bu_id,
                employee_id=emp_pk,
                template_id=uuid.UUID(str(template_id)),
                initiated_by_id=request.user.id,
            )
        except OnboardingError as e:
            return error_response("ONBOARDING_ERROR", str(e), http_status=400, request=request)

        return created_response(
            data={"onboarding_id": str(onboarding.id), "status": onboarding.status},
            request=request,
        )


class OnboardingProgressView(APIView):
    """
    GET /hrms/employees/{emp_pk}/onboarding/progress/
    Returns onboarding progress summary and task list.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        progress = OnboardingService.get_onboarding_progress(bu_id=bu_id, employee_id=emp_pk)
        return success_response(data=progress, request=request)


class OnboardingTaskCompleteView(APIView):
    """
    POST /hrms/onboarding/{onboarding_id}/tasks/{task_id}/complete/
    Mark a specific onboarding task as completed.
    Body: { notes? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, onboarding_id: uuid.UUID, task_id: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            tc = OnboardingService.complete_task(
                bu_id=bu_id,
                onboarding_id=onboarding_id,
                task_completion_id=task_id,
                completed_by_id=request.user.id,
                notes=request.data.get("notes", ""),
            )
        except OnboardingError as e:
            return error_response("ONBOARDING_ERROR", str(e), http_status=400, request=request)

        return success_response(
            data={"task_id": str(tc.id), "status": tc.status},
            request=request,
        )


# ─── Transfer ──────────────────────────────────────────────────────────────────

class TransferListCreateView(APIView):
    """
    GET  /hrms/employees/{emp_pk}/transfers/   — list employee's transfers
    POST /hrms/employees/{emp_pk}/transfers/   — initiate new transfer
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        from apps.hrms.models.lifecycle import EmployeeTransfer
        transfers = EmployeeTransfer.objects.filter(
            business_unit_id=bu_id, employee_id=emp_pk
        ).order_by("-effective_date").values(
            "id", "from_department_id", "to_department_id",
            "from_designation_id", "to_designation_id",
            "to_location", "effective_date", "status", "reason",
        )
        return success_response(data=list(transfers), request=request)

    def post(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        d = request.data
        required = ["to_department_id", "effective_date", "reason"]
        missing = [f for f in required if not d.get(f)]
        if missing:
            return error_response("VALIDATION_ERROR", f"Missing: {', '.join(missing)}", http_status=400, request=request)

        try:
            from datetime import date
            transfer = TransferService.initiate(
                bu_id=bu_id,
                employee_id=emp_pk,
                to_department_id=uuid.UUID(str(d["to_department_id"])),
                to_designation_id=uuid.UUID(str(d["to_designation_id"])) if d.get("to_designation_id") else None,
                to_manager_id=uuid.UUID(str(d["to_manager_id"])) if d.get("to_manager_id") else None,
                to_location=d.get("to_location", ""),
                effective_date=date.fromisoformat(d["effective_date"]),
                reason=d["reason"],
                initiated_by_id=request.user.id,
            )
        except TransferError as e:
            return error_response("TRANSFER_ERROR", str(e), http_status=400, request=request)

        return created_response(
            data={"transfer_id": str(transfer.id), "status": transfer.status},
            request=request,
        )


class TransferApproveView(APIView):
    """
    POST /hrms/transfers/{transfer_id}/approve/
    Body: { remarks? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, transfer_id: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            transfer = TransferService.approve(
                bu_id=bu_id,
                transfer_id=transfer_id,
                approved_by_id=request.user.id,
                remarks=request.data.get("remarks", ""),
            )
        except TransferError as e:
            return error_response("TRANSFER_ERROR", str(e), http_status=400, request=request)

        return success_response(data={"status": transfer.status}, request=request)


# ─── Promotion ─────────────────────────────────────────────────────────────────

class PromotionListCreateView(APIView):
    """
    GET  /hrms/employees/{emp_pk}/promotions/
    POST /hrms/employees/{emp_pk}/promotions/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        from apps.hrms.models.lifecycle import EmployeePromotion
        promos = EmployeePromotion.objects.filter(
            business_unit_id=bu_id, employee_id=emp_pk
        ).order_by("-effective_date").values(
            "id", "from_designation_id", "to_designation_id",
            "increment_percentage", "new_ctc", "effective_date", "status", "reason",
        )
        return success_response(data=list(promos), request=request)

    def post(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        d = request.data
        required = ["to_designation_id", "effective_date", "increment_percentage", "new_ctc", "reason"]
        missing = [f for f in required if d.get(f) is None]
        if missing:
            return error_response("VALIDATION_ERROR", f"Missing: {', '.join(missing)}", http_status=400, request=request)

        try:
            from decimal import Decimal
            from datetime import date
            promotion = PromotionService.initiate(
                bu_id=bu_id,
                employee_id=emp_pk,
                to_designation_id=uuid.UUID(str(d["to_designation_id"])),
                effective_date=date.fromisoformat(d["effective_date"]),
                increment_percentage=Decimal(str(d["increment_percentage"])),
                new_ctc=Decimal(str(d["new_ctc"])),
                reason=d["reason"],
                recommended_by_id=request.user.id,
            )
        except PromotionError as e:
            return error_response("PROMOTION_ERROR", str(e), http_status=400, request=request)

        return created_response(
            data={"promotion_id": str(promotion.id), "status": promotion.status},
            request=request,
        )


class PromotionApproveView(APIView):
    """POST /hrms/promotions/{promotion_id}/approve/"""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, promotion_id: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            promotion = PromotionService.approve(
                bu_id=bu_id,
                promotion_id=promotion_id,
                approved_by_id=request.user.id,
                remarks=request.data.get("remarks", ""),
            )
        except PromotionError as e:
            return error_response("PROMOTION_ERROR", str(e), http_status=400, request=request)

        return success_response(data={"status": promotion.status}, request=request)


# ─── Exit Workflow ─────────────────────────────────────────────────────────────

class ExitSubmitView(APIView):
    """
    POST /hrms/employees/{emp_pk}/exit/submit/
    Employee submits resignation via ESS.
    Body: { resignation_date, reason, notice_period_days_override? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        d = request.data
        if not d.get("resignation_date") or not d.get("reason"):
            return error_response("VALIDATION_ERROR", "resignation_date and reason are required.", http_status=400, request=request)

        try:
            from datetime import date
            exit_req = ExitWorkflowService.submit_resignation(
                bu_id=bu_id,
                employee_id=emp_pk,
                resignation_date=date.fromisoformat(d["resignation_date"]),
                reason=d["reason"],
                reason_category=d.get("reason_category", ""),
                notice_period_days_override=d.get("notice_period_days_override"),
            )
        except ExitWorkflowError as e:
            return error_response("EXIT_ERROR", str(e), http_status=400, request=request)

        return created_response(
            data={
                "exit_request_id": str(exit_req.id),
                "status": exit_req.status,
                "last_working_date": str(exit_req.last_working_date),
            },
            request=request,
        )


class ExitApproveView(APIView):
    """
    POST /hrms/exit/{exit_request_id}/approve/
    HR approves resignation — sets NOTICE_PERIOD.
    Body: { lwd_override?, hr_remarks?, rehire_eligible? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, exit_request_id: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        d = request.data
        lwd_override = None
        if d.get("lwd_override"):
            from datetime import date
            lwd_override = date.fromisoformat(d["lwd_override"])

        try:
            exit_req = ExitWorkflowService.hr_approve(
                bu_id=bu_id,
                exit_request_id=exit_request_id,
                approved_by_id=request.user.id,
                lwd_override=lwd_override,
                hr_remarks=d.get("hr_remarks", ""),
                rehire_eligible=d.get("rehire_eligible", True),
            )
        except ExitWorkflowError as e:
            return error_response("EXIT_ERROR", str(e), http_status=400, request=request)

        return success_response(
            data={"status": exit_req.status, "last_working_date": str(exit_req.last_working_date)},
            request=request,
        )


class ExitCompleteView(APIView):
    """
    POST /hrms/exit/{exit_request_id}/complete/
    HR marks employee as fully exited.
    Body: { actual_last_day, exit_interview_done? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, exit_request_id: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        d = request.data
        if not d.get("actual_last_day"):
            return error_response("VALIDATION_ERROR", "actual_last_day is required.", http_status=400, request=request)

        try:
            from datetime import date
            exit_req = ExitWorkflowService.mark_exit_complete(
                bu_id=bu_id,
                exit_request_id=exit_request_id,
                actual_last_day=date.fromisoformat(d["actual_last_day"]),
                completed_by_id=request.user.id,
                exit_interview_done=d.get("exit_interview_done", True),
            )
        except ExitWorkflowError as e:
            return error_response("EXIT_ERROR", str(e), http_status=400, request=request)

        return success_response(data={"status": exit_req.status}, request=request)


class ExitWithdrawView(APIView):
    """POST /hrms/exit/{exit_request_id}/withdraw/ — Employee withdraws resignation."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, exit_request_id: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            exit_req = ExitWorkflowService.withdraw(
                bu_id=bu_id,
                exit_request_id=exit_request_id,
                withdrawn_by_id=request.user.id,
                reason=request.data.get("reason", ""),
            )
        except ExitWorkflowError as e:
            return error_response("EXIT_ERROR", str(e), http_status=400, request=request)

        return success_response(data={"status": exit_req.status}, request=request)


# ─── Asset ─────────────────────────────────────────────────────────────────────

class EmployeeAssetListView(APIView):
    """GET /hrms/employees/{emp_pk}/assets/ — list employee's active assets."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        assets = AssetService.get_employee_assets(bu_id=bu_id, employee_id=emp_pk)
        return success_response(data=assets, request=request)


class AssetAssignView(APIView):
    """
    POST /hrms/assets/{asset_id}/assign/
    Body: { employee_id, condition_on_assign?, notes? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, asset_id: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        employee_id = request.data.get("employee_id")
        if not employee_id:
            return error_response("VALIDATION_ERROR", "employee_id is required.", http_status=400, request=request)

        try:
            assignment = AssetService.assign(
                bu_id=bu_id,
                asset_id=asset_id,
                employee_id=uuid.UUID(str(employee_id)),
                assigned_by_id=request.user.id,
                condition_on_assign=request.data.get("condition_on_assign", "GOOD"),
                notes=request.data.get("notes", ""),
            )
        except AssetError as e:
            return error_response("ASSET_ERROR", str(e), http_status=400, request=request)

        return created_response(
            data={"assignment_id": str(assignment.id), "status": assignment.status},
            request=request,
        )


class AssetReturnView(APIView):
    """
    POST /hrms/asset-assignments/{assignment_id}/return/
    Body: { condition_on_return?, notes? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, assignment_id: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            assignment = AssetService.return_asset(
                bu_id=bu_id,
                assignment_id=assignment_id,
                returned_by_id=request.user.id,
                condition_on_return=request.data.get("condition_on_return", "GOOD"),
                notes=request.data.get("notes", ""),
            )
        except AssetError as e:
            return error_response("ASSET_ERROR", str(e), http_status=400, request=request)

        return success_response(data={"status": assignment.status}, request=request)


# ─── Training ──────────────────────────────────────────────────────────────────

class TrainingEnrollView(APIView):
    """
    POST /hrms/training/courses/{course_id}/enroll/
    Body: { employee_id, pass_mark?, scheduled_date?, notes? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, course_id: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        employee_id = request.data.get("employee_id")
        if not employee_id:
            return error_response("VALIDATION_ERROR", "employee_id is required.", http_status=400, request=request)

        try:
            from datetime import date
            scheduled_date = None
            if request.data.get("scheduled_date"):
                scheduled_date = date.fromisoformat(request.data["scheduled_date"])

            enrollment = TrainingService.enroll(
                bu_id=bu_id,
                course_id=course_id,
                employee_id=uuid.UUID(str(employee_id)),
                enrolled_by_id=request.user.id,
                scheduled_date=scheduled_date,
                pass_mark=request.data.get("pass_mark"),
                notes=request.data.get("notes", ""),
            )
        except TrainingError as e:
            return error_response("TRAINING_ERROR", str(e), http_status=400, request=request)

        return created_response(
            data={"enrollment_id": str(enrollment.id), "status": enrollment.status},
            request=request,
        )


class TrainingCompleteView(APIView):
    """
    POST /hrms/training/enrollments/{enrollment_id}/complete/
    Body: { completion_date, score?, certificate_number?, certificate_url?, notes? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, enrollment_id: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        d = request.data
        if not d.get("completion_date"):
            return error_response("VALIDATION_ERROR", "completion_date is required.", http_status=400, request=request)

        try:
            from datetime import date
            enrollment = TrainingService.complete(
                bu_id=bu_id,
                enrollment_id=enrollment_id,
                completed_by_id=request.user.id,
                completion_date=date.fromisoformat(d["completion_date"]),
                score=float(d["score"]) if d.get("score") is not None else None,
                certificate_number=d.get("certificate_number", ""),
                certificate_url=d.get("certificate_url", ""),
                notes=d.get("notes", ""),
            )
        except TrainingError as e:
            return error_response("TRAINING_ERROR", str(e), http_status=400, request=request)

        return success_response(data={"status": enrollment.status, "score": enrollment.score}, request=request)


class EmployeeTrainingHistoryView(APIView):
    """GET /hrms/employees/{emp_pk}/training/ — Employee 360 training tab."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        history = TrainingService.get_employee_training_history(bu_id=bu_id, employee_id=emp_pk)
        return success_response(data=history, request=request)


class TrainingGapReportView(APIView):
    """GET /hrms/training/gaps/ — Mandatory training gap compliance report."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        gaps = TrainingService.get_mandatory_training_gaps(bu_id=bu_id)
        return success_response(data=gaps, meta={"total_gaps": len(gaps)}, request=request)


# ─── Employee 360 Timeline ─────────────────────────────────────────────────────

class Employee360TimelineView(APIView):
    """
    GET /hrms/employees/{emp_pk}/timeline/
    Returns paginated career timeline events for Employee 360 view.
    Query params: ?page=1&page_size=20&event_type=PROMOTED
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        from apps.hrms.models.employee_event import EmployeeEvent
        qs = EmployeeEvent.objects.filter(
            business_unit_id=bu_id, employee_id=emp_pk
        ).order_by("-event_date", "-created_at")

        # Optional filter by event_type
        event_type = request.query_params.get("event_type")
        if event_type:
            qs = qs.filter(event_type=event_type)

        # Simple pagination
        page_size = min(int(request.query_params.get("page_size", 20)), 100)
        page = max(int(request.query_params.get("page", 1)), 1)
        offset = (page - 1) * page_size
        total = qs.count()
        events = qs[offset: offset + page_size]

        data = [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "title": e.title,
                "description": e.description,
                "event_date": e.event_date.isoformat() if e.event_date else None,
                "metadata": e.metadata,
                "triggered_by_id": str(e.triggered_by_id) if e.triggered_by_id else None,
            }
            for e in events
        ]
        return success_response(
            data=data,
            meta={"total": total, "page": page, "page_size": page_size},
            request=request,
        )
