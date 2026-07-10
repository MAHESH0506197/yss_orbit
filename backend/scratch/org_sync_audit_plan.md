# Goal

Fix data synchronization issues in the Organization and Business Domain modules and implement Audit Trail capturing and visualization.

## Proposed Changes

### Backend Fixes
1. **Business Domain ViewSet**: In `create`, `update`, and `restore` methods, fetch the instance using `self.get_queryset().get(pk=domain.pk)` before serializing the response. This ensures that annotations like `organizations_count` and `business_units_count` are included in the response, keeping the frontend cache synchronized.
2. **Organization ViewSet**: Apply the same fix as above in `create`, `update`, and `restore` to ensure `business_units_count` is included in the response.
3. **Organization Service**: Update `create_org`, `update_org`, `soft_delete_org`, and `restore_org` to accept and save the `reason` parameter (as `created_reason`, `updated_reason`, `deleted_reason`, `restored_reason` respectively).
4. **Organization Serializer**: Ensure `reason` is passed correctly from the view to the service.

### Frontend Fixes
1. **Organization Form**: Include a `reason` input field (optional or required based on action) in the Organization edit/create form.
2. **Organization Hooks**: Update `useOrganizations.ts` to accept `reason` in `update`, `create`, `delete`, and `restore` mutation wrappers.
3. **Audit Trail UI**: Create an `OrganizationAuditTrail` component to display the lifecycle events (`created_at`, `created_by`, `created_reason`, `updated_at`, etc.) for an Organization, and embed it into the `OrganizationDetailPage.tsx` or as a separate tab.

## Verification Plan

### Manual Verification
- Create a new Organization with a reason and verify that the edit form correctly populates all fields.
- Update an Organization and check that the DB saves the `updated_reason`.
- Check the Business Domain list and verify that the counts correctly increment/decrement when an Organization is created or deleted without requiring a hard refresh.
- Check the Organization details page to view the Audit Trail tab/section.
