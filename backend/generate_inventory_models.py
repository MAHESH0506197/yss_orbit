import os

models_dir = 'apps/inventory/models'
os.makedirs(models_dir, exist_ok=True)

with open(f'{models_dir}/__init__.py', 'w') as f:
    f.write('''from .category_model import Category
from .item_model import Item
from .vendor_model import Vendor
from .stock_transaction_model import StockTransaction
from .item_batch_model import ItemBatch

__all__ = [
    "Category",
    "Item",
    "Vendor",
    "StockTransaction",
    "ItemBatch",
]
''')

with open(f'{models_dir}/category_model.py', 'w') as f:
    f.write('''from django.db import models
from apps.platform.models.base import TenantModel

class Category(TenantModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.CASCADE, related_name='subcategories'
    )
    level = models.IntegerField(default=0)
    path = models.CharField(max_length=1000, blank=True, default="")

    class Meta(TenantModel.Meta):
        db_table = "inventory_categories"
        constraints = [
            models.UniqueConstraint(
                fields=["business_unit_id", "name", "parent"],
                name="unique_category_name_per_parent",
            )
        ]

    def __str__(self) -> str:
        return self.name
''')

with open(f'{models_dir}/item_model.py', 'w') as f:
    f.write('''from django.db import models
from apps.platform.models.base import TenantModel
from .category_model import Category

class Item(TenantModel):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, default="")
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="items")
    
    # Financial/Tax
    hsn_code = models.CharField(max_length=20, blank=True, default="")
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    # Inventory Tracking
    unit = models.CharField(max_length=50, default="pcs")
    stock_quantity = models.DecimalField(max_digits=15, decimal_places=4, default=0.0000)
    reorder_level = models.DecimalField(max_digits=15, decimal_places=4, default=0.0000)
    
    # Flags
    batch_tracking_enabled = models.BooleanField(default=False)
    expiry_tracking_enabled = models.BooleanField(default=False)

    class Meta(TenantModel.Meta):
        db_table = "inventory_items"
        constraints = [
            models.UniqueConstraint(
                fields=["business_unit_id", "sku"],
                name="unique_sku_per_bu",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.sku})"
''')

with open(f'{models_dir}/vendor_model.py', 'w') as f:
    f.write('''from django.db import models
from apps.platform.models.base import TenantModel

class Vendor(TenantModel):
    name = models.CharField(max_length=255)
    gstin = models.CharField(max_length=15, blank=True, default="")
    address = models.TextField(blank=True, default="")
    contact_person = models.CharField(max_length=255, blank=True, default="")
    contact_number = models.CharField(max_length=50, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    
    # Payment Terms
    payment_terms = models.CharField(max_length=100, blank=True, default="")
    credit_days = models.IntegerField(default=0)
    
    # Bank Details
    bank_name = models.CharField(max_length=255, blank=True, default="")
    bank_account_number = models.CharField(max_length=50, blank=True, default="")
    bank_ifsc = models.CharField(max_length=20, blank=True, default="")

    class Meta(TenantModel.Meta):
        db_table = "inventory_vendors"

    def __str__(self) -> str:
        return self.name
''')

with open(f'{models_dir}/stock_transaction_model.py', 'w') as f:
    f.write('''from django.db import models
from apps.platform.models.base import TenantModel
from .item_model import Item

class TransactionType(models.TextChoices):
    PURCHASE_RECEIPT = "PURCHASE_RECEIPT", "Purchase Receipt"
    SALE = "SALE", "Sale"
    ADJUSTMENT = "ADJUSTMENT", "Adjustment"
    TRANSFER_IN = "TRANSFER_IN", "Transfer In"
    TRANSFER_OUT = "TRANSFER_OUT", "Transfer Out"
    RETURN = "RETURN", "Return"

class StockTransaction(TenantModel):
    item = models.ForeignKey(Item, on_delete=models.RESTRICT, related_name="transactions")
    transaction_type = models.CharField(max_length=50, choices=TransactionType.choices)
    quantity = models.DecimalField(max_digits=15, decimal_places=4)
    reference_id = models.CharField(max_length=100, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    
    class Meta(TenantModel.Meta):
        db_table = "inventory_stock_transactions"

    def __str__(self) -> str:
        return f"{self.transaction_type} - {self.item.name}: {self.quantity}"
''')

with open(f'{models_dir}/item_batch_model.py', 'w') as f:
    f.write('''from django.db import models
from apps.platform.models.base import TenantModel
from .item_model import Item
from .vendor_model import Vendor

class ItemBatch(TenantModel):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="batches")
    vendor = models.ForeignKey(Vendor, null=True, blank=True, on_delete=models.SET_NULL)
    batch_no = models.CharField(max_length=100)
    supplier_batch = models.CharField(max_length=100, blank=True, default="")
    mfg_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    remaining_qty = models.DecimalField(max_digits=15, decimal_places=4, default=0.0000)

    class Meta(TenantModel.Meta):
        db_table = "inventory_item_batches"
        constraints = [
            models.UniqueConstraint(
                fields=["business_unit_id", "item", "batch_no"],
                name="unique_batch_per_item_bu",
            )
        ]

    def __str__(self) -> str:
        return f"{self.item.name} - Batch {self.batch_no}"
''')
