"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CMS_SECTIONS,
  YEAR_SECTION_KEYS,
  type CmsSection,
  type YearSectionKey,
} from "@/lib/cms";

type YearEntry = {
  year: number;
  status: "current" | "archived";
  archived_at: string | null;
};

type AdminEditorProps = {
  currentYear: number;
  years: YearEntry[];
};

type SectionSetting = {
  year: number;
  sectionKey: YearSectionKey;
  displayName: string;
  isHidden: boolean;
};

type CmsArticle = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: { name: string; role: string };
  paragraphs: string[];
  images: Array<{ id: string; caption?: string; position: number }>;
};

type GalleryItem = {
  id: string;
  kind: "photograph" | "drawing";
  title: string;
  description: string;
  imageId: string;
  photographer: { name: string; dept: string; year: string };
  rank: string;
  folderContext: string;
};

type ProjectItem = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  team: { name: string };
  pdfLink: string;
  problemStatement?: Record<string, unknown>;
  files: Record<string, unknown>;
  techStack: string[];
  createdAt: string;
  hasUploadedPdf: boolean;
};

type ArticleDraft = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  authorName: string;
  authorRole: string;
  paragraphsRaw: string;
  imageId: string;
  imageCaption: string;
};

type GalleryDraft = {
  id: string;
  kind: "photograph" | "drawing";
  title: string;
  description: string;
  imageId: string;
  photographerName: string;
  photographerDept: string;
  photographerYear: string;
  rank: string;
  folderContext: string;
};

type ProjectDraft = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  teamName: string;
  pdfLink: string;
  createdAt: string;
  problemStatementRaw: string;
  filesRaw: string;
  techStackRaw: string;
  uploadedPdfDataUrl: string;
  uploadedPdfName: string;
};

type EditorialDraft = {
  title: string;
  authorName: string;
  authorRole: string;
  date: string;
  contentRaw: string;
  quoteText: string;
  quoteAuthor: string;
};

type TeamMemberItem = {
  id: string;
  name: string;
  role: string;
  department: string;
  yearLabel: string;
  imageId: string;
  linkedin: string;
  github: string;
};

type TeamMemberDraft = {
  id: string;
  name: string;
  role: string;
  department: string;
  yearLabel: string;
  imageId: string;
  linkedin: string;
  github: string;
};

function blankArticleDraft(): ArticleDraft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: "",
    title: "",
    excerpt: "",
    date: today,
    readTime: "",
    authorName: "",
    authorRole: "",
    paragraphsRaw: "",
    imageId: "",
    imageCaption: "",
  };
}

function blankGalleryDraft(): GalleryDraft {
  return {
    id: "",
    kind: "photograph",
    title: "",
    description: "",
    imageId: "",
    photographerName: "",
    photographerDept: "",
    photographerYear: "",
    rank: "",
    folderContext: "",
  };
}

function blankProjectDraft(): ProjectDraft {
  return {
    id: "",
    title: "",
    excerpt: "",
    category: "",
    teamName: "",
    pdfLink: "",
    createdAt: "",
    problemStatementRaw: "{}",
    filesRaw: "{}",
    techStackRaw: "",
    uploadedPdfDataUrl: "",
    uploadedPdfName: "",
  };
}

function blankEditorialDraft(): EditorialDraft {
  return {
    title: "From the Editor's Desk",
    authorName: "",
    authorRole: "",
    date: "",
    contentRaw: "",
    quoteText: "",
    quoteAuthor: "",
  };
}

function blankTeamMemberDraft(): TeamMemberDraft {
  return {
    id: "",
    name: "",
    role: "",
    department: "",
    yearLabel: "",
    imageId: "",
    linkedin: "",
    github: "",
  };
}

