import crypto from "crypto";

export interface DiffChange {
  type: "add" | "delete" | "modify";
  lineNumber: number;
  oldLine?: string;
  newLine?: string;
  contextBefore: string[];
  contextAfter: string[];
}

export interface DiffResult {
  hasChanges: boolean;
  changes: DiffChange[];
  addedLines: number[];
  modifiedLines: number[];
  deletedLines: number[];
  totalChanges: number;
}

export class DiffService {
  /**
   * Calculate SHA-256 hash of content
   */
  static calculateHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Simple line-based diff algorithm
   */
  static calculateDiff(
    oldContent: string,
    newContent: string,
    contextLines: number = 3
  ): DiffResult {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");

    const changes: DiffChange[] = [];
    const addedLines: number[] = [];
    const modifiedLines: number[] = [];
    const deletedLines: number[] = [];

    const maxLength = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined && newLine !== undefined) {
        // Line added
        addedLines.push(i + 1);
        changes.push({
          type: "add",
          lineNumber: i + 1,
          newLine: newLine,
          contextBefore: this.getContext(newLines, i, contextLines, "before"),
          contextAfter: this.getContext(newLines, i, contextLines, "after"),
        });
      } else if (oldLine !== undefined && newLine === undefined) {
        // Line deleted
        deletedLines.push(i + 1);
        changes.push({
          type: "delete",
          lineNumber: i + 1,
          oldLine: oldLine,
          contextBefore: this.getContext(oldLines, i, contextLines, "before"),
          contextAfter: this.getContext(oldLines, i, contextLines, "after"),
        });
      } else if (oldLine !== newLine) {
        // Line modified
        modifiedLines.push(i + 1);
        changes.push({
          type: "modify",
          lineNumber: i + 1,
          oldLine: oldLine,
          newLine: newLine,
          contextBefore: this.getContext(newLines, i, contextLines, "before"),
          contextAfter: this.getContext(newLines, i, contextLines, "after"),
        });
      }
    }

    return {
      hasChanges: changes.length > 0,
      changes,
      addedLines,
      modifiedLines,
      deletedLines,
      totalChanges: changes.length,
    };
  }

  /**
   * Get context lines around a specific line
   */
  private static getContext(
    lines: string[],
    lineIndex: number,
    contextSize: number,
    direction: "before" | "after"
  ): string[] {
    if (direction === "before") {
      const start = Math.max(0, lineIndex - contextSize);
      return lines.slice(start, lineIndex);
    } else {
      const end = Math.min(lines.length, lineIndex + contextSize + 1);
      return lines.slice(lineIndex + 1, end);
    }
  }

  /**
   * Build focused code snippet with only changed lines and context
   */
  static buildIncrementalSnippet(
    newContent: string,
    diffResult: DiffResult,
    contextLines: number = 5
  ): string {
    const lines = newContent.split("\n");
    const relevantLineNumbers = new Set<number>();

    // Collect all relevant line numbers (changes + context)
    [...diffResult.addedLines, ...diffResult.modifiedLines].forEach((lineNum) => {
      for (
        let i = Math.max(1, lineNum - contextLines);
        i <= Math.min(lines.length, lineNum + contextLines);
        i++
      ) {
        relevantLineNumbers.add(i);
      }
    });

    // Build snippet with line numbers
    const snippetLines: string[] = [];
    const sortedLines = Array.from(relevantLineNumbers).sort((a, b) => a - b);

    sortedLines.forEach((lineNum, idx) => {
      if (idx > 0 && lineNum - sortedLines[idx - 1] > 1) {
        snippetLines.push("...");
      }
      const isChanged =
        diffResult.addedLines.includes(lineNum) ||
        diffResult.modifiedLines.includes(lineNum);
      const prefix = isChanged ? "+ " : "  ";
      snippetLines.push(`${prefix}${lineNum}: ${lines[lineNum - 1]}`);
    });

    return snippetLines.join("\n");
  }

  /**
   * Calculate similarity percentage between two strings
   */
  static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 100.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return ((longer.length - editDistance) / longer.length) * 100;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

