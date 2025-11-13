/**
 * PM2 Ecosystem Configuration
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 stop ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 delete ecosystem.config.js
 *   pm2 logs ecosystem.config.js
 *
 * Environment Variables:
 *   APP_DIR - Application directory (default: /var/www/fleetbackend)
 *   LOG_DIR - Log directory (default: /var/log/pm2)
 *   PORT - Application port (default: 3000)
 *   PM2_INSTANCES - Number of instances (default: 2)
 */

module.exports = {
  apps: [
    {
      name: 'fleetbackend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: process.env.APP_DIR || '/var/www/fleetbackend',
      instances: process.env.PM2_INSTANCES || 2, // Use PM2_INSTANCES env var or default to 2
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
      // Logging
      error_file: `${process.env.LOG_DIR || '/var/log/pm2'}/fleetbackend-error.log`,
      out_file: `${process.env.LOG_DIR || '/var/log/pm2'}/fleetbackend-out.log`,
      log_file: `${process.env.LOG_DIR || '/var/log/pm2'}/fleetbackend.log`,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Health check
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};

