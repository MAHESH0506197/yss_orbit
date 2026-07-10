from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.payroll.api.views.payroll_view import (
    PayrollRunViewSet,
    PayslipViewSet,
    SalaryComponentViewSet,
    SalaryStructureViewSet,
)
from apps.payroll.api.payroll_approval_views import PayrollApprovalViewSet
from apps.payroll.api.views.payroll_declaration_views import (
    TaxDeclarationListCreateView, TaxDeclarationDetailView,
    TaxDeclarationSubmitView, TaxDeclarationVerifyView, TaxDeclarationLockView,
    VariablePayListCreateView, VariablePayApproveView,
    FinalSettlementView,
)
from apps.payroll.api.views.compliance_views import (
    Form16DownloadView,
    PFECRView,
    ESIReturnView,
    PTReturnView,
)
from apps.payroll.api.views.pt_slab_views import ProfessionalTaxSlabViewSet

router = DefaultRouter()
router.register(r'pt-slabs', ProfessionalTaxSlabViewSet, basename='pt-slab')
router.register(r'runs', PayrollRunViewSet, basename='payroll-run')
router.register(r'payslips', PayslipViewSet, basename='payslip')
router.register(r'components', SalaryComponentViewSet, basename='salary-component')
router.register(r'structures', SalaryStructureViewSet, basename='salary-structure')
router.register(r'approval', PayrollApprovalViewSet, basename='payroll-approval')

app_name = "payroll"

urlpatterns = [
    path('', include(router.urls)),

    # ── Tax Declarations (ESS → HR → Finance) ────────────────────────────────
    path("tax-declarations/", TaxDeclarationListCreateView.as_view(), name="tax-declaration-list"),
    path("tax-declarations/<uuid:pk>/", TaxDeclarationDetailView.as_view(), name="tax-declaration-detail"),
    path("tax-declarations/<uuid:pk>/submit/", TaxDeclarationSubmitView.as_view(), name="tax-declaration-submit"),
    path("tax-declarations/<uuid:pk>/verify/", TaxDeclarationVerifyView.as_view(), name="tax-declaration-verify"),
    path("tax-declarations/<uuid:pk>/lock/", TaxDeclarationLockView.as_view(), name="tax-declaration-lock"),

    # ── Variable Pay ─────────────────────────────────────────────────────────
    path("variable-pay/", VariablePayListCreateView.as_view(), name="variable-pay-list"),
    path("variable-pay/<uuid:pk>/approve/", VariablePayApproveView.as_view(), name="variable-pay-approve"),

    # ── Final Settlement ──────────────────────────────────────────────────────
    path("settlements/<uuid:employee_id>/", FinalSettlementView.as_view(), name="final-settlement"),

    # ── Compliance Reports (Phase 4 stubs — Phase 8 PDF generation) ──────────
    path("compliance/form-16/", Form16DownloadView.as_view(), name="compliance-form-16"),
    path("compliance/pf-ecr/", PFECRView.as_view(), name="compliance-pf-ecr"),
    path("compliance/esi-return/", ESIReturnView.as_view(), name="compliance-esi-return"),
    path("compliance/pt-return/", PTReturnView.as_view(), name="compliance-pt-return"),
]
