import axios, { AxiosError } from "axios";
import { useStore } from "../store/useStore";

const GITHUB_API_BASE = "https://api.github.com";

export interface GithubOrg {
    login: string;
    avatar_url: string;
    name: string;
    description: string;
    public_repos: number;
    html_url: string;
}

export interface GithubRepo {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    stargazers_count: number;
    forks_count: number;
    updated_at: string;
    language: string | null;
    topics: string[];
}

// Create axios instance
const api = axios.create({
    baseURL: GITHUB_API_BASE,
});

// Interceptor to inject PAT if available
api.interceptors.request.use((config) => {
    const { pat } = useStore.getState();
    if (pat) {
        config.headers.Authorization = `Bearer ${pat}`;
    }
    return config;
});

export const fetchOrg = async (orgName: string): Promise<GithubOrg> => {
    if (!orgName) throw new Error("Organization name is required");
    const { data } = await api.get<GithubOrg>(`/orgs/${orgName}`);
    return data;
};

export const fetchRepos = async ({
    orgName,
    page = 1,
    perPage = 10,
    sort = "stars", // Note: Github API sorting is different, we might sort client side or use query params if supported
}: {
    orgName: string;
    page?: number;
    perPage?: number;
    sort?: string;
}): Promise<GithubRepo[]> => {
    if (!orgName) return [];

    // GitHub API 'sort' param works for some endpoints, but for /orgs/{org}/repos:
    // type: all, public, private...
    // sort: created, updated, pushed, full_name
    // direction: asc, desc
    // Stars/Forks sorting often needs to be done client-side or via search API. 
    // However, strict requirement is: "Endpoint: https://api.github.com/orgs/{org}/repos"
    // So we fetch standardized list and sort client side as per instructions ("Sorting: Allow sorting results client-side")

    const { data } = await api.get<GithubRepo[]>(`/orgs/${orgName}/repos`, {
        params: {
            per_page: perPage,
            page: page,
            // We start with updated to get fresh ones, or just let default happen and sort in UI
            sort: "updated",
            direction: "desc",
        },
    });
    return data;
};

export const isRateLimitError = (error: unknown): boolean => {
    return axios.isAxiosError(error) && error.response?.status === 403;
};

export const isNotFoundError = (error: unknown): boolean => {
    return axios.isAxiosError(error) && error.response?.status === 404;
};
