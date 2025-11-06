#!/bin/bash

# Script to setup Git Deploy Key for Private Repository
# Usage: ./setup-git-deploy-key.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Git Deploy Key for Private Repository${NC}"
echo ""

# Get repository URL
read -p "Enter your Git repository URL (e.g., git@github.com:username/repo.git): " REPO_URL

# Extract hostname from repo URL
if [[ $REPO_URL == git@* ]]; then
    HOSTNAME=$(echo $REPO_URL | sed -E 's/git@([^:]+):.*/\1/')
elif [[ $REPO_URL == https://* ]]; then
    HOSTNAME=$(echo $REPO_URL | sed -E 's|https://([^/]+)/.*|\1|')
else
    echo -e "${RED}Invalid repository URL format${NC}"
    exit 1
fi

# Generate deploy key
KEY_NAME="deploy_key_$(date +%s)"
KEY_PATH="$HOME/.ssh/$KEY_NAME"

echo -e "${YELLOW}Generating SSH key...${NC}"
ssh-keygen -t ed25519 -C "deploy-key-$(hostname)" -f "$KEY_PATH" -N ""

# Display public key
echo ""
echo -e "${GREEN}Public key generated. Add this to your repository:${NC}"
echo -e "${YELLOW}========================================${NC}"
cat "${KEY_PATH}.pub"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Instructions for different Git providers
echo -e "${GREEN}Add this key to your repository:${NC}"
echo ""
echo -e "${YELLOW}GitHub:${NC}"
echo "  1. Go to: Repository Settings > Deploy keys > Add deploy key"
echo "  2. Paste the key above"
echo "  3. Give it a title (e.g., 'Production Server')"
echo "  4. Check 'Allow write access' if needed (usually not required)"
echo ""
echo -e "${YELLOW}GitLab:${NC}"
echo "  1. Go to: Repository Settings > Repository > Deploy Keys"
echo "  2. Paste the key above"
echo "  3. Give it a title"
echo ""
echo -e "${YELLOW}Bitbucket:${NC}"
echo "  1. Go to: Repository Settings > Access keys"
echo "  2. Paste the key above"
echo "  3. Give it a label"
echo ""

read -p "Press Enter after you've added the key to your repository..."

# Configure SSH
SSH_CONFIG="$HOME/.ssh/config"

# Create SSH config if it doesn't exist
if [ ! -f "$SSH_CONFIG" ]; then
    touch "$SSH_CONFIG"
    chmod 600 "$SSH_CONFIG"
fi

# Add configuration for this host
if ! grep -q "Host $HOSTNAME" "$SSH_CONFIG"; then
    cat >> "$SSH_CONFIG" << EOF

# Deploy key for $REPO_URL
Host $HOSTNAME
    HostName $HOSTNAME
    User git
    IdentityFile $KEY_PATH
    IdentitiesOnly yes
EOF
    echo -e "${GREEN}SSH config updated${NC}"
else
    echo -e "${YELLOW}SSH config already contains entry for $HOSTNAME${NC}"
fi

# Set correct permissions
chmod 600 "$SSH_CONFIG"
chmod 600 "$KEY_PATH"
chmod 644 "${KEY_PATH}.pub"

# Test connection
echo ""
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ssh -T -o StrictHostKeyChecking=no git@$HOSTNAME 2>&1 | grep -q "successfully authenticated\|You've successfully authenticated"; then
    echo -e "${GREEN}✓ SSH connection successful!${NC}"
else
    echo -e "${YELLOW}⚠ Connection test completed (some providers don't return success message)${NC}"
fi

echo ""
echo -e "${GREEN}Deploy key setup complete!${NC}"
echo ""
echo -e "You can now clone your repository with:"
echo -e "${YELLOW}git clone $REPO_URL${NC}"
echo ""

