#!/bin/bash
# yss_orbit\frontend\scripts\generate_module.sh
# Script to generate a new domain/module structure in the frontend
# Usage: ./generate_module.sh <domain_name> <module_name>

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./generate_module.sh <domain_name> <module_name>"
  exit 1
fi

DOMAIN=$1
MODULE=$2
BASE_PATH="src/modules/$DOMAIN/$MODULE"

mkdir -p "$BASE_PATH"/{components,hooks,services,utils,store,pages,types,tests}

# Create index file
cat <<EOF > "$BASE_PATH/index.ts"
export * from './components';
export * from './hooks';
export * from './services';
export * from './utils';
export * from './store';
export * from './pages';
export * from './types';
EOF

echo "Module $MODULE created under domain $DOMAIN at $BASE_PATH"
