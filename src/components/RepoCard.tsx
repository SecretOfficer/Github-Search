import { GithubRepo } from "../api/github";
import { Star, GitFork, Calendar } from "lucide-react";

interface RepoCardProps {
    repo: GithubRepo;
}

export const RepoCard = ({ repo }: RepoCardProps) => {
    return (
        <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-40 flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
            <div className="overflow-hidden">
                <div className="flex items-center justify-between">
                    <h3 className="truncate text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                        {repo.name}
                    </h3>
                    {repo.language && (
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {repo.language}
                        </span>
                    )}
                </div>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">
                    {repo.description || "No description available."}
                </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    <span>{repo.stargazers_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                    <GitFork className="h-3.5 w-3.5" />
                    <span>{repo.forks_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
                </div>
            </div>
        </a>
    );
};
