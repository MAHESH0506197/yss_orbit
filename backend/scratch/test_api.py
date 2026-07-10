import requests

url = "http://localhost:5173/api/v1/organizations/4a4b9bec-3707-41eb-8969-72ef9c29dad0/"
# Actually the frontend is running on 5174, let's just make the request directly to django on 8000
url = "http://localhost:8000/api/v1/organizations/4a4b9bec-3707-41eb-8969-72ef9c29dad0/"

payload = {
    "name": "Paynex",
    "is_active": False,
    "logo_url": "/media/org_logos/4a4b9bec-3707-41eb-8969-72ef9c29dad0/8487697499634b06a50a956fa8cd2aa5.jpeg",
    "owner_id": None,
    "business_domain_id": "c4b35839-1b41-48c2-bf21-b6667ef8ffec",
    "email": "yesubabu@paynex.com",
    "phone": "9876987698",
    "headquarters_address_1": "Chintal",
    "headquarters_address_2": "Road no: 05",
    "city": "Hyderabad",
    "state": "Telangana",
    "country": "India",
    "postal_code": "500054",
    "timezone": "Asia/Kolkata",
    "currency_code": "INR",
    "reason": "status changed to inactive"
}

# We need authentication.
# I can instead just log the validation errors to a file inside the view!
