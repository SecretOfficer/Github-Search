import { cn } from "../lib/utils";

export const Skeleton = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700",
                className
            )}
        />
    );
};

export const RepoCardSkeleton = () => {
    return (
        <div className="flex h-40 flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-3">
                {/* Title */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-2/3" />
                </div>

                {/* Description */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Footer stats */}
            <div className="flex items-center gap-4 pt-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    );
};
