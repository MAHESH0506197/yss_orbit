# yss_orbit\backend\implement_pharmacy.py
import os

BASE_DIR = r"c:\PROJECT\yss_orbit\backend\apps"

files_to_write = {
    # ---------------- DRUG REGISTER ---------------- #
    "drug_register/models/__init__.py": """from .drug_model import DrugCategory, Drug\n""",
    "drug_register/models/drug_model.py": """from django.db import models
from apps.platform.models.base import TenantModel

class DrugCategory(TenantModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'drug_category'
        verbose_name_plural = 'Drug Categories'

class Drug(TenantModel):
    SCHEDULE_CHOICES = (
        ('NONE', 'None'),
        ('H', 'Schedule H'),
        ('H1', 'Schedule H1'),
        ('X', 'Schedule X'),
    )
    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255)
    category = models.ForeignKey(DrugCategory, on_delete=models.SET_NULL, null=True)
    formulation = models.CharField(max_length=100)
    strength = models.CharField(max_length=100)
    manufacturer = models.CharField(max_length=255)
    schedule = models.CharField(max_length=10, choices=SCHEDULE_CHOICES, default='NONE')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'drug'
""",
    "drug_register/api/serializers/__init__.py": """from .drug_serializer import DrugCategorySerializer, DrugSerializer\n""",
    "drug_register/api/serializers/drug_serializer.py": """from rest_framework import serializers
from apps.drug_register.models.drug_model import DrugCategory, Drug

class DrugCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DrugCategory
        fields = '__all__'

class DrugSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = Drug
        fields = '__all__'
""",
    "drug_register/api/views/__init__.py": """from .drug_view import DrugCategoryViewSet, DrugViewSet\n""",
    "drug_register/api/views/drug_view.py": """from rest_framework import viewsets
from apps.drug_register.models.drug_model import DrugCategory, Drug
from apps.drug_register.api.serializers.drug_serializer import DrugCategorySerializer, DrugSerializer

class DrugCategoryViewSet(viewsets.ModelViewSet):
    queryset = DrugCategory.objects.all()
    serializer_class = DrugCategorySerializer

class DrugViewSet(viewsets.ModelViewSet):
    queryset = Drug.objects.all()
    serializer_class = DrugSerializer
""",
    "drug_register/api/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.drug_view import DrugCategoryViewSet, DrugViewSet

router = DefaultRouter()
router.register(r'categories', DrugCategoryViewSet)
router.register(r'drugs', DrugViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""",

    # ---------------- EXPIRY TRACKING ---------------- #
    "expiry_tracking/models/__init__.py": """from .expiry_model import DrugBatch, ExpiryAlert\n""",
    "expiry_tracking/models/expiry_model.py": """from django.db import models
from apps.platform.models.base import TenantModel
from apps.drug_register.models.drug_model import Drug

class DrugBatch(TenantModel):
    drug = models.ForeignKey(Drug, on_delete=models.CASCADE)
    batch_number = models.CharField(max_length=100)
    manufacturing_date = models.DateField()
    expiry_date = models.DateField()
    quantity = models.PositiveIntegerField(default=0)
    location = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'drug_batch'

class ExpiryAlert(TenantModel):
    batch = models.ForeignKey(DrugBatch, on_delete=models.CASCADE)
    days_to_expiry = models.IntegerField()
    is_resolved = models.BooleanField(default=False)
    alert_date = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'expiry_alert'
""",
    "expiry_tracking/api/serializers/__init__.py": """from .expiry_serializer import DrugBatchSerializer, ExpiryAlertSerializer\n""",
    "expiry_tracking/api/serializers/expiry_serializer.py": """from rest_framework import serializers
from apps.expiry_tracking.models.expiry_model import DrugBatch, ExpiryAlert

class DrugBatchSerializer(serializers.ModelSerializer):
    drug_name = serializers.CharField(source='drug.name', read_only=True)
    class Meta:
        model = DrugBatch
        fields = '__all__'

class ExpiryAlertSerializer(serializers.ModelSerializer):
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    drug_name = serializers.CharField(source='batch.drug.name', read_only=True)
    class Meta:
        model = ExpiryAlert
        fields = '__all__'
""",
    "expiry_tracking/api/views/__init__.py": """from .expiry_view import DrugBatchViewSet, ExpiryAlertViewSet\n""",
    "expiry_tracking/api/views/expiry_view.py": """from rest_framework import viewsets
from apps.expiry_tracking.models.expiry_model import DrugBatch, ExpiryAlert
from apps.expiry_tracking.api.serializers.expiry_serializer import DrugBatchSerializer, ExpiryAlertSerializer

class DrugBatchViewSet(viewsets.ModelViewSet):
    queryset = DrugBatch.objects.all()
    serializer_class = DrugBatchSerializer

class ExpiryAlertViewSet(viewsets.ModelViewSet):
    queryset = ExpiryAlert.objects.all()
    serializer_class = ExpiryAlertSerializer
""",
    "expiry_tracking/api/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.expiry_view import DrugBatchViewSet, ExpiryAlertViewSet

router = DefaultRouter()
router.register(r'batches', DrugBatchViewSet)
router.register(r'alerts', ExpiryAlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""",

    # ---------------- PHARMACY ---------------- #
    "pharmacy/models/__init__.py": """from .pharmacy_model import Prescription, PrescriptionItem, Dispense, DispenseItem\n""",
    "pharmacy/models/pharmacy_model.py": """from django.db import models
from apps.platform.models.base import TenantModel
from apps.drug_register.models.drug_model import Drug
from apps.expiry_tracking.models.expiry_model import DrugBatch

class Prescription(TenantModel):
    patient_id = models.CharField(max_length=255)
    doctor_name = models.CharField(max_length=255)
    date = models.DateField()
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'prescription'

class PrescriptionItem(TenantModel):
    prescription = models.ForeignKey(Prescription, related_name='items', on_delete=models.CASCADE)
    drug = models.ForeignKey(Drug, on_delete=models.PROTECT)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration_days = models.PositiveIntegerField()
    instructions = models.TextField(blank=True)

    class Meta:
        db_table = 'prescription_item'

class Dispense(TenantModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('DISPENSED', 'Dispensed'),
        ('CANCELLED', 'Cancelled'),
    )
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    class Meta:
        db_table = 'dispense'

class DispenseItem(TenantModel):
    dispense = models.ForeignKey(Dispense, related_name='items', on_delete=models.CASCADE)
    batch = models.ForeignKey(DrugBatch, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()

    class Meta:
        db_table = 'dispense_item'
""",
    "pharmacy/api/serializers/__init__.py": """from .pharmacy_serializer import PrescriptionSerializer, DispenseSerializer\n""",
    "pharmacy/api/serializers/pharmacy_serializer.py": """from rest_framework import serializers
from apps.pharmacy.models.pharmacy_model import Prescription, PrescriptionItem, Dispense, DispenseItem

class PrescriptionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionItem
        fields = '__all__'

class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True, read_only=True)
    class Meta:
        model = Prescription
        fields = '__all__'

class DispenseItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DispenseItem
        fields = '__all__'

class DispenseSerializer(serializers.ModelSerializer):
    items = DispenseItemSerializer(many=True, read_only=True)
    class Meta:
        model = Dispense
        fields = '__all__'
""",
    "pharmacy/api/views/__init__.py": """from .pharmacy_view import PrescriptionViewSet, DispenseViewSet\n""",
    "pharmacy/api/views/pharmacy_view.py": """from rest_framework import viewsets
from apps.pharmacy.models.pharmacy_model import Prescription, Dispense
from apps.pharmacy.api.serializers.pharmacy_serializer import PrescriptionSerializer, DispenseSerializer

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

class DispenseViewSet(viewsets.ModelViewSet):
    queryset = Dispense.objects.all()
    serializer_class = DispenseSerializer
""",
    "pharmacy/api/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.pharmacy_view import PrescriptionViewSet, DispenseViewSet

router = DefaultRouter()
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'dispenses', DispenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""",

    # ---------------- PHARMACY BILLING ---------------- #
    "pharmacy_billing/models/__init__.py": """from .billing_model import PharmacyInvoice, PharmacyInvoiceItem\n""",
    "pharmacy_billing/models/billing_model.py": """from django.db import models
from apps.platform.models.base import TenantModel
from apps.pharmacy.models.pharmacy_model import Dispense, DispenseItem

class PharmacyInvoice(TenantModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    )
    dispense = models.ForeignKey(Dispense, on_delete=models.PROTECT)
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
    dispense_item = models.ForeignKey(DispenseItem, on_delete=models.PROTECT)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'pharmacy_invoice_item'
""",
    "pharmacy_billing/api/serializers/__init__.py": """from .billing_serializer import PharmacyInvoiceSerializer\n""",
    "pharmacy_billing/api/serializers/billing_serializer.py": """from rest_framework import serializers
from apps.pharmacy_billing.models.billing_model import PharmacyInvoice, PharmacyInvoiceItem

class PharmacyInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacyInvoiceItem
        fields = '__all__'

class PharmacyInvoiceSerializer(serializers.ModelSerializer):
    items = PharmacyInvoiceItemSerializer(many=True, read_only=True)
    class Meta:
        model = PharmacyInvoice
        fields = '__all__'
""",
    "pharmacy_billing/api/views/__init__.py": """from .billing_view import PharmacyInvoiceViewSet\n""",
    "pharmacy_billing/api/views/billing_view.py": """from rest_framework import viewsets
from apps.pharmacy_billing.models.billing_model import PharmacyInvoice
from apps.pharmacy_billing.api.serializers.billing_serializer import PharmacyInvoiceSerializer

class PharmacyInvoiceViewSet(viewsets.ModelViewSet):
    queryset = PharmacyInvoice.objects.all()
    serializer_class = PharmacyInvoiceSerializer
""",
    "pharmacy_billing/api/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.billing_view import PharmacyInvoiceViewSet

router = DefaultRouter()
router.register(r'invoices', PharmacyInvoiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
"""
}

for rel_path, content in files_to_write.items():
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
print("Done writing models, serializers, views, and urls.")
