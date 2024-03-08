import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

/**
 * Get NX project.json for a file within a project
 */
export function getNxProject(filePath: string): {
	name: string;
	projectType: 'library' | 'app';
	targets: { test: { executor: '@nx/jest:jest' } };
} {
	// console.log('getNxProject', { filePath });

	let projectFilePath;
	let hasProject = false;
	let folderPath = path.join(filePath, '../');
	let i = 0;

	while (!projectFilePath && i < 10) {
		const files = fs.readdirSync(folderPath);

		if (files.includes('project.json')) {
			hasProject = true;
			projectFilePath = folderPath + 'project.json';
		} else {
			// Go up a folder
			folderPath = path.join(folderPath, '../');
			i++;
		}

		// console.log({ i, files, folderPath, projectFilePath });
	}

	const rawProject = fs.readFileSync(projectFilePath, { encoding: 'utf-8' });
	const project = JSON.parse(rawProject);

	// console.log({ project });

	return project;
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
