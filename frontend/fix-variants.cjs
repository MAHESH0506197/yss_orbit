const fs = require('fs');

const files = [
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\hrmsCore\\pages\\DepartmentPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\hrmsCore\\pages\\DesignationPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\hrmsCore\\pages\\EmployeeCreatePage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\hrmsCore\\pages\\EmployeeEditPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\hrmsCore\\pages\\hrmsCoreListPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\inventory\\pages\\InventoryAdjustmentPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\inventory\\pages\\InventoryBatchPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\inventory\\pages\\InventoryReorderPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\inventory\\pages\\inventoryListPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\pharmacyBilling\\pages\\InsurancePage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\pharmacyBilling\\pages\\PrescriptionPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\pharmacyBilling\\pages\\pharmacyBillingListPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\retailBilling\\pages\\CreditNotePage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\retailBilling\\pages\\InvoicePage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\retailBilling\\pages\\PaymentPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\retailBilling\\pages\\retailBillingDetailPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\retailBilling\\pages\\retailBillingListPage.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\welcome\\components\\PricingSection.tsx",
  "C:\\PROJECT\\yss_orbit\\frontend\\src\\modules\\hrmsCore\\pages\\EmployeeTerminatePage.tsx"
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    if (content.includes('variant="primary"')) {
      content = content.replace(/variant="primary"/g, 'variant="default"');
      changed = true;
    }
    if (content.includes('variant="danger"')) {
      content = content.replace(/variant="danger"/g, 'variant="destructive"');
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
});
