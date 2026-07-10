# yss_orbit\frontend\fix.py
import os  
f = 'src/modules/pharmacyBilling/components/pharmacyBillingCard.tsx'  
content = open(f).read()  
open(f, 'w').write(content.replace('new Date(bill.createdAt)', 'new Date(bill.createdAt as any)'))  
