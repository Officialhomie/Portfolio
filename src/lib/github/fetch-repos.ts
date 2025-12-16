/**
 * GitHub Repository Fetcher
 * Fetches repositories from GitHub API
 */

import type { GitHubProject } from './types';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Fetch repositories for a GitHub user/organization
 */
export async function fetchGitHubRepos(
  username: string,
  options?: {
    type?: 'all' | 'owner' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    perPage?: number;
  }
): Promise<GitHubProject[]> {
  const {
    type = 'all',
    sort = 'updated',
    direction = 'desc',
    perPage = 100,
  } = options || {};

  try {
    const url = new URL(`${GITHUB_API_BASE}/users/${username}/repos`);
    url.searchParams.set('type', type);
    url.searchParams.set('sort', sort);
    url.searchParams.set('direction', direction);
    url.searchParams.set('per_page', perPage.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    return repos.map((repo: any) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      htmlUrl: repo.html_url,
      homepage: repo.homepage,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      topics: repo.topics || [],
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
      },
      isFork: repo.fork,
      archived: repo.archived,
    })) as GitHubProject[];
  } catch (error) {
    console.error(`Error fetching repos for ${username}:`, error);
    return [];
  }
}

/**
 * Fetch repositories from multiple users/organizations
 */
export async function fetchMultipleGitHubRepos(
  usernames: string[],
  options?: Parameters<typeof fetchGitHubRepos>[1]
): Promise<GitHubProject[]> {
  const results = await Promise.all(
    usernames.map((username) => fetchGitHubRepos(username, options))
  );
  return results.flat();
}

