import { spawn, exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// console.log("kaho");

// Run a command after exiting
// const childProcess = spawn("npx", ["jest"], {
// 	// stdio: "inherit", // This ensures that the output of the command is displayed in the console
// 	detached: true,
// });

// childProcess.on("exit", (code, signal) => {
// 	console.log(`Command exited with code ${code} and signal ${signal}`);
// });

// childProcess.on("error", (err) => {
// 	console.error("Failed to start command:", err);
// });

const jestProcess = spawn("npx", ["jest", "--watch"], {
	// shell: true,
	stdio: "inherit", // Get nice formatting
	detached: true, // Need this otherwise we get IO error
});

// jestProcess.stdout.on("data", (data) => {
// 	console.log(`${data}`);
// });

// jestProcess.stderr.on("data", (data) => {
// 	console.error(`${data}`);
// });
jestProcess.on("exit", (code) => {
	console.log(`child process exited with code ${code}`);
});

jestProcess.on("close", (code) => {
	console.log(`child process closed with code ${code}`);
	process.exit();
});

// pkill -f jest
// to stop phantom jests from running

// Exit the Node.js script
process.exit();
