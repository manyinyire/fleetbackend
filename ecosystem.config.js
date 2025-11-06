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
 */

module.exports = {
  apps: [
    {
      name: 'fleetbackend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/fleetbackend',
      instances: 2, // Use 2 instances for better performance (or 'max' for all CPU cores)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      error_file: '/var/log/pm2/fleetbackend-error.log',
      out_file: '/var/log/pm2/fleetbackend-out.log',
      log_file: '/var/log/pm2/fleetbackend.log',
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

