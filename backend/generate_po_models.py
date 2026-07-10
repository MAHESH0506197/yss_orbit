import os

models_dir = 'apps/inventory/models'

with open(f'{models_dir}/purchase_order_item_model.py', 'w') as f:
    f.write('''from django.db import models
from apps.platform.models.base import TenantModel
from .purchase_order_model import PurchaseOrder
from .item_model import Item

class PurchaseOrderItem(TenantModel):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="items")
    item = models.ForeignKey(Item, on_delete=models.RESTRICT)
    quantity = models.DecimalField(max_digits=15, decimal_places=4)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    received_quantity = models.DecimalField(max_digits=15, decimal_places=4, default=0.0000)

    class Meta(TenantModel.Meta):
        db_table = "inventory_po_items"

    def __str__(self) -> str:
        return f"{self.item.name} for PO {self.purchase_order.po_number}"
''')

with open(f'{models_dir}/grn_model.py', 'w') as f:
    f.write('''from django.db import models
from apps.platform.models.base import TenantModel
from .purchase_order_model import PurchaseOrder

class GRN(TenantModel):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.RESTRICT, related_name="grns")
    grn_number = models.CharField(max_length=50)
    received_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True, default="")

    class Meta(TenantModel.Meta):
        db_table = "inventory_grns"

    def __str__(self) -> str:
        return f"GRN {self.grn_number} for PO {self.purchase_order.po_number}"
''')

with open(f'{models_dir}/__init__.py', 'a') as f:
    f.write('''from .purchase_order_model import PurchaseOrder
from .purchase_order_item_model import PurchaseOrderItem
from .grn_model import GRN

__all__.extend([
    "PurchaseOrder",
    "PurchaseOrderItem",
    "GRN",
])
''')
