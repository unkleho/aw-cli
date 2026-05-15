import React, { useState } from 'react';
import { Text } from 'ink';
import TextInput from 'ink-text-input';
import { useInput } from 'ink';

type Item<V extends string = string> = { label: string; value: V };

type Props<V extends string = string> = {
  items: Item<V>[];
  /** Max number of filtered results to show (default: 5) */
  limit?: number;
  /** Always shown at the bottom, unaffected by filter or limit */
  pinnedItems?: Item<V>[];
  error?: string;
  onSelect: (value: V) => void;
};

export function FilterSelectInput<V extends string = string>({
  items,
  limit = 5,
  pinnedItems = [],
  error,
  onSelect,
}: Props<V>) {
  const [filter, setFilter] = useState('');
  const [highlight, setHighlight] = useState(0);

  const filtered = items
    .filter(
      (item) =>
        filter === '' ||
        item.value.toLowerCase().includes(filter.toLowerCase()) ||
        item.label.toLowerCase().includes(filter.toLowerCase())
    )
    .slice(0, limit);

  const allVisible = [...filtered, ...pinnedItems];

  useInput((_input, key) => {
    if (key.upArrow) {
      setHighlight((h) => Math.max(0, h - 1));
    } else if (key.downArrow) {
      setHighlight((h) => Math.min(allVisible.length - 1, h + 1));
    }
  });

  const handleSubmit = () => {
    const selected = allVisible[highlight] ?? allVisible[0];
    if (selected) onSelect(selected.value);
  };

  return (
    <>
      <Text color={'yellow'}>
        Filter <Text color={'grey'}>(↑↓ navigate, Enter select)</Text>:
      </Text>
      {error && <Text color={'red'}>{error}</Text>}
      <TextInput
        value={filter}
        onChange={(v) => {
          setFilter(v);
          setHighlight(0);
        }}
        onSubmit={handleSubmit}
      />
      {allVisible.map((item, index) => (
        <Text key={item.value} color={index === highlight ? 'cyan' : 'grey'}>
          {index === highlight ? '› ' : '  '}
          {item.label}
        </Text>
      ))}
    </>
  );
}
