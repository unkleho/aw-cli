import React, { useState } from "react";
import { Box, Text, useApp } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import { exec, spawn, execSync } from "child_process";

type Props = {
	name: string | undefined;
};

export default function App({ name = "Stranger" }: Props) {
	const { exit } = useApp();
	const [searchValue, setSearchValue] = useState("");
	const handleSelect = (item: any) => {
		// `item` = { label: 'First', value: 'first' }
	};

	const items = [
		{
			label: "First",
			value: "first",
		},
		{
			label: "Second",
			value: "second",
		},
		{
			label: "Third",
			value: "third",
		},
		{
			label: "Fourth",
			value: "fourth",
		},
	];

	const filteredItems = items.filter((item) =>
		item.label.includes(searchValue)
	);

	return (
		<>
			<Text>
				Hello, <Text color="green">{name}</Text>
			</Text>
			<TextInput value={searchValue} onChange={(v) => setSearchValue(v)} />
			<SelectInput
				items={filteredItems}
				onSelect={(item) => {
					// exec("ls");

					// pbcopy("Copied! " + item.label);

					console.log("Test out");
					execSync("clear");
					execSync("npx jest"); // --watch will hang
					exit();
					// exec("ls");

					// const process = spawn("npx", ["jest"]);

					// process.stdout.on("data", (output) => {
					// 	console.log(output.toString());
					// });

					// process.stdout.on("exit", (output) => {
					// 	console.log(output.toString());
					// });
				}}
			/>
		</>
	);
}

function pbcopy(data) {
	var proc = spawn("pbcopy");
	proc.stdin.write(data);
	proc.stdin.end();
}
