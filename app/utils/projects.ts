import { cache } from "react";
import projectsData from "../../data/projects.enriched.json";

export type ProjectStatus =
  | "active"
  | "stale"
  | "inactive"
  | "archived"
  | "deprecated"
  | "deleted"
  | "unknown";

export type ManualStatus = "inactive" | "archived" | "deprecated" | "deleted";

export type Author = {
  name: string;
  link: string;
};

export type Project = {
  name: string;
  repoUrl: string;
  description: string;
  authors: Author[];
  manualStatus?: ManualStatus;
  computed?: {
    status: ProjectStatus;
    stars: number | null;
    lastPushed: string | null;
    language: string | null;
    checkedAt: string;
    error?: string;
  };
  // Legacy shape — keeps existing components working without changes
  repoName: string;
  repoLink: string;
  repoDescription: string;
  repoAuthor: string;
  repoAuthorLink: string;
  isInactive: boolean;
  isArchived: boolean;
};

function normalizeProject(raw: (typeof projectsData)[number]): Project {
  const primaryAuthor = raw.authors?.[0];
  const status = raw.computed?.status as ProjectStatus;

  return {
    ...raw,
    authors: (raw.authors ?? []) as Author[],
    computed: raw.computed as Project["computed"],
    manualStatus: raw.manualStatus as ManualStatus | undefined,
    repoName: raw.name,
    repoLink: raw.repoUrl,
    repoDescription: raw.description,
    repoAuthor: primaryAuthor?.name ?? "",
    repoAuthorLink: primaryAuthor?.link ?? "",
    isInactive: status === "inactive" || status === "stale",
    isArchived: status === "archived",
  };
}

const getData = cache((): Project[] =>
  (projectsData as (typeof projectsData)[number][]).map(normalizeProject)
);

export const useProjects = () => {
  const data = getData();

  const filterProjects = () => ({
    byName: (input: string) => {
      const q = input.toLocaleLowerCase();
      return data.filter((p) => p.repoName.toLocaleLowerCase().includes(q));
    },

    byAuthor: (input: string) => {
      const normalized = input.trim().toLocaleLowerCase().replace(/^@/, "");
      const q = `@${normalized}`;
      return data.filter((p) => p.repoAuthor.toLocaleLowerCase().includes(q));
    },

    byLetter: (input: string) => {
      const q = input.toLocaleLowerCase();
      return data.filter((p) => p.repoName.toLocaleLowerCase().startsWith(q));
    },

    byStatus: (status: ProjectStatus) =>
      data.filter((p) => p.computed?.status === status),
  });

  return { projects: data, filterProjects };
};
