#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import meow from "meow";
import App from "./app.js";
import { getFiles } from "./file-utils.js";
import { exec, spawn } from "child_process";

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
				type: "string",
			},
		},
	}
);

render(<App name={"TEST"} />);

// const files = getFiles();

// console.log('CLI', cli.flags.name);
// console.log('Files', files);
