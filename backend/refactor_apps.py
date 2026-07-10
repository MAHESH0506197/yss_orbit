# yss_orbit\backend\refactor_apps.py
import os
import shutil

BASE_DIR = r"c:\PROJECT\yss_orbit\backend\apps"

# Clean up duplicate/bad models in these apps
for app in ["drug_register", "pharmacy_billing", "expiry_tracking"]:
    # For simplicity, we rewrite them nicely
    pass

files = {
    # ---------------- DRUG REGISTER ---------------- #
    "drug_register/models/drug_register_model.py": """from django.db import models
from apps.platform.models.base import TenantModel
from apps.pharmacy.models import Medicine
from apps.drug_register.enums.enums import TransactionType

class DrugRegister(TenantModel):
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT, related_name='register_entries')
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    batch_number = models.CharField(max_length=100, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    transaction_date = models.DateTimeField(auto_now_add=True)
    reference_document = models.CharField(max_length=255, blank=True, help_text="Invoice or Prescription ID")
    remarks = models.TextField(blank=True)
    performed_by = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'drug_register'
        ordering = ['-transaction_date']

    def __str__(self):
        return f"{self.medicine.name} - {self.transaction_type} ({self.quantity})"
""",
    "drug_register/models/__init__.py": """from .drug_register_model import DrugRegister
from .schedule_log_model import ScheduleLog
""",
    "drug_register/models/drug_model.py": "",  # Delete basically
    "drug_register/models/schedule_log_model.py": """from django.db import models
from apps.platform.models.base import TenantModel
from apps.pharmacy.models import Medicine

class ScheduleLog(TenantModel):
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT)
    dispensed_qty = models.DecimalField(max_digits=10, decimal_places=2)
    patient_name = models.CharField(max_length=255)
    doctor_name = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'drug_schedule_log'
""",
    "drug_register/api/serializers/drug_register_serializer.py": """from rest_framework import serializers
from apps.drug_register.models.drug_register_model import DrugRegister

class DrugRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = DrugRegister
        fields = '__all__'
        read_only_fields = ['business_unit_id']
""",
    "drug_register/api/serializers/drug_register_response_serializer.py": """from rest_framework import serializers
from apps.drug_register.models.drug_register_model import DrugRegister

class DrugRegisterResponseSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    class Meta:
        model = DrugRegister
        fields = '__all__'
""",
    "drug_register/api/serializers/__init__.py": """from .drug_register_serializer import DrugRegisterSerializer
from .drug_register_response_serializer import DrugRegisterResponseSerializer
""",
    "drug_register/api/views/drug_register_view.py": """from rest_framework import viewsets
from apps.drug_register.models.drug_register_model import DrugRegister
from apps.drug_register.api.serializers.drug_register_serializer import DrugRegisterSerializer
from apps.drug_register.api.serializers.drug_register_response_serializer import DrugRegisterResponseSerializer

class DrugRegisterViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        bu_id = self.request.headers.get("X-Business-Unit-ID")
        return DrugRegister.objects.filter(business_unit_id=bu_id)
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return DrugRegisterResponseSerializer
        return DrugRegisterSerializer
    
    def perform_create(self, serializer):
        bu_id = self.request.headers.get("X-Business-Unit-ID")
        serializer.save(business_unit_id=bu_id)
""",
    "drug_register/api/views/__init__.py": """from .drug_register_view import DrugRegisterViewSet
""",
    "drug_register/api/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.drug_register_view import DrugRegisterViewSet

router = DefaultRouter()
router.register(r'registers', DrugRegisterViewSet, basename='drug-register')

urlpatterns = [
    path('', include(router.urls)),
]
""",

    # ---------------- EXPIRY TRACKING ---------------- #
    "expiry_tracking/models/expiry_model.py": """from django.db import models
from apps.platform.models.base import TenantModel
from apps.pharmacy.models import MedicineBatch

class ExpiryAlert(TenantModel):
    batch = models.ForeignKey(MedicineBatch, on_delete=models.CASCADE)
    days_to_expiry = models.IntegerField()
    is_resolved = models.BooleanField(default=False)
    alert_date = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'expiry_alert'
""",
    "expiry_tracking/models/__init__.py": """from .expiry_model import ExpiryAlert\n""",
    "expiry_tracking/api/serializers/expiry_serializer.py": """from rest_framework import serializers
from apps.expiry_tracking.models.expiry_model import ExpiryAlert

class ExpiryAlertSerializer(serializers.ModelSerializer):
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    medicine_name = serializers.CharField(source='batch.medicine.name', read_only=True)
    class Meta:
        model = ExpiryAlert
        fields = '__all__'
        read_only_fields = ['business_unit_id']
""",
    "expiry_tracking/api/serializers/__init__.py": """from .expiry_serializer import ExpiryAlertSerializer\n""",
    "expiry_tracking/api/views/expiry_view.py": """from rest_framework import viewsets
from apps.expiry_tracking.models.expiry_model import ExpiryAlert
from apps.expiry_tracking.api.serializers.expiry_serializer import ExpiryAlertSerializer

class ExpiryAlertViewSet(viewsets.ModelViewSet):
    serializer_class = ExpiryAlertSerializer
    
    def get_queryset(self):
        bu_id = self.request.headers.get("X-Business-Unit-ID")
        return ExpiryAlert.objects.filter(business_unit_id=bu_id)

    def perform_create(self, serializer):
        bu_id = self.request.headers.get("X-Business-Unit-ID")
        serializer.save(business_unit_id=bu_id)
""",
    "expiry_tracking/api/views/__init__.py": """from .expiry_view import ExpiryAlertViewSet\n""",
    "expiry_tracking/api/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.expiry_view import ExpiryAlertViewSet

router = DefaultRouter()
router.register(r'alerts', ExpiryAlertViewSet, basename='expiry-alert')

urlpatterns = [
    path('', include(router.urls)),
]
""",
    "expiry_tracking/services/expiry_tracking_service.py": """from datetime import date, timedelta
from apps.expiry_tracking.models.expiry_model import ExpiryAlert
from apps.pharmacy.models import MedicineBatch

class ExpiryTrackingService:
    @staticmethod
    def check_for_expiring_batches(bu_id, days_threshold=90):
        threshold_date = date.today() + timedelta(days=days_threshold)
        expiring_batches = MedicineBatch.objects.filter(
            business_unit_id=bu_id,
            expiry_date__lte=threshold_date,
            quantity_remaining__gt=0,
            is_expired=False
        )
        
        alerts_created = []
        for batch in expiring_batches:
            days_to_expiry = (batch.expiry_date - date.today()).days
            alert, created = ExpiryAlert.objects.get_or_create(
                batch=batch,
                is_resolved=False,
                defaults={'days_to_expiry': days_to_expiry, 'business_unit_id': bu_id}
            )
            if created:
                alerts_created.append(alert)
            else:
                alert.days_to_expiry = days_to_expiry
                alert.save()
                
        return alerts_created
""",
    "expiry_tracking/services/__init__.py": """from .expiry_tracking_service import ExpiryTrackingService\n""",

    # ---------------- PHARMACY BILLING ---------------- #
    "pharmacy_billing/models/billing_model.py": """from django.db import models
from apps.platform.models.base import TenantModel
from apps.pharmacy.models import Prescription, PrescriptionItem

class PharmacyInvoice(TenantModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    )
    prescription = models.ForeignKey(Prescription, on_delete=models.PROTECT, null=True, blank=True)
    patient_id = models.CharField(max_length=255)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pharmacy_invoice'

class PharmacyInvoiceItem(TenantModel):
    invoice = models.ForeignKey(PharmacyInvoice, related_name='items', on_delete=models.CASCADE)
    prescription_item = models.ForeignKey(PrescriptionItem, on_delete=models.PROTECT, null=True, blank=True)
    medicine_name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'pharmacy_invoice_item'
""",
    "pharmacy_billing/models/__init__.py": """from .billing_model import PharmacyInvoice, PharmacyInvoiceItem
from .insurance_claim_model import InsuranceClaim
from .pharmacy_billing_model import PharmacyBilling
from .prescription_model import PrescriptionBilling
""",
    "pharmacy_billing/api/serializers/billing_serializer.py": """from rest_framework import serializers
from apps.pharmacy_billing.models.billing_model import PharmacyInvoice, PharmacyInvoiceItem

class PharmacyInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacyInvoiceItem
        fields = '__all__'
        read_only_fields = ['business_unit_id']

class PharmacyInvoiceSerializer(serializers.ModelSerializer):
    items = PharmacyInvoiceItemSerializer(many=True, read_only=True)
    class Meta:
        model = PharmacyInvoice
        fields = '__all__'
        read_only_fields = ['business_unit_id']
""",
    "pharmacy_billing/api/serializers/__init__.py": """from .billing_serializer import PharmacyInvoiceSerializer\n""",
    "pharmacy_billing/api/views/billing_view.py": """from rest_framework import viewsets
from apps.pharmacy_billing.models.billing_model import PharmacyInvoice
from apps.pharmacy_billing.api.serializers.billing_serializer import PharmacyInvoiceSerializer

class PharmacyInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = PharmacyInvoiceSerializer

    def get_queryset(self):
        bu_id = self.request.headers.get("X-Business-Unit-ID")
        return PharmacyInvoice.objects.filter(business_unit_id=bu_id)

    def perform_create(self, serializer):
        bu_id = self.request.headers.get("X-Business-Unit-ID")
        serializer.save(business_unit_id=bu_id)
""",
    "pharmacy_billing/api/views/__init__.py": """from .billing_view import PharmacyInvoiceViewSet\n""",
    "pharmacy_billing/api/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.billing_view import PharmacyInvoiceViewSet

router = DefaultRouter()
router.register(r'invoices', PharmacyInvoiceViewSet, basename='pharmacy-invoice')

urlpatterns = [
    path('', include(router.urls)),
]
""",
    "pharmacy_billing/services/billing_service.py": """from django.db import transaction
from apps.pharmacy_billing.models.billing_model import PharmacyInvoice, PharmacyInvoiceItem
from apps.pharmacy.models import Prescription

class PharmacyBillingService:
    @staticmethod
    @transaction.atomic
    def generate_invoice(prescription_id, item_prices, discount=0.0, bu_id=None):
        prescription = Prescription.objects.prefetch_related('items').get(id=prescription_id, business_unit_id=bu_id)
        
        total_amount = 0
        invoice_items_data = []
        
        for disp_item in prescription.items.all():
            unit_price = item_prices.get(str(disp_item.id), 0.0)
            item_total = float(unit_price) * float(disp_item.quantity_dispensed)
            total_amount += item_total
            invoice_items_data.append({
                'prescription_item': disp_item,
                'medicine_name': disp_item.medicine_name,
                'quantity': disp_item.quantity_dispensed,
                'unit_price': unit_price,
                'total': item_total
            })
            
        net_amount = total_amount - float(discount)
        
        invoice = PharmacyInvoice.objects.create(
            business_unit_id=bu_id,
            prescription=prescription,
            patient_id=prescription.patient_name,
            total_amount=total_amount,
            discount=discount,
            net_amount=net_amount,
            status='PENDING'
        )
        
        for data in invoice_items_data:
            PharmacyInvoiceItem.objects.create(
                business_unit_id=bu_id,
                invoice=invoice,
                prescription_item=data['prescription_item'],
                medicine_name=data['medicine_name'],
                quantity=data['quantity'],
                unit_price=data['unit_price'],
                total=data['total']
            )
            
        return invoice
        
    @staticmethod
    def mark_invoice_as_paid(invoice_id, bu_id):
        invoice = PharmacyInvoice.objects.get(id=invoice_id, business_unit_id=bu_id)
        invoice.status = 'PAID'
        invoice.save()
        return invoice
""",
    "pharmacy_billing/services/__init__.py": """from .billing_service import PharmacyBillingService\n"""
}

for rel_path, content in files.items():
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)

# Clean up other models we aren't using to prevent errors
for bad_model in ["drug_register/models/drug_model.py", "pharmacy_billing/models/insurance_claim_model.py", "pharmacy_billing/models/pharmacy_billing_model.py", "pharmacy_billing/models/prescription_model.py"]:
    bad_path = os.path.join(BASE_DIR, bad_model)
    if os.path.exists(bad_path):
        os.remove(bad_path)

print("Done refactoring apps.")
