import { useState } from "react";
import type { Issue, Comment } from "../../services/reviewApi";
import { CommentSection } from "./CommentSection";

interface IssueCardProps {
  issue: Issue;
  index: number;
  reviewId: number;
  comments: Comment[];
}

const severityConfig = {
  critical: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "🔴",
  },
  high: {
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "🟠",
  },
  medium: {
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: "🟡",
  },
  low: {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "🔵",
  },
  info: {
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: "ℹ️",
  },
};

const categoryIcons: Record<string, string> = {
  security: "🔒",
  bug: "🐛",
  performance: "⚡",
  style: "🎨",
  "best-practice": "✨",
};

export const IssueCard = ({
  issue,
  index,
  reviewId,
  comments,
}: IssueCardProps) => {
  const config = severityConfig[issue.severity];
  const [showComments, setShowComments] = useState(false);

  // Filtrează comentariile pentru această linie
  const issueComments = comments.filter(
    (c) => c.lineNumber === issue.line || c.lineNumber === null
  );

  return (
    <div
      className={`bg-white rounded-lg shadow border ${config.border} p-6 mb-4`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">{config.icon}</span>
            <h4 className="text-lg font-semibold text-gray-900">
              {issue.title}
            </h4>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${config.bg} ${config.color}`}
            >
              {issue.severity.toUpperCase()}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
              {categoryIcons[issue.category]} {issue.category}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            📍 Line {issue.line}
            {issue.column && `, Column ${issue.column}`}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <h5 className="font-semibold text-gray-900 mb-2">📋 Description:</h5>
        <p className="text-gray-700 leading-relaxed">{issue.description}</p>
      </div>

      {/* Reasoning */}
      <div className="mb-4">
        <h5 className="font-semibold text-gray-900 mb-2">
          🤔 Why this matters:
        </h5>
        <p className="text-gray-700 leading-relaxed">{issue.reasoning}</p>
      </div>

      {/* Suggestion */}
      <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
        <h5 className="font-semibold text-green-900 mb-2">💡 Suggestion:</h5>
        <p className="text-gray-700 leading-relaxed">{issue.suggestion}</p>
      </div>

      {/* Fixed Code */}
      {issue.fixedCode && (
        <div>
          <h5 className="font-semibold text-gray-900 mb-2">✅ Fixed Code:</h5>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{issue.fixedCode}</code>
          </pre>
        </div>
      )}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mt-4"
      >
        <svg
          className={`w-4 h-4 transform transition-transform ${
            showComments ? "rotate-90" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span>
          {showComments ? "Hide Comments" : "Show Comments"} (
          {issueComments.length})
        </span>
      </button>

      {/* Comment Section */}
      {showComments && (
        <CommentSection
          reviewId={reviewId}
          comments={issueComments}
          lineNumber={issue.line}
        />
      )}
    </div>
  );
};
