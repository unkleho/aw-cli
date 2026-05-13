import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

/**
 * Get NX project.json for a file within a project
 */
export function getNxProject(filePath: string): {
  name: string;
  projectType: 'library' | 'app';
  sourceRoot: string;
  targets: {
    test?: {
      executor:
        | '@nx/jest:jest'
        | '@angular-devkit/build-angular:karma'
        | '@analogjs/vitest-angular:test';
    };
  };
} {
  let projectFilePath;
  let folderPath = path.join(filePath, '../');
  let i = 0;

  while (!projectFilePath && i < 10) {
    const files = fs.readdirSync(folderPath);

    if (files.includes('project.json')) {
      projectFilePath = folderPath + 'project.json';
    } else {
      // Go up a folder
      folderPath = path.join(folderPath, '../');
      i++;
    }

    // console.log({ i, files, folderPath, projectFilePath });
  }

  if (!projectFilePath) {
    throw new Error(`Could not find project.json for file: ${filePath}`);
  }

  const rawProject = fs.readFileSync(projectFilePath, { encoding: 'utf-8' });
  const project = JSON.parse(rawProject);

  return project;
}

const CONFIG_PATH = path.join(os.homedir(), '.aw-cli.json');

export type AwCliConfig = {
  project?: string;
};

export function loadConfig(): AwCliConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, { encoding: 'utf-8' });
    return JSON.parse(raw) as AwCliConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: AwCliConfig): void {
  const existing = loadConfig();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...config }, null, 2));
}

export function getAllFiles(dirPath: string, filesList: string[] = []) {
  filesList = filesList || [];

  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    if (['node_modules', '.git', 'dist'].includes(file)) {
      return;
    }

    const filePath = path.join(dirPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, filesList);
    } else {
      filesList.push(filePath);
    }
  });

  return filesList;
}
