const { spawn } = require('child_process');
const path = require('path');

const services = [
  'auth-service',
  'event-service',
  'gateway',
  'leaderboard-service',
  'notification-service',
  'settings-service'
];

services.forEach(service => {
  const servicePath = path.join(__dirname, 'backend', service);
  console.log(`Starting ${service} from ${servicePath}`);
  const child = spawn('npm', ['start'], { cwd: servicePath, shell: true });

  child.stdout.on('data', data => console.log(`[${service}] OUT: ${data}`));
  child.stderr.on('data', data => console.error(`[${service}] ERR: ${data}`));
  child.on('close', code => console.log(`[${service}] EXITED WITH CODE: ${code}`));
});

