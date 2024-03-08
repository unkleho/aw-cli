import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { exec, spawn, execSync, execFile, execFileSync } from 'child_process';
import path from 'path';
import { __dirname, getAllFiles, getNxProject } from './file-utils.js';
import { glob, globSync } from 'glob';
import { TestApp } from './test-app.js';
import { GitApp } from './git-app.js';

type Props = {
	name: AppState | undefined;
};

type AppState = 'test' | 'git';

const items = [
	{ label: 'test', value: 'test' },
	{ label: 'git', value: 'git' },
];

export default function App({ name }: Props) {
	const [appState, setAppState] = useState<AppState>(name);

	const handleSelect = (item: { label: string; value: AppState }) => {
		setAppState(item.value);
	};

	if (appState === 'test') {
		return <TestApp />;
	}

	if (appState === 'git') {
		return <GitApp />;
	}

	return (
		<>
			<Text>Choose an option:</Text>
			<SelectInput items={items} onSelect={handleSelect} />
		</>
	);
}
