import { spawn } from "child_process";

console.log("kaho");

// Run a command after exiting
const childProcess = spawn("npx", ["jest", "--watch"], {
	stdio: "inherit", // This ensures that the output of the command is displayed in the console
});

childProcess.on("exit", (code, signal) => {
	console.log(`Command exited with code ${code} and signal ${signal}`);
});

childProcess.on("error", (err) => {
	console.error("Failed to start command:", err);
});

// Exit the Node.js script
process.exit();
