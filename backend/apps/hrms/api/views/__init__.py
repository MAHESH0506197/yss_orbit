# yss_orbit\backend\apps\hrms\api\views\__init__.py
from .department_view import DepartmentListView, DepartmentDetailView
from .designation_view import DesignationListView, DesignationDetailView
from .employee_view import EmployeeListView, EmployeeDetailView, EmployeeDocumentView, EmployeePhotoUploadView
from .lifecycle_views import (
    # Onboarding
    OnboardingInitView, OnboardingProgressView, OnboardingTaskCompleteView,
    # Transfer
    TransferListCreateView, TransferApproveView,
    # Promotion
    PromotionListCreateView, PromotionApproveView,
    # Exit
    ExitSubmitView, ExitApproveView, ExitCompleteView, ExitWithdrawView,
    # Asset
    EmployeeAssetListView, AssetAssignView, AssetReturnView,
    # Training
    TrainingEnrollView, TrainingCompleteView, EmployeeTrainingHistoryView, TrainingGapReportView,
    # Employee 360
    Employee360TimelineView,
)

__all__ = [
    "DepartmentListView", "DepartmentDetailView",
    "DesignationListView", "DesignationDetailView",
    "EmployeeListView", "EmployeeDetailView", "EmployeeDocumentView", "EmployeePhotoUploadView",
    # Onboarding
    "OnboardingInitView", "OnboardingProgressView", "OnboardingTaskCompleteView",
    # Transfer
    "TransferListCreateView", "TransferApproveView",
    # Promotion
    "PromotionListCreateView", "PromotionApproveView",
    # Exit
    "ExitSubmitView", "ExitApproveView", "ExitCompleteView", "ExitWithdrawView",
    # Asset
    "EmployeeAssetListView", "AssetAssignView", "AssetReturnView",
    # Training
    "TrainingEnrollView", "TrainingCompleteView", "EmployeeTrainingHistoryView", "TrainingGapReportView",
    # Employee 360
    "Employee360TimelineView",
]
