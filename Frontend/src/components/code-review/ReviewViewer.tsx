import { useEffect } from "react";
import { useReviewStore } from "../../store/reviewStore";
import { IssueCard } from "./IssueCard";
import { CodeHighlighter } from "./CodeHighlighter";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface ReviewViewerProps {
  reviewId: number;
}

export const ReviewViewer = ({ reviewId }: ReviewViewerProps) => {
  const { currentReview, isLoading, fetchReview } = useReviewStore();

  useEffect(() => {
    fetchReview(reviewId);
  }, [reviewId]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading review..." size="lg" />;
  }

  if (!currentReview) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Review not found</p>
      </div>
    );
  }

  const {
    file,
    report,
    summary,
    metadata,
    comments = [],
    isIncremental,
    changedLines,
  } = currentReview;
  const issues = report?.issues || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {file?.filename}
              </h1>
              {isIncremental && (
                <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-semibold rounded-full border border-purple-300 flex items-center space-x-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>INCREMENTAL</span>
                </span>
              )}
              {file?.version && file.version > 1 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                  v{file.version}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <p className="text-sm text-gray-500">
                Language: {file?.language} • Model: {metadata?.model}
              </p>
              {isIncremental && changedLines && (
                <p className="text-xs text-purple-600 font-medium">
                  +{changedLines.added?.length || 0} ~
                  {changedLines.modified?.length || 0} -
                  {changedLines.deleted?.length || 0} lines
                </p>
              )}
            </div>
          </div>
          {summary && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Est. fix time: {summary.estimatedFixTime}</span>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">
                {summary.totalIssues}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Issues</p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-3xl font-bold text-red-600">
                {summary.bySeverity?.critical || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Critical</p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-3xl font-bold text-orange-600">
                {summary.bySeverity?.high || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">High</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-3xl font-bold text-yellow-600">
                {summary.bySeverity?.medium || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Medium</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-3xl font-bold text-blue-600">
                {summary.bySeverity?.low || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Low</p>
            </div>
          </div>
        )}
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Issues Found ({issues.length})
        </h2>

        {issues.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-lg font-medium text-green-900">
              No issues found!
            </p>
            <p className="text-sm text-green-700 mt-2">
              Your code looks great. Keep up the good work!
            </p>
          </div>
        ) : (
          issues.map((issue, index) => (
            <IssueCard
              key={index}
              issue={issue}
              index={index}
              reviewId={reviewId}
              comments={comments}
            />
          ))
        )}
      </div>

      {/* Original Code */}
      {file?.content && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📄 Original Code
          </h2>
          <CodeHighlighter code={file.content} language={file.language} />
        </div>
      )}
    </div>
  );
};
