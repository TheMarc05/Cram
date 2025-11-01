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

  const { file, report, summary, metadata, comments = [] } = currentReview;
  const issues = report?.issues || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {file?.filename}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Language: {file?.language} • Model: {metadata?.model}
            </p>
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
