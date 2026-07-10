import os
import sys
import django
from decimal import Decimal
import uuid

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from apps.organization.models import BusinessUnit
from apps.inventory.models import Vendor, Item, Category, ItemBatch, StockTransaction
from apps.inventory.services.po_service import PurchaseOrderService
from apps.inventory.services.grn_service import GRNService
from apps.inventory.services.inventory_service import InventoryService
from apps.pos.models.pos_session_model import POSSession
from apps.pos.services.pos_service import POSService
from apps.platform.models.outbox_model import OutboxMessage, OutboxStatus

User = get_user_model()

def run_retail_simulation():
    print("Starting Retail/Inventory E2E Simulation...")

    bu = BusinessUnit.objects.filter(code="BLR01").first()
    if not bu:
        print("BU BLR01 not found. Run seed script first.")
        return

    tenant_id = bu.id
    
    cashier = User.objects.filter(username="cashier_blr1").first()
    if not cashier:
        print("Cashier user not found.")
        return

    vendor = Vendor.objects.filter(business_unit_id=tenant_id).first()
    item = Item.objects.filter(business_unit_id=tenant_id, name__icontains="MacBook").first()

    if not vendor or not item:
        print("Master data (Vendor/Item) not found for BLR Retail.")
        return

    print(f"Using Vendor: {vendor.name}")
    print(f"Using Item: {item.name}")

    # 1. Purchase Order
    print("\n--- 1. Purchase Order ---")
    po_items_data = [
        {"item_id": item.id, "quantity": 100, "unit_price": 120000.00}
    ]
    po = PurchaseOrderService.create_po(tenant_id, vendor.id, po_items_data)
    print(f"Created PO: {po.po_number} for 100 units (Draft)")
    
    PurchaseOrderService.approve_po(tenant_id, po.id)
    print(f"Approved PO: {po.po_number}")

    # 2. GRN (Receive Goods)
    print("\n--- 2. Goods Receipt Note (GRN) ---")
    po_item = po.items.first()
    grn_items_data = [
        {"po_item_id": po_item.id, "received_quantity": 100}
    ]
    grn = GRNService.receive_goods(tenant_id, po.id, grn_items_data)
    print(f"Received Goods: Generated {grn.grn_number}")

    # Process Outbox Event for GRN
    print("Processing Outbox Event (inventory.grn.completed)...")
    grn_msg = OutboxMessage.objects.filter(status=OutboxStatus.PENDING, message_type="inventory.grn.completed").first()
    if grn_msg:
        InventoryService.process_grn_completed_event(grn_msg.payload)
        grn_msg.status = OutboxStatus.PUBLISHED
        grn_msg.save()
        print("Stock updated via Outbox.")
    else:
        print("No GRN Outbox event found!")

    # Check Stock after GRN
    total_stock = sum(b.remaining_qty for b in ItemBatch.objects.filter(business_unit_id=tenant_id, item=item))
    print(f"Current Stock Level for {item.name}: {total_stock}")

    # 3. POS Sale
    print("\n--- 3. Point of Sale (POS) ---")
    session = POSSession.objects.create(
        business_unit_id=tenant_id,
        session_number=f"SESS-{uuid.uuid4().hex[:6]}",
        cashier_id=cashier.id,
        status=POSSession.Status.OPEN
    )
    print(f"Opened POS Session: {session.session_number}")

    sale_items_data = [
        {
            "item_id": str(item.id),
            "name": item.name,
            "quantity": 2,
            "unit_price": 150000.00
        }
    ]
    txn = POSService.complete_sale(tenant_id, session.id, sale_items_data, "CARD")
    print(f"Completed POS Sale: {txn.transaction_number} for 2 units")

    # Process Outbox Event for POS
    print("Processing Outbox Event (pos.sale.completed)...")
    pos_msg = OutboxMessage.objects.filter(status=OutboxStatus.PENDING, message_type="pos.sale.completed").first()
    if pos_msg:
        InventoryService.process_pos_sale_completed_event(pos_msg.payload)
        pos_msg.status = OutboxStatus.PUBLISHED
        pos_msg.save()
        print("Stock deducted via Outbox.")
    else:
        print("No POS Outbox event found!")

    # Final Stock Check
    final_stock = sum(b.remaining_qty for b in ItemBatch.objects.filter(business_unit_id=tenant_id, item=item))
    print(f"\nSUCCESS: Retail Flow Complete! Final Stock Level for {item.name}: {final_stock}")

if __name__ == "__main__":
    run_retail_simulation()
