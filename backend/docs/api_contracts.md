<!-- yss_orbit\backend\docs\api_contracts.md -->
# API Contracts

All APIs under `/api/v1/` follow the standard Orbit JSON Response structure:
```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```
For errors, `success` is `false` and an `error` object is provided.
