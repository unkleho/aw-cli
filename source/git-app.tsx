import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import dashify from 'dashify';
import { execa } from 'execa';
import SelectInput from 'ink-select-input';

type Props = {
	state?: GitAppState;
};

export type GitAppState = 'create-branch' | 'something-else';

const items: { label: string; value: GitAppState }[] = [
	{ label: 'Create branch', value: 'create-branch' },
	{ label: 'Something else', value: 'something-else' },
];

const greenConsoleColour = '\x1b[32m%s\x1b[0m';

export function GitApp({ state }: Props) {
	const { exit } = useApp();
	const [branchName, setBranchName] = useState<string>('');
	const [gitAppState, setGitAppState] = useState<GitAppState | null>(state);
	const [error, setError] = useState<'missing-jira-code' | undefined>();

	const handleBranchSubmit = async (value: string) => {
		// eg. FMS-420
		const pattern = /[A-Z]{2,5}-\d+\s/;
		const match = value.match(pattern);

		if (!match) {
			setError('missing-jira-code');

			return;
		}

		setError(null);

		const [prefix] = match;
		const description = value.replace(prefix, '');

		const gitBranchName = `${prefix.replace(' ', '')}-${dashify(description)}`;

		// console.log(gitBranchName, match);

		try {
			const { stdout: chStdout } = await execa('git', ['checkout', '-b', gitBranchName]);
			console.log(greenConsoleColour, 'Checkout...', chStdout);

			const { stdout: addStdout } = await execa('git', ['add', '.']);
			console.log(greenConsoleColour, 'Add...', addStdout);

			const { stdout: commitStdout } = await execa('git', ['commit', '-m', value]);
			console.log(greenConsoleColour, 'Commit...', commitStdout);
		} catch (error) {
			console.log(error);
		}

		exit();
	};

	if (!gitAppState) {
		return (
			<>
				<Text color={'yellow'}>Select a Git option:</Text>
				<SelectInput items={items} onSelect={(item) => setGitAppState(item.value)} />
			</>
		);
	}

	if (gitAppState === 'create-branch') {
		return (
			<>
				<Text color={'yellow'}>
					Name your branch <Text color={'grey'}>(eg. FMS-420 My branch name)</Text>:
				</Text>

				<TextInput
					value={branchName}
					onChange={(value) => setBranchName(value)}
					onSubmit={handleBranchSubmit}
				></TextInput>

				{error === 'missing-jira-code' && (
					<Text>
						<Text color={'red'}>Your branch name should start with a Jira issue code</Text>{' '}
						<Text color={'grey'}>(eg. FMS-420)</Text>
					</Text>
				)}
			</>
		);
	}

	if (gitAppState === 'something-else') {
		return (
			<>
				<Box width={80} borderStyle={'single'} borderColor={'green'}>
					<Text>Something else</Text>
				</Box>
			</>
		);
	}
}
