import React, { useState } from 'react';
import { Text } from 'ink';
import TextInput from 'ink-text-input';
import dashify from 'dashify';
import { execFile } from 'child_process';

export function GitApp() {
	const [branchName, setBranchName] = useState<string>('');

	return (
		<>
			<Text>Name your branch:</Text>
			<TextInput
				value={branchName}
				onChange={(value) => setBranchName(value)}
				onSubmit={(value) => {
					const gitBranchName = dashify(value);

					execFile('git', ['checkout', '-b', gitBranchName]);
					execFile('git', ['add', '.']);
					execFile('git', ['commit', '-m', `"${value}"`]);

					console.log(gitBranchName);
				}}
			></TextInput>
		</>
	);
}
