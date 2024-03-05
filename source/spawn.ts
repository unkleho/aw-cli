import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const childProcess = spawn('npx', ['jest', '--watch'], {
	stdio: 'inherit', // Get nice formatting
	// detached: true, // Need this otherwise we get IO error (if process.exit() is run)
});

// childProcess.stdout.on("data", (data) => {
// 	console.log(`${data}`);
// });

// childProcess.stderr.on("data", (data) => {
// 	console.error(`${data}`);
// });

childProcess.on('exit', (code) => {
	console.log(`child process exited with code ${code}`);
});

childProcess.on('close', (code) => {
	console.log(`child process closed with code ${code}`);
	process.exit();
});

// pkill -f jest
// to stop phantom jests from running

// process.on('exit', (code) => {
// 	console.log('Parent', code);
// });

// Exiting the Node.js script will leave the orphan child process hanging
// process.exit();
