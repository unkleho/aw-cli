import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useFocusManager } from 'ink';
import TextInput from 'ink-text-input';
import dashify from 'dashify';
import { execa } from 'execa';
import SelectInput from 'ink-select-input';
import { loadConfig, saveConfig } from './file-utils.js';

type JiraIssueData = { summary: string | null; epicName: string | null };

async function fetchJiraIssue(issueKey: string): Promise<JiraIssueData | null> {
  const baseUrl = process.env['JIRA_BASE_URL']; // eg. https://yourorg.atlassian.net
  const email = process.env['JIRA_EMAIL'];
  const apiToken = process.env['JIRA_API_TOKEN'];

  if (!baseUrl || !email || !apiToken) return null;

  const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
  const url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(
    issueKey
  )}?fields=summary,customfield_10014,parent`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    fields?: {
      summary?: string;
      customfield_10014?: string; // epic link key (classic projects)
      parent?: { key?: string; fields?: { summary?: string } }; // parent/epic (next-gen projects)
    };
  };

  // Next-gen: parent.fields.summary gives the epic name directly
  let epicName = data.fields?.parent?.fields?.summary ?? null;

  // Classic: customfield_10014 is just the epic key, so fetch its summary
  if (!epicName && data.fields?.customfield_10014) {
    const epicIssue = await fetchJiraIssue(data.fields.customfield_10014);
    epicName = epicIssue?.summary ?? null;
  }

  return {
    summary: data.fields?.summary ?? null,
    epicName,
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

  const handleJiraCodeSubmit = async () => {
    const hasCode = jiraCode !== '' && jiraCode !== 'NA' && jiraCode !== 'na';
    if (hasCode) {
      setIsFetchingJira(true);
      try {
        const issue = await fetchJiraIssue(jiraCode);
        if (issue?.summary) {
          setBranchName(issue.summary);
        }
        if (issue?.epicName) {
          setProject(dashify(issue.epicName));
        }
      } finally {
        setIsFetchingJira(false);
      }
    }
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
        <SelectInput
          items={[
            { label: 'feat', value: 'feat' },
            { label: 'chore', value: 'chore' },
            { label: 'fix', value: 'fix' },
          ]}
          onSelect={(value: { label: string; value: GitIssueType }) => {
            setIssueType(value.value);
            setGitAppState('create-branch.project');
          }}
        />
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
