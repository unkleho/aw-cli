import React, { useMemo, useState } from 'react';
import { Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

function getScripts() {
	const folderPath = process.cwd() + '/';
	const rawPkg = fs.readFileSync(folderPath + 'package.json', { encoding: 'utf-8' });
	const pkg = rawPkg ? JSON.parse(rawPkg) : null;

	const items = pkg?.scripts
		? Object.entries(pkg.scripts).map(([key, value]) => ({ label: key, value: key }))
		: [];

	return items;
}

// console.log(items);

export function PackageApp() {
	const { exit } = useApp();
	const [searchValue, setSearchValue] = useState('');
	const items = useMemo(() => getScripts(), []);

	const handleSelect = async (item: { label: string; value: string }) => {
		console.log('handleSelect', item.value);

		// await execa('clear');

		const childProcess = spawn('npm', ['run', item.value], {
			stdio: 'inherit', // Get nice formatting
			// detached: true, // Need this otherwise we get IO error (if process.exit() is run)
		});

		// childProcess.on('close', () => {
		// 	console.log('close');
		// });

		// childProcess.on('exit', () => {
		// 	console.log('exit');
		// });

		// try {
		// 	// Not working?? Just hangs
		// 	const { stdout, stderr, exitCode } = await execa('npm', ['run', item.value]);
		// 	console.log(stdout, stderr, exitCode);
		// } catch (error) {
		// 	console.log(error);
		// }

		// exit();
	};

	const filteredItems = items.filter((item) => item.label.includes(searchValue)).slice(0, 10);

	return (
		<>
			<Text color={'yellow'}>Choose a package script:</Text>
			<TextInput value={searchValue} onChange={(v) => setSearchValue(v)} />
			<SelectInput items={filteredItems} onSelect={handleSelect} />
		</>
	);
}
