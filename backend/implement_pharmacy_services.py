# yss_orbit\backend\implement_pharmacy_services.py
import os

BASE_DIR = r"c:\PROJECT\yss_orbit\backend\apps"

services_to_write = {
    # ---------------- DRUG REGISTER ---------------- #
    "drug_register/services/__init__.py": """from .drug_register_service import DrugRegisterService\n""",
    "drug_register/services/drug_register_service.py": """from apps.drug_register.models.drug_model import Drug, DrugCategory

class DrugRegisterService:
    @staticmethod
    def create_drug(data, tenant):
        return Drug.objects.create(tenant=tenant, **data)
        
    @staticmethod
    def deactivate_drug(drug_id):
        drug = Drug.objects.get(id=drug_id)
        drug.is_active = False
        drug.save()
        return drug
""",

    # ---------------- EXPIRY TRACKING ---------------- #
    "expiry_tracking/services/__init__.py": """from .expiry_tracking_service import ExpiryTrackingService\n""",
    "expiry_tracking/services/expiry_tracking_service.py": """from datetime import date, timedelta
from apps.expiry_tracking.models.expiry_model import DrugBatch, ExpiryAlert

class ExpiryTrackingService:
    @staticmethod
    def add_batch(drug_id, batch_number, mfg_date, exp_date, quantity, location, tenant):
        batch = DrugBatch.objects.create(
            tenant=tenant,
            drug_id=drug_id,
            batch_number=batch_number,
            manufacturing_date=mfg_date,
            expiry_date=exp_date,
            quantity=quantity,
            location=location
        )
        return batch

    @staticmethod
    def check_for_expiring_batches(days_threshold=90):
        threshold_date = date.today() + timedelta(days=days_threshold)
        expiring_batches = DrugBatch.objects.filter(
            expiry_date__lte=threshold_date,
            quantity__gt=0
        )
        
        alerts_created = []
        for batch in expiring_batches:
            days_to_expiry = (batch.expiry_date - date.today()).days
            alert, created = ExpiryAlert.objects.get_or_create(
                batch=batch,
                is_resolved=False,
                defaults={'days_to_expiry': days_to_expiry, 'tenant': batch.tenant}
            )
            if created:
                alerts_created.append(alert)
            else:
                alert.days_to_expiry = days_to_expiry
                alert.save()
                
        return alerts_created
""",

    # ---------------- PHARMACY ---------------- #
    "pharmacy/services/__init__.py": """from .pharmacy_service import PharmacyService\n""",
    "pharmacy/services/pharmacy_service.py": """from django.db import transaction
from apps.pharmacy.models.pharmacy_model import Prescription, PrescriptionItem, Dispense, DispenseItem
from apps.expiry_tracking.models.expiry_model import DrugBatch
from rest_framework.exceptions import ValidationError

class PharmacyService:
    @staticmethod
    @transaction.atomic
    def dispense_prescription(prescription_id, dispense_data, tenant):
        prescription = Prescription.objects.get(id=prescription_id)
        
        dispense = Dispense.objects.create(
            tenant=tenant,
            prescription=prescription,
            status='DISPENSED'
        )
        
        for item_data in dispense_data:
            batch = DrugBatch.objects.select_for_update().get(id=item_data['batch_id'])
            quantity_needed = item_data['quantity']
            
            if batch.quantity < quantity_needed:
                raise ValidationError(f"Insufficient quantity in batch {batch.batch_number}")
                
            batch.quantity -= quantity_needed
            batch.save()
            
            DispenseItem.objects.create(
                tenant=tenant,
                dispense=dispense,
                batch=batch,
                quantity=quantity_needed
            )
            
        return dispense
""",

    # ---------------- PHARMACY BILLING ---------------- #
    "pharmacy_billing/services/__init__.py": """from .billing_service import PharmacyBillingService\n""",
    "pharmacy_billing/services/billing_service.py": """from django.db import transaction
from apps.pharmacy_billing.models.billing_model import PharmacyInvoice, PharmacyInvoiceItem
from apps.pharmacy.models.pharmacy_model import Dispense

class PharmacyBillingService:
    @staticmethod
    @transaction.atomic
    def generate_invoice(dispense_id, item_prices, discount=0.0, tenant=None):
        dispense = Dispense.objects.prefetch_related('items').get(id=dispense_id)
        
        total_amount = 0
        invoice_items_data = []
        
        for disp_item in dispense.items.all():
            unit_price = item_prices.get(disp_item.id, 0.0)
            item_total = float(unit_price) * disp_item.quantity
            total_amount += item_total
            invoice_items_data.append({
                'dispense_item': disp_item,
                'unit_price': unit_price,
                'total': item_total
            })
            
        net_amount = total_amount - float(discount)
        
        invoice = PharmacyInvoice.objects.create(
            tenant=tenant or dispense.tenant,
            dispense=dispense,
            patient_id=dispense.prescription.patient_id if dispense.prescription else 'Walk-in',
            total_amount=total_amount,
            discount=discount,
            net_amount=net_amount,
            status='PENDING'
        )
        
        for data in invoice_items_data:
            PharmacyInvoiceItem.objects.create(
                tenant=invoice.tenant,
                invoice=invoice,
                dispense_item=data['dispense_item'],
                unit_price=data['unit_price'],
                total=data['total']
            )
            
        return invoice
        
    @staticmethod
    def mark_invoice_as_paid(invoice_id):
        invoice = PharmacyInvoice.objects.get(id=invoice_id)
        invoice.status = 'PAID'
        invoice.save()
        return invoice
"""
}

for rel_path, content in services_to_write.items():
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
print("Done writing services.")
