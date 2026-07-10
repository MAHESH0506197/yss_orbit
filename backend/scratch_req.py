import requests

url = "http://localhost:8000/api/v1/business-units/5d85d51d-f255-47d5-b8e5-eacbdc0a3716/"

payload = {
    "name": "Paynex HQ",
    "code": "BU-PAY-PAYNEXHQ",
    "branding_mode": "platform",
    "is_active": True
}

# we need auth, but let's see what it returns
try:
    # First get a token
    # Let's just create a superuser token or use an existing one
    # Actually we can do it via manage.py shell directly mimicking the request
    pass
except Exception as e:
    pass
