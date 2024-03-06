import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { exec, spawn, execSync, execFile, execFileSync } from 'child_process';
import path from 'path';
import { __dirname, getAllFiles } from './file-utils.js';
import { glob, globSync } from 'glob';

type Props = {
	name: string | undefined;
};

// const folderPath = path.join(__dirname, '../');
const folderPath = '../agriwebb/agriwebb/';

// const files = getAllFiles(folderPath);
const files = globSync(folderPath + '**/*.spec.ts', {
	ignore: [folderPath + 'node_modules/**', '**/dist/**'],
});

export default function App({ name = 'Stranger' }: Props) {
	const { exit } = useApp();
	const [searchValue, setSearchValue] = useState('');
	const handleSelect = (item: any) => {
		// `item` = { label: 'First', value: 'first' }
	};

	const items = files.map((file) => {
		return {
			label: file.replace(folderPath, ''),
			value: file.replace(folderPath, ''),
		};
	});

	const filteredItems = items.filter((item) => item.label.includes(searchValue)).slice(0, 5);

	return (
		<>
			<Text>Choose a file:</Text>
			<TextInput value={searchValue} onChange={(v) => setSearchValue(v)} />
			<SelectInput
				items={filteredItems}
				onSelect={(item) => {
					const childProcess = spawn('npx', ['jest', '--watch'], {
						stdio: 'inherit', // Get nice formatting
						// detached: true, // Need this otherwise we get IO error (if process.exit() is run)
					});

					exit();
				}}
			/>
		</>
	);
}

function pbcopy(data) {
	var proc = spawn('pbcopy');
	proc.stdin.write(data);
	proc.stdin.end();
}
