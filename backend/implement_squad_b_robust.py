# yss_orbit\backend\implement_squad_b_robust.py
import os

BASE_DIR = r"c:\PROJECT\yss_orbit\backend\apps"

files_to_write = {
    # ---------------- INVENTORY ---------------- #
    "inventory/services/__init__.py": """from .inventory_service import InventoryService\n""",
    "inventory/services/inventory_service.py": """from django.db import transaction
from django.db.models import F
from apps.inventory.models import Item, ItemBatch, StockLedger, StockLevel, Warehouse
from rest_framework.exceptions import ValidationError

class InventoryService:
    @staticmethod
    @transaction.atomic
    def adjust_stock(business_unit_id, item_id, warehouse_id, quantity_change, reason, batch_id=None, reference_id=None):
        \"\"\"
        Adjust stock levels. quantity_change can be positive (inward) or negative (outward).
        \"\"\"
        # Verify item and warehouse
        item = Item.objects.get(id=item_id, business_unit_id=business_unit_id)
        warehouse = Warehouse.objects.get(id=warehouse_id, business_unit_id=business_unit_id)
        
        # Determine movement type
        movement_type = 'IN' if quantity_change > 0 else 'OUT'
        if quantity_change == 0:
            return
            
        # Update or create StockLevel
        stock_level, _ = StockLevel.objects.get_or_create(
            business_unit_id=business_unit_id,
            item=item,
            warehouse=warehouse,
            batch_id=batch_id,
            defaults={'quantity': 0}
        )
        
        # For outward movement, check stock
        if movement_type == 'OUT' and stock_level.quantity < abs(quantity_change):
            raise ValidationError(f"Insufficient stock for {item.name} in {warehouse.name}.")
            
        stock_level.quantity += quantity_change
        stock_level.save()
        
        # Create Stock Ledger Entry
        StockLedger.objects.create(
            business_unit_id=business_unit_id,
            item=item,
            warehouse=warehouse,
            batch_id=batch_id,
            movement_type=movement_type,
            quantity=abs(quantity_change),
            reference_type=reason,
            reference_id=reference_id,
            notes=f"Stock adjustment: {reason}"
        )
        
        # Update Cached stock on item
        item._cached_stock += quantity_change
        item.save(update_fields=['_cached_stock'])
        
        return stock_level
""",
    "inventory/api/serializers.py": """from rest_framework import serializers
from apps.inventory.models import Warehouse, Item, StockLevel

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'
        read_only_fields = ['business_unit_id']

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'
        read_only_fields = ['business_unit_id', '_cached_stock']

class StockLevelSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    
    class Meta:
        model = StockLevel
        fields = '__all__'
        read_only_fields = ['business_unit_id']
""",
    "inventory/api/views.py": """from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.inventory.models import Warehouse, Item, StockLevel
from .serializers import WarehouseSerializer, ItemSerializer, StockLevelSerializer
from apps.inventory.services.inventory_service import InventoryService
from core.tenancy.tenant_context import get_current_tenant_id

class WarehouseViewSet(viewsets.ModelViewSet):
    serializer_class = WarehouseSerializer
    
    def get_queryset(self):
        return Warehouse.objects.filter(business_unit_id=get_current_tenant_id())
        
    def perform_create(self, serializer):
        serializer.save(business_unit_id=get_current_tenant_id())

class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer
    
    def get_queryset(self):
        return Item.objects.filter(business_unit_id=get_current_tenant_id())
        
    def perform_create(self, serializer):
        serializer.save(business_unit_id=get_current_tenant_id())

class StockLevelViewSet(viewsets.ModelViewSet):
    serializer_class = StockLevelSerializer
    
    def get_queryset(self):
        return StockLevel.objects.filter(business_unit_id=get_current_tenant_id())
        
    @action(detail=False, methods=['post'])
    def adjust(self, request):
        data = request.data
        tenant_id = get_current_tenant_id()
        stock = InventoryService.adjust_stock(
            business_unit_id=tenant_id,
            item_id=data['item_id'],
            warehouse_id=data['warehouse_id'],
            quantity_change=data['quantity_change'],
            reason=data.get('reason', 'MANUAL_ADJUSTMENT'),
            batch_id=data.get('batch_id')
        )
        return Response({'status': 'success', 'new_quantity': stock.quantity})
""",

    # ---------------- POS ---------------- #
    "pos/services/__init__.py": """from .pos_service import POSService\n""",
    "pos/services/pos_service.py": """from django.db import transaction
from django.utils import timezone
from apps.pos.models.pos_session_model import POSSession, POSTransaction, CashDrawerTransaction
from rest_framework.exceptions import ValidationError

class POSService:
    @staticmethod
    def open_session(business_unit_id, user_id, terminal_id, opening_balance):
        if POSSession.objects.filter(terminal_id=terminal_id, status='OPEN').exists():
            raise ValidationError("Terminal already has an open session.")
            
        session = POSSession.objects.create(
            business_unit_id=business_unit_id,
            terminal_id=terminal_id,
            cashier_id=user_id,
            opening_balance=opening_balance,
            status='OPEN',
            opened_at=timezone.now()
        )
        return session

    @staticmethod
    def close_session(business_unit_id, session_id, closing_balance):
        session = POSSession.objects.get(id=session_id, business_unit_id=business_unit_id)
        if session.status != 'OPEN':
            raise ValidationError("Session is already closed.")
            
        session.closing_balance = closing_balance
        session.status = 'CLOSED'
        session.closed_at = timezone.now()
        
        expected = session.opening_balance + session.total_cash
        session.variance = closing_balance - expected
        session.save()
        return session
""",
    "pos/api/serializers.py": """from rest_framework import serializers
from apps.pos.models.pos_session_model import POSSession

class POSSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSSession
        fields = '__all__'
        read_only_fields = ['business_unit_id', 'opened_at', 'closed_at', 'status', 'variance']
""",
    "pos/api/views.py": """from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.pos.models.pos_session_model import POSSession
from .serializers import POSSessionSerializer
from apps.pos.services.pos_service import POSService
from core.tenancy.tenant_context import get_current_tenant_id

class POSSessionViewSet(viewsets.ModelViewSet):
    serializer_class = POSSessionSerializer
    
    def get_queryset(self):
        return POSSession.objects.filter(business_unit_id=get_current_tenant_id())
        
    @action(detail=False, methods=['post'])
    def open_session(self, request):
        session = POSService.open_session(
            business_unit_id=get_current_tenant_id(),
            user_id=request.user.id,
            terminal_id=request.data['terminal_id'],
            opening_balance=request.data.get('opening_balance', 0)
        )
        return Response({'status': 'opened', 'session_id': session.id})
        
    @action(detail=True, methods=['post'])
    def close_session(self, request, pk=None):
        session = POSService.close_session(
            business_unit_id=get_current_tenant_id(),
            session_id=pk,
            closing_balance=request.data.get('closing_balance', 0)
        )
        return Response({'status': 'closed', 'variance': session.variance})
""",

    # ---------------- BATCH TRACKING ---------------- #
    "batch_tracking/services/__init__.py": """from .batch_service import BatchService\n""",
    "batch_tracking/services/batch_service.py": """from django.db import transaction
from apps.batch_tracking.models.batch_model import Batch
from apps.batch_tracking.models.batch_trace_model import BatchTrace
from rest_framework.exceptions import ValidationError

class BatchService:
    @staticmethod
    @transaction.atomic
    def register_batch(business_unit_id, item_id, batch_number, mfg_date, exp_date, supplier_id=None):
        batch, created = Batch.objects.get_or_create(
            business_unit_id=business_unit_id,
            item_id=item_id,
            batch_number=batch_number,
            defaults={
                'manufacturing_date': mfg_date,
                'expiry_date': exp_date,
                'supplier_id': supplier_id
            }
        )
        return batch

    @staticmethod
    def trace_batch_movement(business_unit_id, batch_id, source, destination, quantity, reference_type, reference_id):
        return BatchTrace.objects.create(
            business_unit_id=business_unit_id,
            batch_id=batch_id,
            source_location=source,
            destination_location=destination,
            quantity=quantity,
            reference_type=reference_type,
            reference_id=reference_id
        )
""",
    "batch_tracking/api/serializers.py": """from rest_framework import serializers
from apps.batch_tracking.models.batch_model import Batch

class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ['business_unit_id']
""",
    "batch_tracking/api/views.py": """from rest_framework import viewsets
from apps.batch_tracking.models.batch_model import Batch
from .serializers import BatchSerializer
from core.tenancy.tenant_context import get_current_tenant_id

class BatchViewSet(viewsets.ModelViewSet):
    serializer_class = BatchSerializer
    
    def get_queryset(self):
        return Batch.objects.filter(business_unit_id=get_current_tenant_id())
""",

    # ---------------- STOCK TRANSFER ---------------- #
    "stock_transfer/services/__init__.py": """from .transfer_service import StockTransferService\n""",
    "stock_transfer/services/transfer_service.py": """from django.db import transaction
from apps.stock_transfer.models.transfer_request_model import TransferRequest, TransferItem
from apps.inventory.services.inventory_service import InventoryService
from rest_framework.exceptions import ValidationError

class StockTransferService:
    @staticmethod
    @transaction.atomic
    def process_transfer(business_unit_id, transfer_request_id):
        transfer = TransferRequest.objects.get(id=transfer_request_id, business_unit_id=business_unit_id)
        if transfer.status != 'PENDING':
            raise ValidationError("Only pending transfers can be processed.")
            
        for item in transfer.items.all():
            InventoryService.adjust_stock(
                business_unit_id=business_unit_id,
                item_id=item.item_id,
                warehouse_id=transfer.source_warehouse_id,
                quantity_change=-item.quantity,
                reason='TRANSFER_OUT',
                reference_id=str(transfer.id)
            )
            InventoryService.adjust_stock(
                business_unit_id=business_unit_id,
                item_id=item.item_id,
                warehouse_id=transfer.destination_warehouse_id,
                quantity_change=item.quantity,
                reason='TRANSFER_IN',
                reference_id=str(transfer.id)
            )
            
        transfer.status = 'COMPLETED'
        transfer.save()
        return transfer
""",
    "stock_transfer/api/serializers.py": """from rest_framework import serializers
from apps.stock_transfer.models.transfer_request_model import TransferRequest

class TransferRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransferRequest
        fields = '__all__'
        read_only_fields = ['business_unit_id', 'status']
""",
    "stock_transfer/api/views.py": """from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.stock_transfer.models.transfer_request_model import TransferRequest
from .serializers import TransferRequestSerializer
from apps.stock_transfer.services.transfer_service import StockTransferService
from core.tenancy.tenant_context import get_current_tenant_id

class TransferRequestViewSet(viewsets.ModelViewSet):
    serializer_class = TransferRequestSerializer
    
    def get_queryset(self):
        return TransferRequest.objects.filter(business_unit_id=get_current_tenant_id())
        
    def perform_create(self, serializer):
        serializer.save(business_unit_id=get_current_tenant_id(), status='PENDING')

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        transfer = StockTransferService.process_transfer(get_current_tenant_id(), pk)
        return Response({'status': transfer.status})
""",

    # ---------------- VENDOR MANAGEMENT ---------------- #
    "vendor_management/services/__init__.py": """from .vendor_service import VendorService\n""",
    "vendor_management/services/vendor_service.py": """from django.db import transaction
from apps.vendor_management.models.purchase_order_model import PurchaseOrder
from apps.vendor_management.models.grn_model import GoodsReceiptNote, GoodsReceiptNoteItem
from apps.inventory.services.inventory_service import InventoryService
from rest_framework.exceptions import ValidationError

class VendorService:
    @staticmethod
    @transaction.atomic
    def receive_grn(business_unit_id, po_id, items_received, warehouse_id, grn_number):
        po = PurchaseOrder.objects.get(id=po_id, business_unit_id=business_unit_id)
        
        grn = GoodsReceiptNote.objects.create(
            business_unit_id=business_unit_id,
            purchase_order=po,
            grn_number=grn_number,
        )
        
        for item_data in items_received:
            GoodsReceiptNoteItem.objects.create(
                business_unit_id=business_unit_id,
                grn=grn,
                item_code=item_data['item_code'],
                received_quantity=item_data['received_quantity'],
                accepted_quantity=item_data['accepted_quantity']
            )
            
            # Increase stock
            InventoryService.adjust_stock(
                business_unit_id=business_unit_id,
                item_id=item_data['item_id'],
                warehouse_id=warehouse_id,
                quantity_change=item_data['accepted_quantity'],
                reason='GRN',
                reference_id=str(grn.id)
            )
            
        po.status = 'PARTIAL'
        po.save()
        return grn
""",
    "vendor_management/api/serializers.py": """from rest_framework import serializers
from apps.vendor_management.models.vendor_model import Vendor
from apps.vendor_management.models.purchase_order_model import PurchaseOrder
from apps.vendor_management.models.grn_model import GoodsReceiptNote

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ['business_unit_id']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ['business_unit_id']

class GRNSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoodsReceiptNote
        fields = '__all__'
        read_only_fields = ['business_unit_id']
""",
    "vendor_management/api/views.py": """from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.vendor_management.models.vendor_model import Vendor
from apps.vendor_management.models.purchase_order_model import PurchaseOrder
from apps.vendor_management.models.grn_model import GoodsReceiptNote
from .serializers import VendorSerializer, PurchaseOrderSerializer, GRNSerializer
from apps.vendor_management.services.vendor_service import VendorService
from core.tenancy.tenant_context import get_current_tenant_id

class VendorViewSet(viewsets.ModelViewSet):
    serializer_class = VendorSerializer
    
    def get_queryset(self):
        return Vendor.objects.filter(business_unit_id=get_current_tenant_id())
        
    def perform_create(self, serializer):
        serializer.save(business_unit_id=get_current_tenant_id())

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    
    def get_queryset(self):
        return PurchaseOrder.objects.filter(business_unit_id=get_current_tenant_id())
        
    def perform_create(self, serializer):
        serializer.save(business_unit_id=get_current_tenant_id())

    @action(detail=True, methods=['post'])
    def receive_grn(self, request, pk=None):
        grn = VendorService.receive_grn(
            business_unit_id=get_current_tenant_id(),
            po_id=pk,
            items_received=request.data['items'],
            warehouse_id=request.data['warehouse_id'],
            grn_number=request.data['grn_number']
        )
        return Response({'status': 'received', 'grn_id': grn.id})

class GRNViewSet(viewsets.ModelViewSet):
    serializer_class = GRNSerializer
    
    def get_queryset(self):
        return GoodsReceiptNote.objects.filter(business_unit_id=get_current_tenant_id())
""",
}

import traceback

for rel_path, content in files_to_write.items():
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Done writing logic files.")
