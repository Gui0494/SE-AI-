import { Octokit } from '@octokit/rest';

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  default_branch: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha: string;
}

export interface GitHubGist {
  id: string;
  html_url: string;
  description: string | null;
  public: boolean;
  files: Record<string, { filename: string; content?: string }>;
  created_at: string;
  updated_at: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  // ==================== USER ====================

  async getUser(): Promise<GitHubUser> {
    const { data } = await this.octokit.users.getAuthenticated();
    return data as GitHubUser;
  }

  // ==================== REPOSITORIES ====================

  async listRepos(options?: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    per_page?: number;
    page?: number;
  }): Promise<GitHubRepo[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      type: options?.type || 'owner',
      sort: options?.sort || 'updated',
      per_page: options?.per_page || 30,
      page: options?.page || 1,
    });
    return data as GitHubRepo[];
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    const { data } = await this.octokit.repos.get({ owner, repo });
    return data as GitHubRepo;
  }

  async searchRepos(query: string, options?: {
    per_page?: number;
    page?: number;
  }): Promise<GitHubRepo[]> {
    const { data } = await this.octokit.search.repos({
      q: query,
      per_page: options?.per_page || 10,
      page: options?.page || 1,
    });
    return data.items as GitHubRepo[];
  }

  // ==================== FILES ====================

  async listFiles(
    owner: string,
    repo: string,
    path: string = ''
  ): Promise<GitHubFile[]> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (!Array.isArray(data)) {
      throw new Error('Expected directory, got file');
    }

    return data.map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type as 'file' | 'dir',
      size: item.size,
      sha: item.sha,
    }));
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string
  ): Promise<string> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error('Expected file, got directory');
    }

    // Content is base64 encoded
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string // Required for updates
  ): Promise<{ sha: string; url: string }> {
    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    });

    return {
      sha: data.content?.sha || '',
      url: data.content?.html_url || '',
    };
  }

  // ==================== GISTS ====================

  async createGist(
    files: Record<string, string>,
    options?: {
      description?: string;
      public?: boolean;
    }
  ): Promise<GitHubGist> {
    const gistFiles: Record<string, { content: string }> = {};
    for (const [filename, content] of Object.entries(files)) {
      gistFiles[filename] = { content };
    }

    const { data } = await this.octokit.gists.create({
      files: gistFiles,
      description: options?.description || '',
      public: options?.public ?? false,
    });

    return data as unknown as GitHubGist;
  }

  async listGists(options?: {
    per_page?: number;
    page?: number;
  }): Promise<GitHubGist[]> {
    const { data } = await this.octokit.gists.list({
      per_page: options?.per_page || 30,
      page: options?.page || 1,
    });
    return data as unknown as GitHubGist[];
  }

  async getGist(gistId: string): Promise<GitHubGist> {
    const { data } = await this.octokit.gists.get({ gist_id: gistId });
    return data as unknown as GitHubGist;
  }

  // ==================== ISSUES ====================

  async listIssues(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      per_page?: number;
      page?: number;
    }
  ) {
    const { data } = await this.octokit.issues.listForRepo({
      owner,
      repo,
      state: options?.state || 'open',
      per_page: options?.per_page || 30,
      page: options?.page || 1,
    });
    return data;
  }

  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body?: string,
    labels?: string[]
  ) {
    const { data } = await this.octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
    return data;
  }

  // ==================== PULL REQUESTS ====================

  async listPullRequests(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      per_page?: number;
      page?: number;
    }
  ) {
    const { data } = await this.octokit.pulls.list({
      owner,
      repo,
      state: options?.state || 'open',
      per_page: options?.per_page || 30,
      page: options?.page || 1,
    });
    return data;
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string
  ) {
    const { data } = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
    });
    return data;
  }

  // ==================== BRANCHES ====================

  async listBranches(owner: string, repo: string) {
    const { data } = await this.octokit.repos.listBranches({
      owner,
      repo,
    });
    return data;
  }

  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromBranch?: string
  ) {
    // Get the SHA of the source branch
    const { data: sourceRef } = await this.octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${fromBranch || 'main'}`,
    });

    // Create new branch
    const { data } = await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: sourceRef.object.sha,
    });

    return data;
  }
}

// Helper to get GitHub service for a user
export async function getGitHubServiceForUser(
  userId: string,
  db: any
): Promise<GitHubService | null> {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: 'github',
    },
  });

  if (!account?.access_token) {
    return null;
  }

  return new GitHubService(account.access_token);
}
