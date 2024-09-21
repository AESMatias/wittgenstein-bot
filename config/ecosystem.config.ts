module.exports = {
  apps: [
    {
      name: 'Wittgenstein BOT',
      cwd: './', //The current working directory for the application
      script: 'index.js',
      output: './logs/WittgensteinBOT-out.log',
      error: './logs/WittgensteinBOT-err.log',
      log: './logs/WittgensteinBOT-combined.log',
      time: true,
      // watch: true,
      ignore_watch: ['node_modules', 'logs'],
    },
  ],
};