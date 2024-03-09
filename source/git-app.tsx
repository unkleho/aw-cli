import React, { useState } from 'react';
import { Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import dashify from 'dashify';
import { execa } from 'execa';
import { execFile } from 'child_process';

export function GitApp() {
	const { exit } = useApp();
	const [branchName, setBranchName] = useState<string>('');

	const handleSubmit = async (value: string) => {
		const pattern = /[A-Z]{3,4}-\d+\s/;

		const match = value.match(pattern);
		const [prefix] = match;
		const description = value.replace(prefix, '');

		const gitBranchName = `${prefix.replace(' ', '')}-${dashify(description)}`;

		console.log(gitBranchName, match);

		try {
			const { stdout: chStdout } = await execa('git', ['checkout', '-b', gitBranchName]);
			console.log('Checkout', chStdout);

			const { stdout: addStdout } = await execa('git', ['add', '.']);
			console.log('Add', addStdout);

			const { stdout: commitStdout } = await execa('git', ['commit', '-m', value]);
			console.log('Commit', commitStdout);
		} catch (error) {
			console.log(error);
		}

		exit();
	};

	return (
		<>
			<Text color={'yellow'}>Name your branch:</Text>
			<TextInput
				value={branchName}
				onChange={(value) => setBranchName(value)}
				onSubmit={handleSubmit}
			></TextInput>
		</>
	);
}
