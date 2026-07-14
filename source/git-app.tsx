import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useFocusManager } from 'ink';
import TextInput from 'ink-text-input';
import dashify from 'dashify';
import { execa } from 'execa';
import SelectInput from 'ink-select-input';
import { loadConfig, saveConfig } from './file-utils.js';
import { FilterSelectInput } from './filter-select-input.js';

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

type JiraIssueListItem = { key: string; summary: string };

type FetchIssuesResult = { issues: JiraIssueListItem[]; error?: string };

async function fetchJiraIssuesAssignedToMe(): Promise<FetchIssuesResult> {
  const baseUrl = process.env['JIRA_BASE_URL'];
  const email = process.env['JIRA_EMAIL'];
  const apiToken = process.env['JIRA_API_TOKEN'];

  if (!baseUrl || !email || !apiToken) {
    const missing = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN']
      .filter((k) => !process.env[k])
      .join(', ');
    return { issues: [], error: `Missing env vars: ${missing}` };
  }

  const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
  const url = `${baseUrl}/rest/api/3/search/jql`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jql: 'assignee = currentUser() AND resolution = Unresolved AND status NOT IN ("On Hold", "Closed", "Done") ORDER BY updated DESC',
      fields: ['summary', 'key'],
      maxResults: 20,
    }),
  });

  if (!response.ok) {
    return { issues: [], error: `Jira API error: ${response.status} ${response.statusText}` };
  }

  const data = (await response.json()) as {
    issues?: Array<{ key: string; fields?: { summary?: string } }>;
  };

  return {
    issues: (data.issues ?? []).map((issue) => ({
      key: issue.key,
      summary: issue.fields?.summary ?? issue.key,
    })),
  };
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
  | 'create-branch.jira-select'
  | 'create-branch.manual-entry'
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
  const [isCreatingBranch, setIsCreatingBranch] = useState<boolean>(false);
  const [jiraIssues, setJiraIssues] = useState<{ key: string; summary: string }[]>([]);
  const [isFetchingIssues, setIsFetchingIssues] = useState<boolean>(false);
  const [jiraFetchError, setJiraFetchError] = useState<string | undefined>();
  const [jiraSelectedFromList, setJiraSelectedFromList] = useState<boolean>(false);

  const handleJiraCodeSubmit = () => {
    setGitAppState('create-branch.issue-type');
  };

  const runGitBranch = async (opts: {
    jiraCode: string;
    issueType: GitIssueType;
    project: string;
    branchName: string;
  }) => {
    const hasJiraCode = opts.jiraCode !== '' && opts.jiraCode !== 'NA' && opts.jiraCode !== 'na';
    const jiraCodeMessage = hasJiraCode ? opts.jiraCode : '[NA]';
    const gitBranchMessage = `${opts.issueType}(${opts.project}): ${jiraCodeMessage} ${opts.branchName}`;
    const gitBranch = `${hasJiraCode ? `${opts.jiraCode}-` : ''}${dashify(opts.branchName)}`;

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

  const handleBranchSubmit = async (_value: string) => {
    await runGitBranch({ jiraCode, issueType, project, branchName });
  };

  if (!gitAppState) {
    return (
      <>
        <Text color={'yellow'}>Select a Git option:</Text>
        <SelectInput
          items={items}
          onSelect={async (item) => {
            if (item.value === 'create-branch') {
              setGitAppState('create-branch');
              setIsFetchingIssues(true);
              try {
                const result = await fetchJiraIssuesAssignedToMe();
                setJiraIssues(result.issues);
                setJiraFetchError(result.error);
              } catch (e) {
                setJiraFetchError(e instanceof Error ? e.message : String(e));
              } finally {
                setIsFetchingIssues(false);
                setGitAppState('create-branch.jira-select');
              }
            } else {
              setGitAppState(item.value);
            }
          }}
        />
      </>
    );
  }

  if (gitAppState === 'create-branch') {
    return <Text color={'grey'}>Fetching your Jira issues...</Text>;
  }

  if (gitAppState === 'create-branch.jira-select') {
    const jiraSelectItems = jiraIssues.map((issue) => ({
      label: `${issue.key} ${issue.summary}`,
      value: issue.key,
    }));

    return (
      <FilterSelectInput
        items={jiraSelectItems}
        pinnedItems={[{ label: 'Enter manually', value: '__manual__' }]}
        error={jiraFetchError}
        onSelect={(key) => {
          if (key === '__manual__') {
            setJiraSelectedFromList(false);
            setJiraCode('');
            setGitAppState('create-branch.manual-entry');
          } else {
            setJiraSelectedFromList(true);
            setJiraCode(key);
            setGitAppState('create-branch.issue-type');
          }
        }}
      />
    );
  }

  if (gitAppState === 'create-branch.manual-entry') {
    return (
      <>
        <Text color={'yellow'}>
          Jira code <Text color={'grey'}>(eg. FMS-420)</Text>:
        </Text>
        <TextInput
          value={jiraCode}
          onChange={(value) => setJiraCode(value)}
          onSubmit={() => setGitAppState('create-branch.issue-type')}
        />
      </>
    );
  }

  if (gitAppState === 'create-branch.issue-type') {
    return (
      <>
        {isCreatingBranch ? (
          <Text color={'grey'}>Creating branch...</Text>
        ) : isFetchingJira ? (
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
              let resolvedBranchName = branchName;
              let resolvedProject = project;

              if (jiraSelectedFromList) {
                // Summary already available from the list, but project/epic
                // info requires a separate fetch
                const selectedIssue = jiraIssues.find((issue) => issue.key === jiraCode);
                if (selectedIssue?.summary) {
                  resolvedBranchName = selectedIssue.summary;
                }
                setIsCreatingBranch(true);
                setIsFetchingJira(true);
                try {
                  const issue = await fetchJiraIssue(jiraCode);
                  if (issue?.projectName) {
                    resolvedProject = dashify(issue.projectName.split('-')[0]!.trim());
                    setProject(resolvedProject);
                  }
                } catch {
                  // continue without Jira data
                }
                await runGitBranch({
                  jiraCode,
                  issueType: value.value,
                  project: resolvedProject,
                  branchName: resolvedBranchName,
                });
              } else {
                const hasCode = jiraCode !== '' && jiraCode !== 'NA' && jiraCode !== 'na';
                if (hasCode) {
                  setIsFetchingJira(true);
                  try {
                    const issue = await fetchJiraIssue(jiraCode);
                    if (issue?.summary) {
                      resolvedBranchName = issue.summary;
                      setBranchName(issue.summary);
                    }
                    if (issue?.projectName) {
                      resolvedProject = dashify(issue.projectName.split('-')[0]!.trim());
                      setProject(resolvedProject);
                    }
                  } catch {
                    // continue without Jira data
                  }
                  setIsFetchingJira(false);
                }
                setGitAppState('create-branch.project');
              }
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
