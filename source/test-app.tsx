import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { exec, spawn, execSync, execFile, execFileSync } from 'child_process';
import path from 'path';
import { __dirname, getAllFiles, getNxProject } from './file-utils.js';
import { glob, globSync } from 'glob';
import { execa } from 'execa';

type Props = {
	name: string | undefined;
};

const folderPath = process.cwd() + '/';

// console.log(folderPath);

const files = globSync(folderPath + '**/*.spec.ts', {
	ignore: [folderPath + 'node_modules/**', '**/dist/**'],
}).map((file) => file.replace(folderPath, ''));
files.reverse();

export function TestApp() {
	const { exit } = useApp();
	const [searchValue, setSearchValue] = useState('');
	const handleSelect = async (item: { label: string; value: string }) => {
		await execa('clear');

		const filePath = path.join(folderPath, item.value);
		const project = getNxProject(filePath);
		const { name } = project;

		const spawnArgs = [
			'nx',
			'run',
			name + ':test',
			'--watch',
			'--testFile',
			filePath.replace(process.cwd() + '/', ''),
		];

		// console.log(project, spawnArgs);

		const childProcess = spawn('npx', spawnArgs, {
			stdio: 'inherit', // Get nice formatting
			// detached: true, // Need this otherwise we get IO error (if process.exit() is run)
		});

		exit();
	};

	const items = files.map((file) => {
		return {
			label: file,
			value: file,
		};
	});

	const filteredItems = items.filter((item) => item.label.includes(searchValue)).slice(0, 5);

	return (
		<>
			<Text>Choose a test file:</Text>
			<TextInput value={searchValue} onChange={(v) => setSearchValue(v)} />
			<SelectInput items={filteredItems} onSelect={handleSelect} />
		</>
	);
}
