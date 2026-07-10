# yss_orbit\backend\apps\generate_apps.py
import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r"c:\PROJECT\yss_orbit\backend\apps"

# ----------------- INVENTORY APP -----------------

write_file(f"{base_dir}/inventory/models/__init__.py", """from .warehouse_model import Warehouse
from .inventory_item_model import InventoryItem
from .stock_level_model import StockLevel
""")

write_file(f"{base_dir}/inventory/models/warehouse_model.py", """from django.db import models
from apps.platform.models.base import TenantModel

class Warehouse(TenantModel):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=500, blank=True)
    is_active_warehouse = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = "inventory_warehouse"

    def __str__(self):
        return self.name
""")

write_file(f"{base_dir}/inventory/models/inventory_item_model.py", """from django.db import models
from apps.platform.models.base import TenantModel

class InventoryItem(TenantModel):
    sku = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    unit_of_measure = models.CharField(max_length=50)
    requires_batch_tracking = models.BooleanField(default=False)
    requires_serial_tracking = models.BooleanField(default=False)

    class Meta(TenantModel.Meta):
        db_table = "inventory_item"

    def __str__(self):
        return f"{self.sku} - {self.name}"
""")

write_file(f"{base_dir}/inventory/models/stock_level_model.py", """from django.db import models
from apps.platform.models.base import TenantModel
from .warehouse_model import Warehouse
from .inventory_item_model import InventoryItem

class StockLevel(TenantModel):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='stock_levels')
    item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT, related_name='stock_levels')
    quantity = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    reserved_quantity = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    class Meta(TenantModel.Meta):
        db_table = "inventory_stock_level"
        unique_together = ('warehouse', 'item')

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

    def __str__(self):
        return f"{self.item.sku} at {self.warehouse.name}: {self.quantity}"
""")

write_file(f"{base_dir}/inventory/api/__init__.py", "")

write_file(f"{base_dir}/inventory/api/serializers.py", """from rest_framework import serializers
from apps.inventory.models import Warehouse, InventoryItem, StockLevel

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

class StockLevelSerializer(serializers.ModelSerializer):
    warehouse = WarehouseSerializer(read_only=True)
    item = InventoryItemSerializer(read_only=True)
    warehouse_id = serializers.UUIDField(write_only=True)
    item_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = StockLevel
        fields = '__all__'
""")

write_file(f"{base_dir}/inventory/api/views.py", """from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.inventory.models import Warehouse, InventoryItem, StockLevel
from .serializers import WarehouseSerializer, InventoryItemSerializer, StockLevelSerializer

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

class StockLevelViewSet(viewsets.ModelViewSet):
    queryset = StockLevel.objects.all()
    serializer_class = StockLevelSerializer
    permission_classes = [IsAuthenticated]
""")

write_file(f"{base_dir}/inventory/api/urls.py", """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, InventoryItemViewSet, StockLevelViewSet

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'items', InventoryItemViewSet, basename='inventoryitem')
router.register(r'stock-levels', StockLevelViewSet, basename='stocklevel')

urlpatterns = [
    path('', include(router.urls)),
]
""")

write_file(f"{base_dir}/inventory/services/__init__.py", "")

write_file(f"{base_dir}/inventory/services/inventory_service.py", """from django.db import transaction
from apps.inventory.models import StockLevel

class InventoryService:
    @staticmethod
    @transaction.atomic
    def adjust_stock(warehouse_id, item_id, quantity_change, business_unit_id):
        stock_level, _ = StockLevel.objects.get_or_create(
            warehouse_id=warehouse_id,
            item_id=item_id,
            business_unit_id=business_unit_id,
            defaults={'quantity': 0, 'reserved_quantity': 0}
        )
        stock_level.quantity += quantity_change
        stock_level.save()
        return stock_level
""")

# ----------------- BATCH TRACKING APP -----------------

write_file(f"{base_dir}/batch_tracking/models/__init__.py", """from .batch_model import Batch
from .serial_number_model import SerialNumber
""")

write_file(f"{base_dir}/batch_tracking/models/batch_model.py", """from django.db import models
from apps.platform.models.base import TenantModel
from apps.inventory.models import InventoryItem

class Batch(TenantModel):
    item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT, related_name='batches')
    batch_number = models.CharField(max_length=100)
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    quantity = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    class Meta(TenantModel.Meta):
        db_table = "batch_tracking_batch"
        unique_together = ('item', 'batch_number')

    def __str__(self):
        return f"{self.batch_number} - {self.item.sku}"
""")

write_file(f"{base_dir}/batch_tracking/models/serial_number_model.py", """from django.db import models
from apps.platform.models.base import TenantModel
from apps.inventory.models import InventoryItem

class SerialNumber(TenantModel):
    item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT, related_name='serial_numbers')
    serial_number = models.CharField(max_length=100, unique=True)
    is_available = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = "batch_tracking_serial_number"

    def __str__(self):
        return self.serial_number
""")

write_file(f"{base_dir}/batch_tracking/api/__init__.py", "")

write_file(f"{base_dir}/batch_tracking/api/serializers.py", """from rest_framework import serializers
from apps.batch_tracking.models import Batch, SerialNumber

class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'

class SerialNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = SerialNumber
        fields = '__all__'
""")

write_file(f"{base_dir}/batch_tracking/api/views.py", """from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.batch_tracking.models import Batch, SerialNumber
from .serializers import BatchSerializer, SerialNumberSerializer

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]

class SerialNumberViewSet(viewsets.ModelViewSet):
    queryset = SerialNumber.objects.all()
    serializer_class = SerialNumberSerializer
    permission_classes = [IsAuthenticated]
""")

