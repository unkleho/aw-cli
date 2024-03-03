import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getFiles() {
	const dirs = fs.readdirSync(
		path.join(__dirname, '../../agriwebb/agriwebb/libs/ui-domain/common'),
	);

	const rawProject = fs.readFileSync(
		path.join(
			__dirname,
			'../../agriwebb/agriwebb/libs/ui-domain/common/project.json',
		),
		{encoding: 'utf-8'},
	);

	const project = JSON.parse(rawProject);

	console.log(project.targets.test);
	return dirs;
}
