from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

class IsNotSelfEdit(permissions.BasePermission):
    """
    Prevents a user from modifying a record if they are the target employee of that record.
    Used for appraisals, employee records, and reviews to prevent self-approval/self-edit of sensitive data.
    """
    
    def has_object_permission(self, request, view, obj):
        # Safe methods (GET, HEAD, OPTIONS) are always allowed.
        if request.method in permissions.SAFE_METHODS:
            return True
            
        effective_user_id = getattr(request.security_context, 'effective_user_id', request.user.id)
            
        # If the object is an Employee
        if hasattr(obj, 'user_id'):
            if obj.user_id == effective_user_id:
                raise PermissionDenied("You cannot modify your own core employee record or salary.")
        elif hasattr(obj, 'id') and obj.__class__.__name__ == 'Employee':
            if obj.id == effective_user_id:
                raise PermissionDenied("You cannot modify your own core employee record or salary.")
                
        # If the object has an employee_id (LeaveRequest, Appraisal, Review)
        if hasattr(obj, 'employee_id'):
            if obj.employee_id == effective_user_id:
                # Allow creating/updating Drafts or self-reviews, but block finalization/approvals.
                # Since we block this at the service level for leaves, here we specifically target Appraisals/Reviews.
                
                if obj.__class__.__name__ == 'Appraisal':
                    # Allow self-update only if it's a specific self-review payload, otherwise block
                    # For strict SaaS governance, any manager-level update to an appraisal is blocked for self.
                    if request.data.get('status') in ['MANAGER_REVIEW', 'COMPLETED', 'FINALIZED']:
                        raise PermissionDenied("You cannot finalize or approve your own appraisal.")
                        
                if obj.__class__.__name__ == 'Review':
                    # Block creating/updating a manager review for yourself
                    if request.data.get('review_type') == 'MANAGER':
                        raise PermissionDenied("You cannot submit a manager review for yourself.")
                        
        return True
