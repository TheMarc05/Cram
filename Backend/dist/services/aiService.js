"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const axios_1 = __importDefault(require("axios"));
class AIService {
    constructor(ollamaBaseUrl = process.env.OLLAMA_URL || "http://localhost:11434", model = process.env.OLLAMA_MODEL || "codellama:7b-instruct") {
        this.ollamaBaseUrl = ollamaBaseUrl;
        this.model = model;
    }
    buildPrompt(code, language, filename) {
        return `You are an expert code reviewer. Analyze the following ${language} code and identify issues.

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

CODE:
\`\`\`${language}
${code}
\`\`\`

Focus on:
1. Security vulnerabilities (SQL injection, XSS, auth issues)
2. Logic bugs and potential runtime errors
3. Performance bottlenecks
4. Code style and best practices
5. Missing error handling

Provide actionable, specific feedback. Include line numbers. Be concise but thorough.`;
    }
    async analyzeCode(code, language, filename) {
        const startTime = Date.now();
        try {
            console.log(`Starting AI analysis for ${filename}...`);
            const prompt = this.buildPrompt(code, language, filename);
            const response = await axios_1.default.post(`${this.ollamaBaseUrl}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    top_p: 0.9,
                    num_predict: 2000,
                },
            }, {
                timeout: 120000,
            });
            const rawResponse = response.data.response;
            console.log(`AI response received (${rawResponse.length} chars)`);
            // Parse the AI response
            const parsedData = this.parseAIResponse(rawResponse);
            // Calculate a summary of the issues
            const summary = this.calculateSummary(parsedData.issues);
            const processingTime = Date.now() - startTime;
            return {
                issues: parsedData.issues,
                summary,
                metadata: {
                    model: this.model,
                    processingTime,
                    language,
                },
            };
        }
        catch (error) {
            console.error("AI analysis failed:", error.message);
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }
    parseAIResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn("⚠️  No valid JSON found in AI response");
                throw new Error("No valid JSON found");
            }
            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed.issues || !Array.isArray(parsed.issues)) {
                throw new Error("Invalid response format");
            }
            return parsed;
        }
        catch (error) {
            console.error("⚠️  Failed to parse AI response, returning fallback");
            //fallback response in case of error
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
    calculateSummary(issues) {
        const bySeverity = {};
        const byCategory = {};
        issues.forEach((issue) => {
            bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
            byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
        });
        const criticalCount = bySeverity["critical"] || 0;
        const highCount = bySeverity["high"] || 0;
        const mediumCount = bySeverity["medium"] || 0;
        const lowCount = bySeverity["low"] || 0;
        const estimatedMinutes = criticalCount * 30 + highCount * 15 + mediumCount * 10 + lowCount * 5;
        const hours = Math.floor(estimatedMinutes / 60);
        const minutes = estimatedMinutes % 60;
        return {
            totalIssues: issues.length,
            bySeverity,
            byCategory,
            estimatedFixTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        };
    }
    async healthCheck() {
        try {
            const response = await axios_1.default.get(`${this.ollamaBaseUrl}/api/tags`, {
                timeout: 5000,
            });
            return response.status === 200;
        }
        catch (error) {
            console.error("Ollama health check failed:", error);
            return false;
        }
    }
    async listModels() {
        try {
            const response = await axios_1.default.get(`${this.ollamaBaseUrl}/api/tags`);
            return response.data.models?.map((m) => m.name) || [];
        }
        catch (error) {
            console.error("Failed to list models:", error);
            return [];
        }
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
