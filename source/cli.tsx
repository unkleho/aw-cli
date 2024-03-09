#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App, { AppState } from './app.js';
import { exec, spawn, execFile } from 'child_process';

const cli = meow(
	`
	Usage
	  $ react-ink-test

	Options
		--name  Your name

	Examples
	  $ react-ink-test --name=Jane
	  Hello, Jane
`,
	{
		importMeta: import.meta,
		flags: {
			name: {
				type: 'string',
			},
		},
	}
);

const initialState = process.argv[2] as AppState;

render(<App state={initialState} />);

// const files = getFiles();

// console.log('CLI', cli.flags.name);
// console.log('Files', files);
