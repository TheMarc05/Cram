import { AnalysisResult, AnalysisSummary, Issue } from "../types/review";
import axios from "axios";

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export class AIService {
  private ollamaBaseUrl: string;
  private model: string;

  constructor(
    ollamaBaseUrl: string = process.env.OLLAMA_URL || "http://localhost:11434",
    model: string = process.env.OLLAMA_MODEL || "codellama:7b-instruct"
  ) {
    this.ollamaBaseUrl = ollamaBaseUrl;
    this.model = model;
  }

  private buildPrompt(
    code: string,
    language: string,
    filename: string,
    customRules?: string
  ): string {
    let prompt = `You are an expert code reviewer. Analyze the following ${language} code and identify issues.

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations before or after the JSON. Start directly with { and end with }.

Required JSON format (respond EXACTLY like this):
{
  "issues": [
    {
      "line": 10,
      "severity": "high",
      "category": "security",
      "title": "SQL Injection vulnerability",
      "description": "User input is directly concatenated into SQL query without sanitization",
      "suggestion": "Use parameterized queries or prepared statements",
      "fixedCode": "PreparedStatement stmt = conn.prepareStatement(\"SELECT * FROM users WHERE id = ?\");",
      "reasoning": "Direct string concatenation allows malicious SQL injection attacks"
    }
  ]
}

IMPORTANT RULES:
- Respond ONLY with the JSON object, nothing else
- Do NOT wrap JSON in markdown code blocks (\`\`\`json\`\`\`)
- Do NOT add text before or after the JSON
- Escape quotes properly in strings
- All string values must be in double quotes
- Line numbers must be integers
- Severity must be: "critical", "high", "medium", "low", or "info"
- Category must be: "security", "bug", "performance", "style", or "best-practice"

FILE: ${filename}
LANGUAGE: ${language}
`;
    if (customRules) {
      prompt += `\nCUSTOM RULES TO ENFORCE:\n${customRules}\n`;
    }
    prompt += `
CODE TO ANALYZE:
${code}

Focus on:
1. Security vulnerabilities (SQL injection, XSS, auth issues)
2. Logic bugs and potential runtime errors
3. Performance bottlenecks
4. Code style and best practices
5. Missing error handling

Provide actionable, specific feedback. Include line numbers. Be concise but thorough.

NOW RESPOND WITH ONLY THE JSON OBJECT (no other text):`;
    return prompt;
  }

  async analyzeCode(
    code: string,
    language: string,
    filename: string,
    customRules?: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      console.log(`Starting AI analysis for ${filename}...`);

      const prompt = this.buildPrompt(code, language, filename, customRules);

      const promptTokens = Math.ceil(prompt.length / 4);
      console.log(`Sending request (~${promptTokens} tokens)...`);

      const response = await axios.post<OllamaResponse>(
        `${this.ollamaBaseUrl}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            num_predict: 4000,
          },
        },
        {
          timeout: 600000,
        }
      );

      const rawResponse = response.data.response;
      const responseTokens = Math.ceil(rawResponse.length / 4);
      const totalTokens = promptTokens + responseTokens;

      console.log(
        `AI response received (${rawResponse.length} chars, ~${totalTokens} tokens)`
      );

      const parsedData = this.parseAIResponse(rawResponse);
      const summary = this.calculateSummary(parsedData.issues);
      const processingTime = Date.now() - startTime;

      return {
        issues: parsedData.issues,
        summary,
        metadata: {
          model: this.model,
          processingTime,
          language,
          tokensUsed: totalTokens,
          promptTokens,
          responseTokens,
        },
      };
    } catch (error: any) {
      console.error("AI analysis failed:", error.message);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  async analyzeCodeIncremental(
    code: string,
    language: string,
    filename: string,
    changedLines: number[],
    diffSnippet: string,
    customRules?: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      console.log(
        `🔄 Starting INCREMENTAL AI analysis for ${filename}... (${changedLines.length} changes)`
      );

      const prompt = this.buildIncrementalPrompt(
        code,
        language,
        filename,
        changedLines,
        diffSnippet,
        customRules
      );

      const promptTokens = Math.ceil(prompt.length / 4);
      console.log(`Sending incremental request (~${promptTokens} tokens)...`);

      const response = await axios.post<OllamaResponse>(
        `${this.ollamaBaseUrl}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            num_predict: 2000,
          },
        },
        {
          timeout: 600000,
        }
      );

      const rawResponse = response.data.response;
      const responseTokens = Math.ceil(rawResponse.length / 4);
      const totalTokens = promptTokens + responseTokens;

      console.log(
        `✅ Incremental AI response received (${rawResponse.length} chars, ~${totalTokens} tokens)`
      );

      const parsedData = this.parseAIResponse(rawResponse);
      const summary = this.calculateSummary(parsedData.issues);
      const processingTime = Date.now() - startTime;

      return {
        issues: parsedData.issues,
        summary,
        metadata: {
          model: this.model,
          processingTime,
          language,
          tokensUsed: totalTokens,
          promptTokens,
          responseTokens,
        },
      };
    } catch (error: any) {
      console.error("Incremental AI analysis failed:", error.message);
      throw new Error(`Incremental AI analysis failed: ${error.message}`);
    }
  }

  private buildIncrementalPrompt(
    code: string,
    language: string,
    filename: string,
    changedLines: number[],
    diffSnippet: string,
    customRules?: string
  ): string {
    let prompt = `You are an expert code reviewer. Perform an INCREMENTAL REVIEW of recently changed code.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "issues": [
    {
      "line": <line_number>,
      "severity": "critical|high|medium|low|info",
      "category": "security|bug|performance|style|best-practice",
      "title": "Brief title",
      "description": "Detailed explanation",
      "suggestion": "How to fix it",
      "fixedCode": "Corrected code snippet (optional)",
      "reasoning": "Why this is an issue"
    }
  ]
}

FILE: ${filename}
LANGUAGE: ${language}
CHANGED LINES: ${changedLines.join(", ")}

FOCUS: Review ONLY the following changed/added lines and their immediate context:

${diffSnippet}

`;
    if (customRules) {
      prompt += `CUSTOM RULES TO ENFORCE:\n${customRules}\n\n`;
    }
    prompt += `
Review criteria:
1. NEW Security vulnerabilities in changed code
2. NEW Logic bugs introduced by changes
3. Performance impact of new code
4. Style consistency with existing code
5. Missing error handling in new code
6. Breaking changes or regressions

Focus ONLY on the changed lines. Be concise but thorough.`;
    return prompt;
  }

  async generateCommentReply(
    userComment: string,
    issue: any,
    codeContext: string,
    language: string
  ): Promise<string> {
    try {
      console.log(`🤖 Generating AI reply to comment...`);

      const prompt = `You are an AI code review assistant helping a developer.

CONTEXT:
- Language: ${language}
- Issue: ${issue.title} (${issue.severity})
- Problem at line ${issue.line}: ${issue.description}

CODE CONTEXT:
\`\`\`${language}
${codeContext}
\`\`\`

USER COMMENT:
"${userComment}"

TASK:
Respond to the user's comment in a helpful, concise way (2-3 sentences max).
- If they ask for clarification, explain the issue better
- If they ask for alternative solutions, provide them
- If they disagree, respectfully explain your reasoning
- Be friendly and supportive

IMPORTANT: Respond ONLY with plain text (no JSON, no markdown formatting).`;

      const response = await axios.post<OllamaResponse>(
        `${this.ollamaBaseUrl}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7, //more creative for conversation
            top_p: 0.9,
            num_predict: 200, //short responses
          },
        },
        {
          timeout: 60000, //1 min for replies
        }
      );

      const reply = response.data.response.trim();
      console.log(`✅ AI reply generated (${reply.length} chars)`);
      return reply;
    } catch (error: any) {
      console.error("❌ AI reply generation failed:", error.message);
      // Fallback generic response
      return "I'm here to help! Could you provide more details about your question?";
    }
  }

  private parseAIResponse(response: string): { issues: Issue[] } {
    try {
      console.log(`🔍 Parsing AI response (${response.length} chars)...`);
      
      let cleanedResponse = response.trim();
      const jsonStartIndex = cleanedResponse.indexOf('{');
      const jsonEndIndex = cleanedResponse.lastIndexOf('}');

      if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex <= jsonStartIndex) {
        console.warn("⚠️  No valid JSON found in AI response");
        throw new Error("No valid JSON found");
      }

      let jsonString = cleanedResponse.substring(jsonStartIndex, jsonEndIndex + 1);

      jsonString = jsonString
        .replace(/```[\s\S]*?```/g, '""')
        .replace(/`([^`]+)`/g, '"$1"')
        .replace(/\n/g, ' ')
        .replace(/\r/g, '');

      let parsed;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        try {
          parsed = JSON.parse(jsonString);
          break;
        } catch (parseError: any) {
          attempts++;
          const errorMsg = parseError.message || '';
          
          if (errorMsg.includes("Expected ',' or ']'")) {
            const posMatch = errorMsg.match(/position (\d+)/);
            if (posMatch) {
              const pos = parseInt(posMatch[1]);
              if (pos > 0 && pos < jsonString.length - 1) {
                const beforePos = jsonString.substring(0, pos);
                const afterPos = jsonString.substring(pos);
                
                if (!beforePos.trim().endsWith(',')) {
                  jsonString = beforePos.trim() + ',' + afterPos.trim();
                  console.log(`🔧 Added missing comma at position ${pos}`);
                  continue;
                }
              }
            }
          }

          if (errorMsg.includes("Unexpected token")) {
            const posMatch = errorMsg.match(/position (\d+)/);
            if (posMatch) {
              const pos = parseInt(posMatch[1]);
              const problemChar = jsonString[pos];
              
              if (problemChar === '\n' || problemChar === '\r' || problemChar === '\t') {
                jsonString = jsonString.substring(0, pos) + ' ' + jsonString.substring(pos + 1);
                console.log(`🔧 Replaced problematic character at position ${pos}`);
                continue;
              }
            }
          }

          if (attempts === 3) {
            const issuesMatch = jsonString.match(/"issues"\s*:\s*\[([\s\S]*?)\]/);
            if (issuesMatch) {
              const issuesContent = issuesMatch[1];
              const issueMatches = issuesContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || [];
              
              if (issueMatches.length > 0) {
                const fixedIssues = issueMatches.map((issue: string) => {
                  try {
                    return JSON.parse(issue);
                  } catch {
                    return null;
                  }
                }).filter(Boolean);

                if (fixedIssues.length > 0) {
                  console.log(`🔧 Extracted ${fixedIssues.length} issues from malformed JSON`);
                  parsed = { issues: fixedIssues };
                  break;
                }
              }
            }
          }

          if (attempts >= maxAttempts - 1) {
            const issuesMatch = jsonString.match(/"issues"\s*:\s*\[/);
            if (issuesMatch) {
              let issuesArray: any[] = [];
              let currentIssue = '';
              let braceCount = 0;
              let inString = false;
              let escapeNext = false;

              for (let i = issuesMatch.index! + issuesMatch[0].length; i < jsonString.length; i++) {
                const char = jsonString[i];
                
                if (escapeNext) {
                  currentIssue += char;
                  escapeNext = false;
                  continue;
                }

                if (char === '\\') {
                  escapeNext = true;
                  currentIssue += char;
                  continue;
                }

                if (char === '"') {
                  inString = !inString;
                  currentIssue += char;
                  continue;
                }

                if (!inString) {
                  if (char === '{') braceCount++;
                  if (char === '}') braceCount--;
                  
                  currentIssue += char;

                  if (braceCount === 0 && char === '}') {
                    try {
                      const parsedIssue = JSON.parse(currentIssue.trim());
                      if (parsedIssue.line && parsedIssue.severity) {
                        issuesArray.push(parsedIssue);
                      }
                    } catch {}
                    currentIssue = '';
                    
                    if (jsonString.substring(i + 1).trim().startsWith(']')) {
                      break;
                    }
                  }
                } else {
                  currentIssue += char;
                }
              }

              if (issuesArray.length > 0) {
                console.log(`🔧 Manually extracted ${issuesArray.length} issues from corrupted JSON`);
                parsed = { issues: issuesArray };
                break;
              }
            }
          }

          if (attempts >= maxAttempts) {
            throw parseError;
          }
        }
      }

      if (!parsed || !parsed.issues || !Array.isArray(parsed.issues)) {
        console.error("❌ Invalid response format - missing 'issues' array");
        throw new Error("Invalid response format");
      }

      const validIssues = parsed.issues.filter((issue: any) => 
        issue && 
        typeof issue.line === 'number' && 
        typeof issue.severity === 'string' &&
        typeof issue.title === 'string'
      );

      console.log(`✅ Successfully parsed ${validIssues.length} issues`);
      return { issues: validIssues };
    } catch (error: any) {
      console.error("⚠️  Failed to parse AI response, returning fallback");
      return {
        issues: [
          {
            line: 1,
            severity: "info",
            category: "best-practice",
            title: "Analysis Parse Error",
            description: "The AI model returned an invalid response format.",
            suggestion: "Try analyzing again or check Ollama configuration.",
            reasoning: "JSON parsing failed",
          },
        ],
      };
    }
  }

  private calculateSummary(issues: Issue[]): AnalysisSummary {
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    issues.forEach((issue) => {
      bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
    });

    const criticalCount = bySeverity["critical"] || 0;
    const highCount = bySeverity["high"] || 0;
    const mediumCount = bySeverity["medium"] || 0;
    const lowCount = bySeverity["low"] || 0;

    const estimatedMinutes =
      criticalCount * 30 + highCount * 15 + mediumCount * 10 + lowCount * 5;

    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;

    return {
      totalIssues: issues.length,
      bySeverity,
      byCategory,
      estimatedFixTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.ollamaBaseUrl}/api/tags`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error("Ollama health check failed:", error);
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.ollamaBaseUrl}/api/tags`);
      return response.data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error("Failed to list models:", error);
      return [];
    }
  }
}

export const aiService = new AIService();
