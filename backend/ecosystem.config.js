module.exports = {
  apps: [
    {
      name: 'odr-backend',
      script: 'app.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