write_file(f"{base_dir}/batch_tracking/api/urls.py", """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BatchViewSet, SerialNumberViewSet

router = DefaultRouter()
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'serial-numbers', SerialNumberViewSet, basename='serialnumber')

urlpatterns = [
    path('', include(router.urls)),
]
""")

write_file(f"{base_dir}/batch_tracking/services/__init__.py", "")

write_file(f"{base_dir}/batch_tracking/services/batch_service.py", """from apps.batch_tracking.models import Batch

class BatchService:
    @staticmethod
    def create_batch(item_id, batch_number, business_unit_id, quantity=0, expiry=None):
        return Batch.objects.create(
            item_id=item_id,
            batch_number=batch_number,
            business_unit_id=business_unit_id,
            quantity=quantity,
            expiry_date=expiry
        )
""")

# ----------------- STOCK TRANSFER APP -----------------

write_file(f"{base_dir}/stock_transfer/models/__init__.py", """from .transfer_request_model import StockTransferRequest, StockTransferItem
from .transfer_log_model import StockTransferLog
""")

write_file(f"{base_dir}/stock_transfer/models/transfer_request_model.py", """from django.db import models
from apps.platform.models.base import TenantModel
from apps.inventory.models import Warehouse, InventoryItem

class StockTransferRequest(TenantModel):
    class StatusChoices(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING = 'PENDING', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    source_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='outbound_transfers')
    destination_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='inbound_transfers')
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.DRAFT)
    reference_number = models.CharField(max_length=100, blank=True)
    remarks = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = "stock_transfer_request"

    def __str__(self):
        return f"Transfer {self.reference_number or self.id}"

class StockTransferItem(TenantModel):
    transfer = models.ForeignKey(StockTransferRequest, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=4)

    class Meta(TenantModel.Meta):
        db_table = "stock_transfer_item"

    def __str__(self):
        return f"{self.item.sku} x {self.quantity}"
""")

write_file(f"{base_dir}/stock_transfer/models/transfer_log_model.py", """from django.db import models
from apps.platform.models.base import TenantModel
from .transfer_request_model import StockTransferRequest

class StockTransferLog(TenantModel):
    transfer = models.ForeignKey(StockTransferRequest, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=50)
    notes = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = "stock_transfer_log"

    def __str__(self):
        return f"{self.transfer} - {self.action}"
""")

write_file(f"{base_dir}/stock_transfer/api/__init__.py", "")

write_file(f"{base_dir}/stock_transfer/api/serializers.py", """from rest_framework import serializers
from apps.stock_transfer.models import StockTransferRequest, StockTransferItem, StockTransferLog

class StockTransferItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockTransferItem
        fields = '__all__'

class StockTransferRequestSerializer(serializers.ModelSerializer):
    items = StockTransferItemSerializer(many=True, read_only=True)
    class Meta:
        model = StockTransferRequest
        fields = '__all__'

class StockTransferLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockTransferLog
        fields = '__all__'
""")

write_file(f"{base_dir}/stock_transfer/api/views.py", """from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.stock_transfer.models import StockTransferRequest, StockTransferItem, StockTransferLog
from apps.stock_transfer.services.stock_transfer_service import StockTransferService
from .serializers import StockTransferRequestSerializer, StockTransferItemSerializer, StockTransferLogSerializer

class StockTransferRequestViewSet(viewsets.ModelViewSet):
    queryset = StockTransferRequest.objects.all()
    serializer_class = StockTransferRequestSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def complete_transfer(self, request, pk=None):
        transfer = self.get_object()
        try:
            StockTransferService.complete_transfer(transfer)
            return Response({'status': 'Transfer completed'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StockTransferItemViewSet(viewsets.ModelViewSet):
    queryset = StockTransferItem.objects.all()
    serializer_class = StockTransferItemSerializer
    permission_classes = [IsAuthenticated]

class StockTransferLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockTransferLog.objects.all()
    serializer_class = StockTransferLogSerializer
    permission_classes = [IsAuthenticated]
""")

write_file(f"{base_dir}/stock_transfer/api/urls.py", """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StockTransferRequestViewSet, StockTransferItemViewSet, StockTransferLogViewSet

router = DefaultRouter()
router.register(r'requests', StockTransferRequestViewSet, basename='transferrequest')
router.register(r'items', StockTransferItemViewSet, basename='transferitem')
router.register(r'logs', StockTransferLogViewSet, basename='transferlog')

urlpatterns = [
    path('', include(router.urls)),
]
""")

write_file(f"{base_dir}/stock_transfer/services/__init__.py", "")

write_file(f"{base_dir}/stock_transfer/services/stock_transfer_service.py", """from django.db import transaction
from apps.stock_transfer.models import StockTransferRequest, StockTransferLog
from apps.inventory.services.inventory_service import InventoryService

class StockTransferService:
    @staticmethod
    @transaction.atomic
    def complete_transfer(transfer: StockTransferRequest):
        if transfer.status == StockTransferRequest.StatusChoices.COMPLETED:
            raise ValueError("Transfer is already completed")
            
        for item in transfer.items.all():
            # Deduct from source
            InventoryService.adjust_stock(
                warehouse_id=transfer.source_warehouse_id,
                item_id=item.item_id,
                quantity_change=-item.quantity,
                business_unit_id=transfer.business_unit_id
            )
            # Add to destination
            InventoryService.adjust_stock(
                warehouse_id=transfer.destination_warehouse_id,
                item_id=item.item_id,
                quantity_change=item.quantity,
                business_unit_id=transfer.business_unit_id
            )
            
        transfer.status = StockTransferRequest.StatusChoices.COMPLETED
        transfer.save()
        
        StockTransferLog.objects.create(
            transfer=transfer,
            action="COMPLETED",
            notes="Stock successfully transferred.",
            business_unit_id=transfer.business_unit_id
        )
""")

print("Apps generated successfully.")
