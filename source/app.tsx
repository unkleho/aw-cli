import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { exec, spawn, execSync, execFile, execFileSync } from 'child_process';
import path from 'path';
import { __dirname, getAllFiles, getNxProject } from './file-utils.js';
import { glob, globSync } from 'glob';
import { TestApp } from './test-app.js';
import { GitApp, GitAppState } from './git-app.js';

type Props = {
	state?: AppState;
	gitAppState?: GitAppState;
};

export type AppState = 'test' | 'git';

const items = [
	{ label: 'Git', value: 'git' },
	{ label: 'Test', value: 'test' },
];

export default function App({ state, gitAppState }: Props) {
	const [appState, setAppState] = useState<AppState>(state);

	const handleSelect = (item: { label: string; value: AppState }) => {
		setAppState(item.value);
	};

	if (appState === 'git') {
		return <GitApp state={gitAppState} />;
	}

	if (appState === 'test') {
		return <TestApp />;
	}

	return (
		<>
			<Text color={'yellow'}>Choose an option:</Text>
			<SelectInput items={items} onSelect={handleSelect} />
		</>
	);
}
