import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useFocusManager } from 'ink';
import TextInput from 'ink-text-input';
import dashify from 'dashify';
import { execa } from 'execa';
import SelectInput from 'ink-select-input';
import { loadConfig, saveConfig } from './file-utils.js';

type JiraIssueData = { summary: string | null; projectName: string | null };

type RawJiraIssue = {
  fields?: {
    summary?: string;
    customfield_10014?: string; // epic link key (classic projects)
    parent?: { key?: string; fields?: { summary?: string } };
  };
};

async function fetchRawJiraIssue(
  issueKey: string,
  credentials: string,
  baseUrl: string
): Promise<RawJiraIssue | null> {
  const url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(
    issueKey
  )}?fields=summary,customfield_10014,parent`;
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
  });
  if (!response.ok) return null;
  return response.json() as Promise<RawJiraIssue>;
}

async function fetchJiraIssue(issueKey: string): Promise<JiraIssueData | null> {
  const baseUrl = process.env['JIRA_BASE_URL']; // eg. https://yourorg.atlassian.net
  const email = process.env['JIRA_EMAIL'];
  const apiToken = process.env['JIRA_API_TOKEN'];

  if (!baseUrl || !email || !apiToken) return null;

  const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');

  const issue = await fetchRawJiraIssue(issueKey, credentials, baseUrl);
  if (!issue) return null;

  // Determine the epic (classic: customfield_10014 key, next-gen: parent)
  const epicKey = issue.fields?.customfield_10014 ?? issue.fields?.parent?.key ?? null;
  const epicNameFromIssue = issue.fields?.parent?.fields?.summary ?? null;

  let projectName: string | null = epicNameFromIssue;

  if (epicKey) {
    const epic = await fetchRawJiraIssue(epicKey, credentials, baseUrl);
    if (epic) {
      // Use fetched epic name if we didn't already have it
      if (!projectName) projectName = epic.fields?.summary ?? null;

      // Check if epic has a parent = initiative
      const initiativeKey = epic.fields?.customfield_10014 ?? epic.fields?.parent?.key ?? null;
      const initiativeNameFromEpic = epic.fields?.parent?.fields?.summary ?? null;

      if (initiativeNameFromEpic) {
        projectName = initiativeNameFromEpic;
      } else if (initiativeKey) {
        const initiative = await fetchRawJiraIssue(initiativeKey, credentials, baseUrl);
        if (initiative?.fields?.summary) projectName = initiative.fields.summary;
      }
    }
  }

  return {
    summary: issue.fields?.summary ?? null,
    projectName,
  };
}

type Props = {
  state?: GitAppState;
};

export type GitAppState =
  | 'create-branch'
  | 'create-branch.issue-type'
  | 'create-branch.project'
  | 'create-branch.branch-name'
  | 'something-else';

type GitIssueType = 'feat' | 'chore' | 'fix';

const items: { label: string; value: GitAppState }[] = [
  { label: 'Create branch', value: 'create-branch' },
  { label: 'Something else', value: 'something-else' },
];

const greenConsoleColour = '\x1b[32m%s\x1b[0m';

export function GitApp({ state }: Props) {
  const { exit } = useApp();
  const [jiraCode, setJiraCode] = useState<string>('');
  const [issueType, setIssueType] = useState<GitIssueType>('feat');
  const [project, setProject] = useState<string>(() => loadConfig().project ?? '');
  const [branchName, setBranchName] = useState<string>('');
  const [gitAppState, setGitAppState] = useState<GitAppState | null>(state ?? null);
  const [error, setError] = useState<'missing-jira-code' | undefined>();
  const [isFetchingJira, setIsFetchingJira] = useState<boolean>(false);

  const handleJiraCodeSubmit = () => {
    setGitAppState('create-branch.issue-type');
  };

  const handleBranchSubmit = async (value: string) => {
    // eg. FMS-420
    // const pattern = /[A-Z]{2,5}-\d+\s/;
    // const match = value.match(pattern);

    // if (!match) {
    //   setError('missing-jira-code');

    //   return;
    // }

    // setError(null);

    // const [prefix] = match;
    // const description = value.replace(prefix, '');

    const hasJiraCode = jiraCode !== '' && jiraCode !== 'NA' && jiraCode !== 'na';

    const jiraCodeMessage = hasJiraCode ? jiraCode : '[NA]';

    const gitBranchMessage = `${issueType}(${project}): ${jiraCodeMessage} ${branchName}`;

    const gitBranch = `${hasJiraCode ? `${jiraCode}-` : ''}${dashify(branchName)}`;

    // console.log(gitBranchName);

    try {
      const { stdout: chStdout } = await execa('git', ['checkout', '-b', gitBranch]);
      console.log(greenConsoleColour, 'Checkout...', chStdout);

      const { stdout: addStdout } = await execa('git', ['add', '.']);
      console.log(greenConsoleColour, 'Add...', addStdout);

      const { stdout: commitStdout } = await execa('git', ['commit', '-m', gitBranchMessage]);
      console.log(greenConsoleColour, 'Commit...', commitStdout);
    } catch (error) {
      console.log(error);
    }

    exit();
  };

  if (!gitAppState) {
    return (
      <>
        <Text color={'yellow'}>Select a Git option:</Text>
        <SelectInput items={items} onSelect={(item) => setGitAppState(item.value)} />
      </>
    );
  }

  if (gitAppState === 'create-branch') {
    return (
      <>
        <Text color={'yellow'}>
          Jira code <Text color={'grey'}>(eg. FMS-420)</Text>:
        </Text>

        {isFetchingJira ? (
          <Text color={'grey'}>Fetching issue from Jira...</Text>
        ) : (
          <TextInput
            value={jiraCode}
            onChange={(value) => setJiraCode(value)}
            onSubmit={handleJiraCodeSubmit}
          ></TextInput>
        )}
      </>
    );
  }

  if (gitAppState === 'create-branch.issue-type') {
    return (
      <>
        {isFetchingJira ? (
          <Text color={'grey'}>Fetching issue from Jira...</Text>
        ) : (
          <SelectInput
            items={[
              { label: 'feat', value: 'feat' },
              { label: 'chore', value: 'chore' },
              { label: 'fix', value: 'fix' },
            ]}
            onSelect={async (value: { label: string; value: GitIssueType }) => {
              setIssueType(value.value);
              const hasCode = jiraCode !== '' && jiraCode !== 'NA' && jiraCode !== 'na';
              if (hasCode) {
                setIsFetchingJira(true);
                try {
                  const issue = await fetchJiraIssue(jiraCode);
                  if (issue?.summary) {
                    setBranchName(issue.summary);
                  }
                  if (issue?.projectName) {
                    const nameBeforeDash = issue.projectName.split('-')[0]!.trim();
                    setProject(dashify(nameBeforeDash));
                  }
                } finally {
                  setIsFetchingJira(false);
                }
              }
              setGitAppState('create-branch.project');
            }}
          />
        )}
      </>
    );
  }

  if (gitAppState === 'create-branch.project') {
    return (
      <>
        <Text color={'yellow'}>Project:</Text>

        <TextInput
          value={project}
          onChange={(value) => setProject(value)}
          onSubmit={() => {
            saveConfig({ project });
            setGitAppState('create-branch.branch-name');
          }}
        ></TextInput>
      </>
    );
  }

  if (gitAppState === 'create-branch.branch-name') {
    return (
      <>
        <Text color={'yellow'}>
          Branch name <Text color={'grey'}>(eg. This is a branch yo)</Text>:
        </Text>

        <TextInput
          value={branchName}
          onChange={(value) => setBranchName(value)}
          onSubmit={handleBranchSubmit}
        ></TextInput>
      </>
    );
  }

  // {error === 'missing-jira-code' && (
  // 	<Text>
  // 		<Text color={'red'}>Your branch name should start with a Jira issue code</Text>{' '}
  // 		<Text color={'grey'}>(eg. FMS-420)</Text>
  // 	</Text>
  // )}

  if (gitAppState === 'something-else') {
    return (
      <>
        <Box width={80} borderStyle={'single'} borderColor={'green'}>
          <Text>Something else</Text>
        </Box>
      </>
    );
  }
}
