import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { exec, spawn, execSync, execFile, execFileSync } from 'child_process';
import path from 'path';
import { __dirname, getAllFiles, getNxProject } from './file-utils.js';
import { glob, globSync } from 'glob';
import { execa } from 'execa';
import fs from 'fs';

type Props = {
	name: string | undefined;
};

const folderPath = process.cwd() + '/';
const rawPkg = fs.readFileSync(folderPath + 'package.json', { encoding: 'utf-8' });
const pkg = rawPkg ? JSON.parse(rawPkg) : null;
const items = pkg?.scripts
	? Object.entries(pkg.scripts).map(([key, value]) => ({ label: key, value: key }))
	: [];

// console.log(items);

export function PackageApp() {
	const { exit } = useApp();
	const [searchValue, setSearchValue] = useState('');

	const handleSelect = async (item: { label: string; value: string }) => {
		await execa('clear');

		// Not working?? Command failed with ENOENT: npm run lint
		await execa(`npm run ${item.value}`);

		exit();
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
