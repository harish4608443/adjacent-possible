import { NextRequest, NextResponse } from "next/server";
import { GitHubData } from "@/lib/types";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const headers: HeadersInit = { "User-Agent": "adjacent-possible-app" };

    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`, { headers }),
    ]);

    if (userRes.status === 404) {
      return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
    }
    if (!userRes.ok) {
      return NextResponse.json({ error: "GitHub API error" }, { status: 502 });
    }

    const user = await userRes.json();
    const repos = reposRes.ok ? await reposRes.json() : [];

    // Count languages across repos
    const langCount: Record<string, number> = {};
    const recentRepos: GitHubData["recentRepos"] = [];

    for (const repo of repos) {
      if (repo.fork) continue;
      if (repo.language) {
        langCount[repo.language] = (langCount[repo.language] ?? 0) + (repo.stargazers_count + 1);
      }
      if (recentRepos.length < 8) {
        recentRepos.push({
          name: repo.name,
          description: repo.description ?? "",
          language: repo.language ?? "unknown",
          stars: repo.stargazers_count,
          updatedAt: repo.updated_at,
        });
      }
    }

    const topLanguages = Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([lang]) => lang);

    const totalStars = repos.reduce((sum: number, r: { stargazers_count: number }) => sum + r.stargazers_count, 0);
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const github: GitHubData = {
      username,
      name: user.name ?? username,
      bio: user.bio ?? "",
      followers: user.followers,
      publicRepos: user.public_repos,
      topLanguages,
      recentRepos,
      totalStars,
      accountAgeDays,
    };

    return NextResponse.json({ github });
  } catch {
    return NextResponse.json({ error: "Failed to fetch GitHub data" }, { status: 500 });
  }
}
