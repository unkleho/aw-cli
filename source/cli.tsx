#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App, { AppState } from './app.js';
import { exec, spawn, execFile } from 'child_process';
import { GitAppState } from './git-app.js';

const initialState = process.argv[2] as AppState;
const initialGitAppState = initialState === 'git' ? (process.argv[3] as GitAppState) : null;
const initialTestAppState = initialState === 'test' ? (process.argv[3] as string) : '';

render(
  <App state={initialState} gitAppState={initialGitAppState} testAppState={initialTestAppState} />
);

// const cli = meow(
// 	`
// 	Usage
// 	  $ aw

// 	Options
// 		--name  Your name

// 	Examples
// 	  $ react-ink-test --name=Jane
// 	  Hello, Jane
// `,
// 	{
// 		importMeta: import.meta,
// flags: {
// 	name: {
// 		type: 'string',
// 	},
// },
// 	}
// );
