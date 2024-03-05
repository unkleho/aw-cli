import { exec, execFile } from "child_process";

// exec("npx jest", {}, (error, stdout, stderr) => {
// 	if (error) {
// 		console.error(`Error executing Jest: ${error}`);
// 		return;
// 	}

// 	console.log(`Jest output:\n${stdout}`);
// 	if (stderr) {
// 		console.error(`Jest errors:\n${stderr}`);
// 	}
// });

const jestExecutable = "npx";
const jestArgs = ["jest"];

execFile(jestExecutable, jestArgs, (error, stdout, stderr) => {
	if (error) {
		console.error(`Error executing Jest: ${error}`);
		return;
	}

	console.log(`Jest output:\n${stdout}`);
	if (stderr) {
		console.error(`Jest errors:\n${stderr}`);
	}
});
