<!-- yss_orbit\rulebooks\B11 - SECURE FILE & MEDIA HANDLING (UPLOADS, STORAGE, ACCESS).md -->
# B11 - SECURE FILE & MEDIA HANDLING (UPLOADS, STORAGE, ACCESS)

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant), B09 (Data Security), B10 (ORM & Queries)
**Governance Role:** File Security Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | File upload validation, storage architecture, signed URL governance, file access authorization, malware scanning, file naming standards, cloud storage requirements, tenant-scoped file isolation |
| REFERENCES | B01 (file handling law §5.26), B02 (tenant isolation for files), B07 (RBAC for file access), B09 (encryption), B15 (audit logging for file ops) |
| MUST NOT DUPLICATE | Tenant isolation mechanics (B02), encryption standards (B09), RBAC enforcement (B07) |

---

## 1. PURPOSE

This rulebook defines **secure file and media handling standards** for YSS Orbit.

It establishes:
- File upload security and validation
- Storage architecture requirements
- File access control and authorization
- Signed URL governance
- Tenant-scoped file isolation

All file operations MUST follow these rules.

---

## 2. SCOPE

Applies to: file uploads (images, documents, media), file storage systems (cloud/S3), file access and downloads, file processing. No file operation is exempt.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 File Validation Before Storage (MANDATORY)

All uploaded files MUST be validated BEFORE storage:
- File type (MIME type + extension - both must match)
- File size (enforce maximum)
- Content inspection where applicable (magic bytes check)

Unvalidated file uploads are PROHIBITED.

Allowed file types MUST use a whitelist approach:
- Only explicitly allowed file types are permitted
- Blacklist-only validation is PROHIBITED
- Executable file uploads (`.exe`, `.sh`, `.py`, `.js`, `.php`, `.bat`, `.cmd`) are PROHIBITED

### 3.2 File Size Limits (MANDATORY)

- Maximum file size MUST be enforced per file type and endpoint
- Oversized uploads MUST be rejected before reaching storage
- Size limits MUST be configurable per environment

### 3.3 File Naming (MANDATORY)

- Original client-provided filenames MUST NOT be used for storage
- Files MUST be renamed using UUID-based names before storage
- Predictable file paths are PROHIBITED
- Internal filesystem, bucket, or infrastructure structure MUST NOT be exposed in file paths

### 3.4 Storage Location (MANDATORY)

- Files MUST be stored outside the application codebase
- Direct storage in project directories is PROHIBITED
- Cloud/object storage (e.g., AWS S3 or equivalent) MUST be used in production
- Django's default local `FileSystemStorage` in production is STRICTLY PROHIBITED
- A cloud storage backend (e.g., `django-storages` with AWS S3) is REQUIRED

### 3.5 Tenant Isolation for Files (MANDATORY)

- All tenant-owned files MUST be associated with `business_unit_id` in file metadata records
- File storage paths MUST be organized to prevent cross-tenant access (e.g., `{business_unit_id}/{uuid}.ext`)
- Cross-tenant file access is PROHIBITED
- Signed URLs MUST validate tenant ownership BEFORE generation
- File metadata database records MUST include `business_unit_id` (NOT NULL for tenant-owned files)

**Violation:** Cross-tenant file access = CRITICAL security breach.

### 3.6 File Access Control (MANDATORY)

- Private files MUST require authentication before access
- File access MUST verify RBAC permissions (B07)
- File ownership MUST be validated before download, preview, or signed URL generation
- Public access to files is PROHIBITED unless the file is explicitly classified as public
- Direct access to storage paths (raw S3 URLs) for private files is PROHIBITED

### 3.7 Signed URL Access (MANDATORY)

Private file access MUST use signed URLs:
- Signed URLs MUST be time-limited (maximum 1 hour for standard access)
- Signed URLs MUST be single-purpose
- Signed URL generation MUST validate:
  - User is authenticated
  - User has RBAC permission to access the file
  - File belongs to the user's allowed BusinessUnit(s)
- Cross-tenant signed URL generation is PROHIBITED

### 3.8 Malware Scanning (MANDATORY)

- Uploaded files MUST be scanned for malware in production workflows
- Infected or suspicious files MUST be rejected and quarantined
- Scan results MUST be logged

### 3.9 File Metadata Handling (MANDATORY)

- File metadata (name, size, type, path, `business_unit_id`, `uploaded_by`, timestamps) MUST be stored in the database
- File binaries MUST NOT be stored in the database
- Sensitive metadata MUST NOT be exposed in API responses

### 3.10 File Processing Safety (MANDATORY)

- File processing (image resizing, document conversion) MUST be sandboxed
- File processing MUST occur in background tasks - not in the request lifecycle
- Processing MUST validate file integrity before processing
- Unsafe file processing that could expose system resources is PROHIBITED

