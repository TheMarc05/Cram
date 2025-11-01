const languageExtensions: Record<string, string> = {
  // Web
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".vue": "vue",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",

  // Backend
  ".py": "python",
  ".java": "java",
  ".cs": "csharp",
  ".go": "go",
  ".rb": "ruby",
  ".php": "php",
  ".rs": "rust",

  // Systems
  ".c": "c",
  ".cpp": "cpp",
  ".h": "c",
  ".hpp": "cpp",

  // Others
  ".sql": "sql",
  ".sh": "bash",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
};

export function detectLanguage(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  return languageExtensions[ext] || "plaintext";
}