function parseJsonObject(raw: string) {
  const value = JSON.parse(raw || "{}");
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function AdminEditor({ currentYear, years }: AdminEditorProps) {
  const availableYears = useMemo(() => {
    const options = new Set<number>();
    for (let y = currentYear - 5; y <= currentYear + 5; y += 1) {
      options.add(y);
    }
    for (const entry of years) {
      options.add(entry.year);
    }
    return [...options].sort((a, b) => b - a);
  }, [currentYear, years]);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [section, setSection] = useState<YearSectionKey>("utkarshi");
  const [sectionSettings, setSectionSettings] = useState<SectionSetting[]>([]);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [hiddenDraft, setHiddenDraft] = useState(false);

  const [articles, setArticles] = useState<CmsArticle[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);

  const [articleDraft, setArticleDraft] = useState<ArticleDraft>(blankArticleDraft);
  const [galleryDraft, setGalleryDraft] = useState<GalleryDraft>(blankGalleryDraft);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(blankProjectDraft);
  const [editorialDraft, setEditorialDraft] = useState<EditorialDraft>(blankEditorialDraft);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [teamDraft, setTeamDraft] = useState<TeamMemberDraft>(blankTeamMemberDraft);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isArticleSection = CMS_SECTIONS.includes(section as CmsSection);

  const loadSectionContent = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      if (isArticleSection) {
        const res = await fetch(`/api/admin/articles?year=${selectedYear}&section=${section}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to load articles");
        setArticles(data.articles);
      } else if (section === "gallery") {
        const res = await fetch(`/api/admin/gallery?year=${selectedYear}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to load gallery items");
        setGalleryItems(data.items);
      } else if (section === "projects") {
        const res = await fetch(`/api/admin/projects?year=${selectedYear}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to load projects");
        setProjectItems(data.items);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load section content");
    } finally {
      setLoading(false);
    }
  }, [isArticleSection, section, selectedYear]);

  const loadSectionSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/sections?year=${selectedYear}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to load section settings");
      const settings = data.settings as SectionSetting[];
      setSectionSettings(settings);
      const current = settings.find((item) => item.sectionKey === section);
      setDisplayNameDraft(current?.displayName ?? section);
      setHiddenDraft(Boolean(current?.isHidden));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load section settings");
    }
  }, [section, selectedYear]);

  const loadEditorial = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/editorial", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to load editorial");
      const editorial = data.editorial as {
        title: string;
        author: { name: string; role: string };
        date: string;
        content: string[];
        quote: { text: string; author: string };
      };
      setEditorialDraft({
        title: editorial.title ?? "From the Editor's Desk",
        authorName: editorial.author?.name ?? "",
        authorRole: editorial.author?.role ?? "",
        date: editorial.date ?? "",
        contentRaw: (editorial.content ?? []).join("\n"),
        quoteText: editorial.quote?.text ?? "",
        quoteAuthor: editorial.quote?.author ?? "",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load editorial");
    }
  }, []);

  const loadTeamMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/team?year=${selectedYear}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to load team members");
      setTeamMembers(data.items ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load team members");
    }
  }, [selectedYear]);

  useEffect(() => {
    loadSectionContent();
  }, [loadSectionContent]);

  useEffect(() => {
    loadSectionSettings();
  }, [loadSectionSettings]);

  useEffect(() => {
    loadEditorial();
  }, [loadEditorial]);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  useEffect(() => {
    const current = sectionSettings.find((item) => item.sectionKey === section);
    setDisplayNameDraft(current?.displayName ?? section);
    setHiddenDraft(Boolean(current?.isHidden));
  }, [section, sectionSettings]);

  const sectionLabelMap = useMemo(() => {
    const map = new Map<YearSectionKey, SectionSetting>();
    for (const item of sectionSettings) map.set(item.sectionKey, item);
    return map;
  }, [sectionSettings]);

  function resetDrafts() {
    setEditingId(null);
    setEditingTeamId(null);
    setArticleDraft(blankArticleDraft());
    setGalleryDraft(blankGalleryDraft());
    setProjectDraft(blankProjectDraft());
    setTeamDraft(blankTeamMemberDraft());
  }

  async function saveArticle(e: React.FormEvent) {
    e.preventDefault();
    const id = articleDraft.id.trim() || crypto.randomUUID();
    const payload = {
      id,
      year: selectedYear,
      section,
      title: articleDraft.title.trim(),
      excerpt: articleDraft.excerpt.trim(),
      date: articleDraft.date.trim(),
      readTime: articleDraft.readTime.trim(),
      author: { name: articleDraft.authorName.trim(), role: articleDraft.authorRole.trim() },
      paragraphs: articleDraft.paragraphsRaw.split("\n").map((p) => p.trim()).filter(Boolean),
      images: articleDraft.imageId
        ? [{ id: articleDraft.imageId.trim(), caption: articleDraft.imageCaption.trim() || undefined, position: 1 }]
        : [],
    };
    const res = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return setMessage(data.error ?? "Failed to save article");
    setMessage(editingId ? "Article updated." : "Article created.");
    resetDrafts();
    await loadSectionContent();
  }

  async function saveGallery(e: React.FormEvent) {
    e.preventDefault();
    const id = galleryDraft.id.trim() || crypto.randomUUID();
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        year: selectedYear,
        kind: galleryDraft.kind,
        title: galleryDraft.title.trim(),
        description: galleryDraft.description.trim(),
        imageId: galleryDraft.imageId.trim(),
        photographer: {
          name: galleryDraft.photographerName.trim(),
          dept: galleryDraft.photographerDept.trim(),
          year: galleryDraft.photographerYear.trim(),
        },
        rank: galleryDraft.rank.trim(),
        folderContext: galleryDraft.folderContext.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return setMessage(data.error ?? "Failed to save gallery item");
    setMessage(editingId ? "Gallery item updated." : "Gallery item created.");
    resetDrafts();
    await loadSectionContent();
  }

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    try {
      const id = projectDraft.id.trim() || crypto.randomUUID();
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          year: selectedYear,
          title: projectDraft.title.trim(),
          excerpt: projectDraft.excerpt.trim(),
          category: projectDraft.category.trim(),
          teamName: projectDraft.teamName.trim(),
          pdfLink: projectDraft.pdfLink.trim(),
          createdAt: projectDraft.createdAt.trim(),
          problemStatement: parseJsonObject(projectDraft.problemStatementRaw),
          files: parseJsonObject(projectDraft.filesRaw),
          techStack: projectDraft.techStackRaw
            .split(",")
            .map((tech) => tech.trim())
            .filter(Boolean),
          uploadedPdf: projectDraft.uploadedPdfDataUrl
            ? {
                dataUrl: projectDraft.uploadedPdfDataUrl,
                fileName: projectDraft.uploadedPdfName || "project.pdf",
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return setMessage(data.error ?? "Failed to save project");
      setMessage(editingId ? "Project updated." : "Project created.");
      resetDrafts();
      await loadSectionContent();
    } catch {
      setMessage("Invalid JSON in problemStatement/files.");
    }
  }

  async function saveEditorial(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/editorial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editorialDraft.title.trim(),
        author: {
          name: editorialDraft.authorName.trim(),
          role: editorialDraft.authorRole.trim(),
        },
        date: editorialDraft.date.trim(),
        content: editorialDraft.contentRaw
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        quote: {
          text: editorialDraft.quoteText.trim(),
          author: editorialDraft.quoteAuthor.trim(),
        },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return setMessage(data.error ?? "Failed to save editorial");
    setMessage("Editorial updated.");
    await loadEditorial();
  }

  async function saveTeamMember(e: React.FormEvent) {
    e.preventDefault();
    const id = teamDraft.id.trim() || crypto.randomUUID();
    const alreadyExists = teamMembers.some((item) => item.id === id);
    if (!alreadyExists && teamMembers.length >= 10) {
      setMessage("Maximum 10 team members are allowed per year.");
      return;
    }
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: selectedYear,
        id,
        name: teamDraft.name.trim(),
        role: teamDraft.role.trim(),
        department: teamDraft.department.trim(),
        yearLabel: teamDraft.yearLabel.trim(),
        imageId: teamDraft.imageId.trim(),
        linkedin: teamDraft.linkedin.trim(),
        github: teamDraft.github.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return setMessage(data.error ?? "Failed to save team member");
    setMessage(editingTeamId ? "Team member updated." : "Team member created.");
    setEditingTeamId(null);
    setTeamDraft(blankTeamMemberDraft());
    await loadTeamMembers();
  }

  async function onArticleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setArticleDraft((prev) => ({ ...prev, imageId: dataUrl }));
    e.target.value = "";
  }

  async function onGalleryImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setGalleryDraft((prev) => ({ ...prev, imageId: dataUrl }));
    e.target.value = "";
  }

  async function onProjectPdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMessage("Please upload a PDF file only.");
      e.target.value = "";
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setProjectDraft((prev) => ({
      ...prev,
      uploadedPdfDataUrl: dataUrl,
      uploadedPdfName: file.name || "project.pdf",
      pdfLink: "",
    }));
    setMessage(`PDF selected: ${file.name}`);
    e.target.value = "";
  }

  async function onTeamImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setTeamDraft((prev) => ({ ...prev, imageId: dataUrl }));
    e.target.value = "";
  }

  async function deleteById(id: string) {
    const endpoint = isArticleSection ? "/api/admin/articles" : section === "gallery" ? "/api/admin/gallery" : "/api/admin/projects";
    const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) return setMessage(data.error ?? "Failed to delete");
    if (editingId === id) resetDrafts();
    setMessage("Deleted.");
    await loadSectionContent();
  }

  async function deleteTeamMemberById(id: string) {
    const res = await fetch(`/api/admin/team?year=${selectedYear}&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return setMessage(data.error ?? "Failed to delete team member");
    if (editingTeamId === id) {
      setEditingTeamId(null);
      setTeamDraft(blankTeamMemberDraft());
    }
    setMessage("Team member deleted.");
    await loadTeamMembers();
  }

  function loadForEdit(id: string) {
    if (isArticleSection) {
      const item = articles.find((entry) => entry.id === id);
      if (!item) return;
      setEditingId(id);
      setArticleDraft({
        id: item.id,
        title: item.title,
        excerpt: item.excerpt,
        date: item.date,
        readTime: item.readTime,
        authorName: item.author.name,
        authorRole: item.author.role,
        paragraphsRaw: (item.paragraphs ?? []).join("\n"),
        imageId: item.images?.[0]?.id ?? "",
        imageCaption: item.images?.[0]?.caption ?? "",
      });
      return;
    }
    if (section === "gallery") {
      const item = galleryItems.find((entry) => entry.id === id);
      if (!item) return;
      setEditingId(id);
      setGalleryDraft({
        id: item.id,
        kind: item.kind,
        title: item.title,
        description: item.description,
        imageId: item.imageId,
        photographerName: item.photographer.name,
        photographerDept: item.photographer.dept,
        photographerYear: item.photographer.year,
        rank: item.rank,
        folderContext: item.folderContext,
      });
      return;
    }
    const item = projectItems.find((entry) => entry.id === id);
    if (!item) return;
    setEditingId(id);
    setProjectDraft({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      category: item.category,
      teamName: item.team.name,
      pdfLink: item.pdfLink ?? "",
      createdAt: item.createdAt,
      problemStatementRaw: JSON.stringify(item.problemStatement ?? {}, null, 2),
      filesRaw: JSON.stringify(item.files ?? {}, null, 2),
      techStackRaw: (item.techStack ?? []).join(", "),
      uploadedPdfDataUrl: "",
      uploadedPdfName: "",
    });
  }

  function loadTeamForEdit(id: string) {
    const member = teamMembers.find((item) => item.id === id);
    if (!member) return;
    setEditingTeamId(id);
    setTeamDraft({
      id: member.id,
      name: member.name,
      role: member.role,
      department: member.department,
      yearLabel: member.yearLabel,
      imageId: member.imageId,
      linkedin: member.linkedin,
      github: member.github,
    });
  }

  async function saveSectionSettings() {
    const res = await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: selectedYear,
        sectionKey: section,
        displayName: displayNameDraft.trim(),
        isHidden: hiddenDraft,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return setMessage(data.error ?? "Failed to save section settings");
    setMessage("Section settings saved.");
    await loadSectionSettings();
  }

  async function archiveCurrentYear() {
    if (!window.confirm("Archive current year and create a new blank year?")) return;
    const res = await fetch("/api/admin/archive", { method: "POST" });
    const data = await res.json();
    if (!res.ok || !data.ok) return setMessage(data.error ?? "Archive failed");
    setMessage(`Archived ${data.archivedYear}. New current year: ${data.newCurrentYear}. Reloading...`);
    window.location.reload();
  }

  async function makeCurrentYear() {
    const res = await fetch("/api/admin/years/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: selectedYear }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return setMessage(data.error ?? "Failed to set current year");
    setMessage(`Year ${selectedYear} is now current. Reloading...`);
    window.location.reload();
  }

  const currentList = isArticleSection
    ? articles.map((item) => ({ id: item.id, title: item.title }))
    : section === "gallery"
      ? galleryItems.map((item) => ({ id: item.id, title: item.title }))
      : projectItems.map((item) => ({ id: item.id, title: item.title }));

  return (
    <div className="space-y-6">
      <div className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Year Management</h2>
        <p className="text-sm text-gray-600">Current year: {currentYear}</p>
        <div className="flex gap-2">
          <button onClick={archiveCurrentYear} className="bg-black text-white px-4 py-2 rounded">
            Archive Current Year + Create Next
          </button>
          <button onClick={makeCurrentYear} className="border px-4 py-2 rounded">
            Set Selected Year as Current
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm font-medium">Year</span>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full border rounded px-3 py-2">
            {availableYears.map((year) => (
              <option value={year} key={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">Section</span>
          <select value={section} onChange={(e) => setSection(e.target.value as YearSectionKey)} className="w-full border rounded px-3 py-2">
            {YEAR_SECTION_KEYS.map((item) => (
              <option key={item} value={item}>
                {sectionLabelMap.get(item)?.displayName ?? item}
                {sectionLabelMap.get(item)?.isHidden ? " (hidden)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Section Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={displayNameDraft}
            onChange={(e) => setDisplayNameDraft(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Section display name"
          />
          <label className="flex items-center gap-2 border rounded px-3 py-2">
            <input type="checkbox" checked={hiddenDraft} onChange={(e) => setHiddenDraft(e.target.checked)} />
            <span>Hide this section for selected year</span>
          </label>
        </div>
        <button onClick={saveSectionSettings} className="border px-4 py-2 rounded">
          Save Section Settings
        </button>
      </div>

      <form onSubmit={saveEditorial} className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Editorial (All Years)</h2>
        <input
          value={editorialDraft.title}
          onChange={(e) => setEditorialDraft((p) => ({ ...p, title: e.target.value }))}
          className="w-full border rounded px-3 py-2"
          placeholder="Editorial title"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={editorialDraft.authorName}
            onChange={(e) => setEditorialDraft((p) => ({ ...p, authorName: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Author name"
          />
          <input
            value={editorialDraft.authorRole}
            onChange={(e) => setEditorialDraft((p) => ({ ...p, authorRole: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Author role"
          />
          <input
            value={editorialDraft.date}
            onChange={(e) => setEditorialDraft((p) => ({ ...p, date: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Date text"
          />
        </div>
        <textarea
          value={editorialDraft.contentRaw}
          onChange={(e) => setEditorialDraft((p) => ({ ...p, contentRaw: e.target.value }))}
          className="w-full border rounded px-3 py-2 h-28"
          placeholder="Editorial content (one paragraph per line)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={editorialDraft.quoteText}
            onChange={(e) => setEditorialDraft((p) => ({ ...p, quoteText: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Quote text"
          />
          <input
            value={editorialDraft.quoteAuthor}
            onChange={(e) => setEditorialDraft((p) => ({ ...p, quoteAuthor: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Quote author"
          />
        </div>
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Save Editorial
        </button>
      </form>

      <div className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Our Team ({selectedYear})</h2>
        <p className="text-xs text-gray-600">Maximum 10 members for each year.</p>
        <form onSubmit={saveTeamMember} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={teamDraft.id}
              onChange={(e) => setTeamDraft((p) => ({ ...p, id: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="ID (optional)"
            />
            <input
              value={teamDraft.name}
              onChange={(e) => setTeamDraft((p) => ({ ...p, name: e.target.value }))}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Name"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={teamDraft.role}
              onChange={(e) => setTeamDraft((p) => ({ ...p, role: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="Role"
            />
            <input
              value={teamDraft.department}
              onChange={(e) => setTeamDraft((p) => ({ ...p, department: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="Department"
            />
            <input
              value={teamDraft.yearLabel}
              onChange={(e) => setTeamDraft((p) => ({ ...p, yearLabel: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="Year label (e.g. 3rd Year)"
            />
          </div>
          <input
            value={teamDraft.imageId}
            onChange={(e) => setTeamDraft((p) => ({ ...p, imageId: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Image id / URL / data URL"
          />
          <input type="file" accept="image/*" onChange={onTeamImageUpload} className="w-full border rounded px-3 py-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={teamDraft.linkedin}
              onChange={(e) => setTeamDraft((p) => ({ ...p, linkedin: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="LinkedIn profile URL"
            />
            <input
              value={teamDraft.github}
              onChange={(e) => setTeamDraft((p) => ({ ...p, github: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="GitHub profile URL"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-black text-white px-4 py-2 rounded">
              {editingTeamId ? "Update Member" : "Add Member"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingTeamId(null);
                setTeamDraft(blankTeamMemberDraft());
              }}
              className="border px-4 py-2 rounded"
            >
              Reset
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {teamMembers.map((member) => (
            <div key={member.id} className="border rounded px-3 py-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-gray-500">
                  {member.role} • {member.department} • {member.yearLabel}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadTeamForEdit(member.id)} className="border rounded px-3 py-1 text-sm">
                  Edit
                </button>
                <button onClick={() => deleteTeamMemberById(member.id)} className="border rounded px-3 py-1 text-sm text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {teamMembers.length === 0 ? <p className="text-sm text-gray-500">No team members added for this year.</p> : null}
        </div>
      </div>

      {isArticleSection ? (
        <form onSubmit={saveArticle} className="border rounded p-4 space-y-3">
          <h2 className="text-lg font-semibold">{editingId ? "Edit Article" : "New Article"}</h2>
          <input value={articleDraft.id} onChange={(e) => setArticleDraft((p) => ({ ...p, id: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="ID (optional)" />
          <input value={articleDraft.title} onChange={(e) => setArticleDraft((p) => ({ ...p, title: e.target.value }))} required className="w-full border rounded px-3 py-2" placeholder="Title" />
          <input value={articleDraft.excerpt} onChange={(e) => setArticleDraft((p) => ({ ...p, excerpt: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Excerpt" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="date" value={articleDraft.date} onChange={(e) => setArticleDraft((p) => ({ ...p, date: e.target.value }))} className="w-full border rounded px-3 py-2" />
            <input value={articleDraft.readTime} onChange={(e) => setArticleDraft((p) => ({ ...p, readTime: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Read time" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={articleDraft.authorName} onChange={(e) => setArticleDraft((p) => ({ ...p, authorName: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Author name" />
            <input value={articleDraft.authorRole} onChange={(e) => setArticleDraft((p) => ({ ...p, authorRole: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Author role" />
          </div>
          <textarea value={articleDraft.paragraphsRaw} onChange={(e) => setArticleDraft((p) => ({ ...p, paragraphsRaw: e.target.value }))} className="w-full border rounded px-3 py-2 h-28" placeholder="Paragraphs (one per line)" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={articleDraft.imageId} onChange={(e) => setArticleDraft((p) => ({ ...p, imageId: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Cover image id" />
            <input value={articleDraft.imageCaption} onChange={(e) => setArticleDraft((p) => ({ ...p, imageCaption: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Image caption" />
          </div>
          <input type="file" accept="image/*" onChange={onArticleImageUpload} className="w-full border rounded px-3 py-2" />
          <div className="flex gap-2">
            <button type="submit" className="bg-black text-white px-4 py-2 rounded">{editingId ? "Update" : "Create"}</button>
            <button type="button" onClick={resetDrafts} className="border px-4 py-2 rounded">Reset</button>
          </div>
        </form>
      ) : null}

      {section === "gallery" ? (
        <form onSubmit={saveGallery} className="border rounded p-4 space-y-3">
          <h2 className="text-lg font-semibold">{editingId ? "Edit Gallery Item" : "New Gallery Item"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={galleryDraft.id} onChange={(e) => setGalleryDraft((p) => ({ ...p, id: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="ID (optional)" />
            <select value={galleryDraft.kind} onChange={(e) => setGalleryDraft((p) => ({ ...p, kind: e.target.value as GalleryDraft["kind"] }))} className="w-full border rounded px-3 py-2">
              <option value="photograph">Photograph</option>
              <option value="drawing">Drawing</option>
            </select>
          </div>
          <input value={galleryDraft.title} onChange={(e) => setGalleryDraft((p) => ({ ...p, title: e.target.value }))} required className="w-full border rounded px-3 py-2" placeholder="Title" />
          <input value={galleryDraft.description} onChange={(e) => setGalleryDraft((p) => ({ ...p, description: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Description" />
          <input value={galleryDraft.imageId} onChange={(e) => setGalleryDraft((p) => ({ ...p, imageId: e.target.value }))} required className="w-full border rounded px-3 py-2" placeholder="Image id (google path)" />
          <input type="file" accept="image/*" onChange={onGalleryImageUpload} className="w-full border rounded px-3 py-2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={galleryDraft.photographerName} onChange={(e) => setGalleryDraft((p) => ({ ...p, photographerName: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Photographer name" />
            <input value={galleryDraft.photographerDept} onChange={(e) => setGalleryDraft((p) => ({ ...p, photographerDept: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Dept" />
            <input value={galleryDraft.photographerYear} onChange={(e) => setGalleryDraft((p) => ({ ...p, photographerYear: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Year" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={galleryDraft.rank} onChange={(e) => setGalleryDraft((p) => ({ ...p, rank: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Rank (for drawings)" />
            <input value={galleryDraft.folderContext} onChange={(e) => setGalleryDraft((p) => ({ ...p, folderContext: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Folder context (for drawings)" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-black text-white px-4 py-2 rounded">{editingId ? "Update" : "Create"}</button>
            <button type="button" onClick={resetDrafts} className="border px-4 py-2 rounded">Reset</button>
          </div>
        </form>
      ) : null}

      {section === "projects" ? (
        <form onSubmit={saveProject} className="border rounded p-4 space-y-3">
          <h2 className="text-lg font-semibold">{editingId ? "Edit Project" : "New Project"}</h2>
          <input value={projectDraft.id} onChange={(e) => setProjectDraft((p) => ({ ...p, id: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="ID (optional)" />
          <input value={projectDraft.title} onChange={(e) => setProjectDraft((p) => ({ ...p, title: e.target.value }))} required className="w-full border rounded px-3 py-2" placeholder="Title" />
          <input value={projectDraft.excerpt} onChange={(e) => setProjectDraft((p) => ({ ...p, excerpt: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Excerpt" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={projectDraft.category} onChange={(e) => setProjectDraft((p) => ({ ...p, category: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Category" />
            <input value={projectDraft.teamName} onChange={(e) => setProjectDraft((p) => ({ ...p, teamName: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Team name" />
            <input value={projectDraft.createdAt} onChange={(e) => setProjectDraft((p) => ({ ...p, createdAt: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Created at text" />
          </div>
          <input
            value={projectDraft.pdfLink}
            onChange={(e) => setProjectDraft((p) => ({ ...p, pdfLink: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="PDF link (Google Drive / GitHub / direct PDF URL)"
          />
          <input type="file" accept="application/pdf" onChange={onProjectPdfUpload} className="w-full border rounded px-3 py-2" />
          {projectDraft.uploadedPdfName ? (
            <p className="text-xs text-gray-600">Selected PDF upload: {projectDraft.uploadedPdfName}</p>
          ) : null}
          <input value={projectDraft.techStackRaw} onChange={(e) => setProjectDraft((p) => ({ ...p, techStackRaw: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Tech stack (comma separated)" />
          <textarea value={projectDraft.problemStatementRaw} onChange={(e) => setProjectDraft((p) => ({ ...p, problemStatementRaw: e.target.value }))} className="w-full border rounded px-3 py-2 h-24" placeholder="Problem statement JSON" />
          <textarea value={projectDraft.filesRaw} onChange={(e) => setProjectDraft((p) => ({ ...p, filesRaw: e.target.value }))} className="w-full border rounded px-3 py-2 h-24" placeholder="Files JSON" />
          <div className="flex gap-2">
            <button type="submit" className="bg-black text-white px-4 py-2 rounded">{editingId ? "Update" : "Create"}</button>
            <button type="button" onClick={resetDrafts} className="border px-4 py-2 rounded">Reset</button>
          </div>
        </form>
      ) : null}

      <div className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Section Items ({currentList.length})</h2>
        {loading ? <p className="text-sm text-gray-500">Loading...</p> : null}
        {!loading && currentList.length === 0 ? <p className="text-sm text-gray-500">No items in this section.</p> : null}
        <div className="space-y-2">
          {currentList.map((item) => (
            <div key={item.id} className="border rounded px-3 py-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-gray-500">{item.id}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadForEdit(item.id)} className="border rounded px-3 py-1 text-sm">Edit</button>
                <button onClick={() => deleteById(item.id)} className="border rounded px-3 py-1 text-sm text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
