# Deployment Setup

This document explains how to set up automated deployments using GitHub Actions.

## GitHub Secrets Configuration

To enable automatic deployments, you need to add the following secrets to your GitHub repository:

### Required Secrets

1. **SERVER_HOST**
   - Value: `62.84.183.230` or `fleetmanager.co.zw`
   - Description: The IP address or hostname of your production server

2. **SERVER_USER**
   - Value: `root`
   - Description: The SSH user to connect to the server

3. **SSH_PRIVATE_KEY**
   - Value: Your SSH private key
   - Description: The private key for SSH authentication
   - Get the value by running: `cat ~/.ssh/id_ed25519` on your server

4. **SSH_PASSPHRASE**
   - Value: `fleetmanager`
   - Description: The passphrase for your SSH private key

### How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the name and value listed above

## Deployment Workflow

The deployment workflow (`deploy.yml`) is triggered automatically when you push to the `main` branch.

### What the Workflow Does

1. ✅ Pulls the latest code from GitHub
2. ✅ Installs dependencies
3. ✅ Generates Prisma Client
4. ✅ Runs database migrations
5. ✅ Builds the Next.js application
6. ✅ Restarts PM2 processes
7. ✅ Verifies the application is running

### Manual Deployment

If you need to deploy manually without pushing to GitHub:

```bash
cd /var/www/fleetbackend
git pull origin main
npm ci --legacy-peer-deps
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart ecosystem.config.js --env production
pm2 save
```

### Monitoring Deployment

- View GitHub Actions logs: **Actions** tab in your repository
- View application logs: `pm2 logs fleetbackend`
- Check application status: `pm2 status`

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs for error messages
2. Verify all secrets are correctly configured
3. Test SSH connection: `ssh root@62.84.183.230`
4. Check server logs: `pm2 logs fleetbackend --lines 100`

### Database Migration Issues

If migrations fail:
```bash
npx prisma migrate status
npx prisma migrate resolve --applied "migration_name"
npx prisma migrate deploy
```

### Application Not Starting

```bash
pm2 stop fleetbackend
pm2 delete fleetbackend
pm2 start ecosystem.config.js --env production
pm2 save
```

## Security Notes

- ⚠️ Never commit secrets or private keys to the repository
- ⚠️ All sensitive data should be stored in GitHub Secrets
- ⚠️ The `.env` file on the server contains production credentials and should never be committed
