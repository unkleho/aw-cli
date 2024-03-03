import React, {useState} from 'react';
import {Box, Text, useApp} from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';

type Props = {
	name: string | undefined;
};

export default function App({name = 'Stranger'}: Props) {
	const {exit} = useApp();
	const [searchValue, setSearchValue] = useState('');
	const handleSelect = (item: any) => {
		// `item` = { label: 'First', value: 'first' }
	};

	const items = [
		{
			label: 'First',
			value: 'first',
		},
		{
			label: 'Second',
			value: 'second',
		},
		{
			label: 'Third',
			value: 'third',
		},
		{
			label: 'Fourth',
			value: 'fourth',
		},
	];

	const filteredItems = items.filter(item => item.label.includes(searchValue));

	return (
		<>
			<Text>
				Hello, <Text color="green">{name}</Text>
			</Text>
			<TextInput value={searchValue} onChange={v => setSearchValue(v)} />
			<SelectInput items={filteredItems} onSelect={() => exit()} />
		</>
	);
}
