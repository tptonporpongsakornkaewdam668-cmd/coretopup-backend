module.exports = {
  apps: [
    {
      name: "coretopup-backend",
      script: "src/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "/home/coretopup/logs/backend-error.log",
      out_file: "/home/coretopup/logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
