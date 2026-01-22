import { useEffect, useRef, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useDebounce } from "./hooks/useDebounce";
import { useStore, SortType } from "./store/useStore";
import { fetchOrg, fetchRepos, isRateLimitError, isNotFoundError } from "./api/github";
import { RepoCard } from "./components/RepoCard";
import { RepoCardSkeleton } from "./components/Skeleton";
import { LanguageChart } from "./components/LanguageChart";
import { Search, SlidersHorizontal, AlertCircle, KeyRound } from "lucide-react";
import { cn } from "./lib/utils";

function App() {
    const { orgName, sortType, pat, setOrgName, setSortType, setPat } = useStore();
    const [inputValue, setInputValue] = useState(orgName);
    const debouncedOrgName = useDebounce(inputValue, 500);

    // Sync internal input state if store changes externally (unlikely but good practice)
    useEffect(() => {
        setInputValue(orgName);
    }, [orgName]);

    // Sync debounced value to store
    useEffect(() => {
        setOrgName(debouncedOrgName);
    }, [debouncedOrgName, setOrgName]);

    // --- Queries ---

    // 1. Fetch Organization Info
    const orgQuery = useQuery({
        queryKey: ["org", debouncedOrgName],
        queryFn: () => fetchOrg(debouncedOrgName),
        enabled: !!debouncedOrgName,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 2. Infinite Scroll Repos
    const reposQuery = useInfiniteQuery({
        queryKey: ["repos", debouncedOrgName],
        queryFn: ({ pageParam }) => fetchRepos({ orgName: debouncedOrgName, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 10 ? allPages.length + 1 : undefined;
        },
        enabled: !!debouncedOrgName && orgQuery.isSuccess,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
    });

    // --- Client Side Sorting ---
    const allRepos = useMemo(() => {
        if (!reposQuery.data) return [];
        const flat = reposQuery.data.pages.flat();

        return [...flat].sort((a, b) => { // Create a copy before sorting
            switch (sortType) {
                case "stars": return b.stargazers_count - a.stargazers_count;
                case "forks": return b.forks_count - a.forks_count;
                case "updated": return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                default: return 0;
            }
        });
    }, [reposQuery.data, sortType]);


    // --- Intersection Observer for Infinite Scroll ---
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && reposQuery.hasNextPage && !reposQuery.isFetchingNextPage) {
                    reposQuery.fetchNextPage();
                }
            },
            { threshold: 0.5 }
        );

        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [reposQuery.hasNextPage, reposQuery.isFetchingNextPage, reposQuery.fetchNextPage]);


    // --- Error Handling ---
    const isRateLimited = isRateLimitError(orgQuery.error) || isRateLimitError(reposQuery.error);
    const isNotFound = isNotFoundError(orgQuery.error);


    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-black dark:text-gray-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">

            {/* Header */}
            <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-gray-800 dark:bg-black/80">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    {/* Logo / Title */}
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">GitHub Explorer</h1>
                    </div>

                    {/* Controls */}
                    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">

                        {/* Search */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search organization..."
                                className="w-full rounded-full border border-gray-200 bg-gray-100 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-gray-800 dark:bg-gray-900 dark:focus:bg-gray-900 dark:focus:border-blue-500"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                            <select
                                value={sortType}
                                onChange={(e) => setSortType(e.target.value as SortType)}
                                className="rounded-lg border-none bg-transparent text-sm font-medium text-gray-600 outline-none focus:ring-0 dark:text-gray-300"
                            >
                                <option value="stars">Stars</option>
                                <option value="forks">Forks</option>
                                <option value="updated">Updated</option>
                            </select>
                        </div>

                        {/* PAT Toggle */}
                        <div className="group relative">
                            <button
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                                    pat ? "border-green-500 text-green-500 bg-green-500/10" : "border-gray-200 text-gray-400 hover:border-gray-300 dark:border-gray-800"
                                )}
                                title="Set Personal Access Token"
                                onClick={() => {
                                    const token = prompt("Enter GitHub PAT to increase rate limit:", pat || "");
                                    if (token !== null) setPat(token || null);
                                }}
                            >
                                <KeyRound className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-max max-w-xs scale-0 rounded-lg bg-gray-900 p-2 text-xs text-white shadow-xl transition-all group-hover:scale-100">
                                {pat ? "Token Active" : "Add Token for Rate Limit"}
                            </div>
                        </div>

                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

                {/* Error States */}
                {isRateLimited && (
                    <div className="mb-8 flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                            <h3 className="font-semibold">API Rate Limit Exceeded</h3>
                            <p className="mt-1 text-sm opacity-90">GitHub's unauthenticated rate limit is 60 requests/hour. Please add a Personal Access Token (PAT) using the key icon in the header to continue.</p>
                            <button
                                onClick={() => {
                                    const token = prompt("Enter GitHub PAT:");
                                    if (token) {
                                        setPat(token);
                                        window.location.reload(); // Simple reload to clear queries
                                    }
                                }}
                                className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-800/50 dark:text-red-100 dark:hover:bg-red-800"
                            >
                                Enter Token
                            </button>
                        </div>
                    </div>
                )}

                {isNotFound && (
                    <div className="mt-20 flex flex-col items-center justify-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
                            <Search className="h-10 w-10 text-gray-400" />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold">Organization Not Found</h2>
                        <p className="mt-2 text-gray-500">Could not find "{debouncedOrgName}". Please check the spelling.</p>
                    </div>
                )}

                {/* Content */}
                {!isRateLimited && !isNotFound && orgQuery.data && (
                    <div className="space-y-8">

                        {/* Org Header + Chart */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Org Profile */}
                            <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900 lg:col-span-2 lg:flex-row lg:items-center">
                                <img
                                    src={orgQuery.data.avatar_url}
                                    alt={orgQuery.data.login}
                                    className="h-24 w-24 rounded-full border-4 border-gray-50 dark:border-gray-800"
                                />
                                <div>
                                    <h2 className="text-3xl font-bold">{orgQuery.data.name || orgQuery.data.login}</h2>
                                    <p className="text-lg text-gray-500">@{orgQuery.data.login}</p>
                                    <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-400">{orgQuery.data.description}</p>
                                    <div className="mt-4 flex gap-4">
                                        <a href={orgQuery.data.html_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">View on GitHub</a>
                                        <span className="text-sm text-gray-500 italic">{orgQuery.data.public_repos} public repos</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="lg:col-span-1">
                                {allRepos.length > 0 ? (
                                    <LanguageChart repos={allRepos} />
                                ) : (
                                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
                                        <span className="text-sm text-gray-400">No language data</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Repos Grid */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold">Repositories</h3>
                                <span className="text-sm text-gray-500">Showing {allRepos.length} results</span>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {allRepos.map((repo) => (
                                    <RepoCard key={repo.id} repo={repo} />
                                ))}
                                {(reposQuery.isFetchingNextPage || reposQuery.isLoading) && (
                                    <>
                                        <RepoCardSkeleton />
                                        <RepoCardSkeleton />
                                        <RepoCardSkeleton />
                                    </>
                                )}
                            </div>

                            {/* Infinite Scroll Trigger */}
                            <div ref={loadMoreRef} className="h-4 w-full" />

                            {!reposQuery.hasNextPage && allRepos.length > 0 && (
                                <p className="py-8 text-center text-sm text-gray-500">End of results</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty State / Initial Load */}
                {!debouncedOrgName && !isRateLimited && (
                    <div className="mt-32 flex flex-col items-center justify-center text-center opacity-50">
                        <div className="mb-4 rounded-2xl bg-gray-100 p-4 dark:bg-gray-900">
                            <Search className="h-8 w-8" />
                        </div>
                        <p className="text-lg font-medium">Enter an organization name to start exploring</p>
                        <p className="text-sm">Try "facebook", "netflix", or "google"</p>
                    </div>
                )}

            </main>
        </div>
    );
}

export default App;