### 3.11 File Deletion Governance (MANDATORY)

- File deletion MUST respect audit, retention, and compliance rules
- Physical deletion of files MUST be deferred until after the retention period
- Soft-deletion of file metadata records is REQUIRED
- File deletion MUST be audit-logged

### 3.12 Logging (MANDATORY)

All file operations MUST be logged:
- Upload (file_id, user_id, business_unit_id, file_type, size, trace_id)
- Download / access (file_id, user_id, business_unit_id, trace_id)
- Deletion (file_id, user_id, business_unit_id, trace_id)
- Failed access attempts (file_id, user_id, attempted_bu_id, trace_id)

---

### 3.13 File Lifecycle Policy (MANDATORY)

All stored files MUST have a declared lifecycle policy. Files without a policy MUST be treated as temporary and purged after 90 days.

The `file_asset` table MUST include:
- `lifecycle_policy VARCHAR(30)` - ENUM: 'temporary' | 'standard' | 'long_term' | 'permanent' | 'legal_hold'
- `expires_at TIMESTAMPTZ` - NULL = no auto-expiry
- `archived_at TIMESTAMPTZ`
- `purge_after TIMESTAMPTZ`

| Policy | Auto-Expiry | Use Cases |
|--------|------------|-----------|
| `temporary` | 90 days | Upload previews, temp exports, draft attachments |
| `standard` | 2 years | Routine documents, attendance photos, profile pics |
| `long_term` | 7 years | Payroll documents, contracts, statutory records |
| `permanent` | Never purged | Audit-grade records, compliance documents |
| `legal_hold` | No purge until hold released | Court orders, regulatory investigations |

### 3.14 Storage Quota Governance (MANDATORY)

Each BusinessUnit MUST have a storage quota based on their subscription plan (FREE: 5GB, BASIC: 25GB, PRO: 100GB, ENTERPRISE: unlimited). Storage quota MUST be checked BEFORE upload. If current usage + upload size exceeds quota, a `StorageQuotaExceeded` exception MUST be raised. The `business_units` table MUST track `storage_used_bytes BIGINT NOT NULL DEFAULT 0` and MUST be updated atomically after each successful upload.

### 3.15 Virus Scanning (MANDATORY)

All uploaded files MUST be scanned for viruses/malware before being served to any user. Files MUST be in a quarantine state until the scan completes. Scan results MUST be stored in the file record (`scan_status`, `scan_completed_at`). Infected files MUST be quarantined and monitoring MUST be alerted. Supported scanning approaches: ClamAV (self-hosted) or AWS S3 + Lambda-based scanning (recommended for production).

**Files MUST NOT be served until `scan_status = 'clean'`.**

### 3.16 Archival & Retention Automation (MANDATORY)

Two scheduled background tasks MUST run daily:

1. `archive_expired_files` - Moves files past their lifecycle policy to cold storage. Does NOT delete - moves to archive tier for cost reduction. Covers `standard` policy files (2-year threshold) and `long_term` policy files (7-year threshold).

2. `purge_temporary_files` - Hard-deletes `temporary` lifecycle policy files past their `expires_at` timestamp. Marks `is_deleted = True` and `deleted_at` timestamp. Removes from storage backend.

`permanent` and `legal_hold` files MUST NEVER be automatically purged.


## 4. SECURITY & COMPLIANCE

- All uploaded files MUST be treated as untrusted input
- Malicious file execution MUST be prevented
- Unauthorized file access is a CRITICAL violation
- File storage MUST be secured - public exposure of private files is PROHIBITED

---

## 5. NON-NEGOTIABLE RULES

- Unvalidated file upload = PROHIBITED
- Executable file upload = PROHIBITED
- Local file storage in production = PROHIBITED
- Cross-tenant file access = CRITICAL violation
- Signed URL without tenant validation = CRITICAL violation
- Raw S3 URL exposure for private files = PROHIBITED
- File binaries in database = PROHIBITED
- File served before virus scan completes = PROHIBITED (CRITICAL)
- File without lifecycle_policy declaration = PROHIBITED
- Storage quota not enforced = PROHIBITED

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject changes |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- File type validation MUST be tested (whitelist enforcement)
- File size limits MUST be tested
- Malware detection MUST be tested
- Access control MUST be tested (authentication + RBAC + tenant)
- Signed URL expiration MUST be tested
- Signed URL tenant validation MUST be tested
- Cross-tenant file access MUST be rejected in tests
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- Files MUST be validated, named with UUIDs, and stored in cloud storage
- All tenant-owned files MUST have `business_unit_id` in metadata
- Private file access MUST use signed URLs with tenant validation
- Cross-tenant file access is PROHIBITED
- Malware scanning REQUIRED in production

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
