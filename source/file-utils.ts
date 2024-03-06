import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export function getFiles() {
	const dirs = fs.readdirSync(
		path.join(__dirname, '../../agriwebb/agriwebb/libs/ui-domain/common')
	);

	const rawProject = fs.readFileSync(
		path.join(__dirname, '../../agriwebb/agriwebb/libs/ui-domain/common/project.json'),
		{ encoding: 'utf-8' }
	);

	const project = JSON.parse(rawProject);

	console.log(project.targets.test);
	return dirs;
}

export function getAllFiles(dirPath, filesList = []) {
	filesList = filesList || [];

	const files = fs.readdirSync(dirPath);

	files.forEach(function (file) {
		if (['node_modules', '.git', 'dist'].includes(file)) {
			return;
		}

		const filePath = path.join(dirPath, file);

		if (fs.statSync(filePath).isDirectory()) {
			getAllFiles(filePath, filesList);
		} else {
			filesList.push(filePath);
		}
	});

	return filesList;
}

// const folderPath = '/path/to/your/folder';
// const allFiles = getAllFiles(folderPath);

// console.log(allFiles);
