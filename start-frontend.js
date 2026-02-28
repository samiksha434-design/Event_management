const { spawn } = require('child_process');
const path = require('path');

const p = path.join(__dirname, 'frontend');
const child = spawn('npm', ['run', 'dev'], { cwd: p, shell: true });

child.stdout.on('data', d => console.log(`[FRONTEND OUT] ${d}`));
child.stderr.on('data', d => console.error(`[FRONTEND ERR] ${d}`));
child.on('close', code => console.log(`[FRONTEND] Exited with code ${code}`));
