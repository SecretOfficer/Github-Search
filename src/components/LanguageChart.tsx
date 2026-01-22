import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { GithubRepo } from "../api/github";

interface LanguageChartProps {
    repos: GithubRepo[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export const LanguageChart = ({ repos }: LanguageChartProps) => {
    const data = useMemo(() => {
        const langMap: Record<string, number> = {};
        repos.forEach((repo) => {
            if (repo.language) {
                langMap[repo.language] = (langMap[repo.language] || 0) + 1;
            }
        });

        return Object.entries(langMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Top 6 languages to keep chart clean
    }, [repos]);

    if (data.length === 0) return null;

    return (
        <div className="h-64 w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Language Distribution</h3>
            <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#374151', fontSize: '12px' }}
                    />
                    <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
