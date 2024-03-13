import React, { useState } from 'react';
import { Box, Newline, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { exec, spawn, execSync, execFile, execFileSync } from 'child_process';
import path from 'path';
import { __dirname, getAllFiles, getNxProject } from './file-utils.js';
import { glob, globSync } from 'glob';
import { TestApp } from './test-app.js';
import { GitApp, GitAppState } from './git-app.js';
import { PackageApp } from './package-app.js';
import { AwLogo } from './aw-logo.js';

type Props = {
	state?: AppState;
	gitAppState?: GitAppState;
};

export type AppState = 'test' | 'git' | 'package';

const items = [
	{ label: 'Git', value: 'git' },
	{ label: 'Test', value: 'test' },
	{ label: 'Package', value: 'package' },
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

	if (appState === 'package') {
		return <PackageApp />;
	}

	return (
		<>
			{/* <AwLogo /> */}
			<Text color={'yellow'}>Choose an option:</Text>
			<SelectInput items={items} onSelect={handleSelect} />
		</>
	);
}
