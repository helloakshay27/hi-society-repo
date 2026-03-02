#!/bin/bash

# Deploy script with cache busting for Hi Society
# This script ensures clean deployments without cache issues

set -e

echo "🚀 Starting deployment with cache busting..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean old build
echo -e "${YELLOW}📦 Cleaning old build...${NC}"
rm -rf dist/

# Step 2: Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Step 3: List generated files (for verification)
echo -e "${YELLOW}📄 Generated files:${NC}"
ls -lh dist/assets/ | head -20

# Step 4: Upload to server (adjust based on your deployment method)
echo -e "${YELLOW}📤 Deploying to server...${NC}"

# Option 1: Using rsync (uncomment and adjust)
# rsync -avz --delete dist/ user@server:/var/www/fm-matrix/

# Option 2: Using AWS S3 (uncomment and adjust)
# aws s3 sync dist/ s3://your-bucket-name/ --delete --cache-control "public,max-age=31536000,immutable"
# aws s3 cp dist/index.html s3://your-bucket-name/index.html --cache-control "no-cache,no-store,must-revalidate"

# Option 3: Using SCP (uncomment and adjust)
# scp -r dist/* user@server:/var/www/fm-matrix/

echo -e "${GREEN}✅ Deployment preparation complete${NC}"
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "  1. Restart nginx: sudo systemctl restart nginx"
echo "  2. Clear CDN cache if using one"
echo "  3. Test the deployment: curl -I https://your-domain.com/index.html"
echo ""
echo -e "${GREEN}🎉 Done!${NC}"
