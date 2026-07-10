#!/bin/bash
# yss_orbit\frontend\scripts\validate_module_structure.sh
# Validates that all modules follow the strict architectural structure
# Fails CI if violations are found

echo "Validating module structures..."
VIOLATIONS=0

for domain in src/modules/*/; do
  if [ -d "$domain" ]; then
    for module in "$domain"*/; do
      if [ -d "$module" ]; then
        # Check for mandatory index.ts
        if [ ! -f "${module}index.ts" ]; then
          echo "VIOLATION: Missing index.ts in $module"
          VIOLATIONS=$((VIOLATIONS+1))
        fi
        # Enforce no direct component imports from other domains (rough check)
        if grep -rq "from '../../" "$module"; then
          echo "WARNING: Potential boundary violation detected in $module"
        fi
      fi
    done
  fi
done

if [ $VIOLATIONS -gt 0 ]; then
  echo "Validation failed with $VIOLATIONS violations."
  exit 1
else
  echo "All modules follow the defined structure."
  exit 0
fi
