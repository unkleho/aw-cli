import React, { useMemo, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { exec, spawn, execSync, execFile, execFileSync } from 'child_process';
import path from 'path';
import { __dirname, getAllFiles, getNxProject } from './file-utils.js';
import { glob, globSync } from 'glob';
import { execa } from 'execa';

const folderPath = process.cwd() + '/';

function getFiles() {
	const files = globSync(folderPath + '**/*.spec.ts', {
		ignore: [folderPath + 'node_modules/**', '**/dist/**'],
	}).map((file) => file.replace(folderPath, ''));
	files.reverse();

	return files;
}

export function TestApp() {
	const { exit } = useApp();
	const [searchValue, setSearchValue] = useState('');
	const files = useMemo(() => getFiles(), []);

	const handleSelect = async (item: { label: string; value: string }) => {
		await execa('clear');

		const filePath = path.join(folderPath, item.value);
		const project = getNxProject(filePath);
		const { name, targets } = project;
		const { test } = targets;

		// console.log(project);

		const relativeFilePath = filePath.replace(process.cwd() + '/', '');
		const baseArgs = ['nx', 'run', name + ':test'];
		let args;

		if (test.executor === '@nx/jest:jest') {
			args = ['--testFile', relativeFilePath, '--watch'];

			// console.log(args);
		} else if (test.executor === '@angular-devkit/build-angular:karma') {
			args = ['--include', relativeFilePath, '--watch'];
		}

		if (args) {
			const childProcess = spawn('npx', [...baseArgs, ...args], {
				stdio: 'inherit', // Get nice formatting
				// detached: true, // Need this otherwise we get IO error (if process.exit() is run)
			});
		}

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
			<Text color={'yellow'}>Choose a test file:</Text>
			<TextInput value={searchValue} onChange={(v) => setSearchValue(v)} />
			<SelectInput items={filteredItems} onSelect={handleSelect} />
		</>
	);
}
