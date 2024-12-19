import { spawn } from 'child_process';
import { execa } from 'execa';
import Fuse from 'fuse.js';
import { globSync } from 'glob';
import { Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import path from 'path';
import React, { useMemo, useState } from 'react';
import { getNxProject } from './file-utils.js';

const folderPath = process.cwd() + '/';

function getFiles() {
  const files = globSync(folderPath + '**/*.spec.ts', {
    ignore: [folderPath + 'node_modules/**', '**/dist/**'],
  }).map((file) => file.replace(folderPath, ''));
  files.reverse();

  return files;
}

export function TestApp({ defaultSearchValue = '' }) {
  const { exit } = useApp();
  const [searchValue, setSearchValue] = useState(defaultSearchValue);
  const files = useMemo(() => getFiles(), []);
  const filesFuse = useMemo(() => new Fuse(files), [files])
  const [state, setState] = useState<'select' | 'test'>('select');

  const handleSelect = async (item: { label: string; value: string }) => {
    setState('test');
    await execa('clear');

    const filePath = path.join(folderPath, item.value);
    const project = getNxProject(filePath);
    const { name, targets } = project;
    const { test } = targets;

    // console.log(project);

    const relativeFilePath = filePath.replace(process.cwd() + '/', '');
    const baseArgs = ['nx', 'run', name + ':test'];
    let args;

    if (test.executor === '@nx/jest:jest') {
      args = ['--testFile', relativeFilePath, '--watch'];

      // console.log(args);
    } else if (test.executor === '@angular-devkit/build-angular:karma') {
      args = ['--include', relativeFilePath, '--watch'];
    }

    if (args) {
      const childProcess = spawn('npx', [...baseArgs, ...args], {
        stdio: 'inherit', // Get nice formatting
        // detached: true, // Need this otherwise we get IO error (if process.exit() is run)
      });
    }

    exit();
  };

  const filteredItems = filesFuse.search(searchValue).map(value => ({ label: value.item, value: value.item }))

  if (filteredItems.length === 1 && defaultSearchValue && state === 'select') {
    const item = filteredItems[0];
    handleSelect(item);
  }

  if (state === 'test') {
    return (
      <>
        <Text color={'white'}>Running test file:</Text>
        <Text color={'yellow'}>{filteredItems[0].value}</Text>
      </>
    );
  }

  return (
    <>
      <Text color={'yellow'}>Choose a test file:</Text>
      <TextInput value={searchValue} onChange={(v) => setSearchValue(v)} />
      <SelectInput items={filteredItems} onSelect={handleSelect} />
    </>
  );
}
