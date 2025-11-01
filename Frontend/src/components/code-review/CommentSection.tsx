import { useState } from "react";
import type { Comment } from "../../services/reviewApi";
import { useReviewStore } from "../../store/reviewStore";

interface CommentSectionProps {
  reviewId: number;
  comments: Comment[];
  lineNumber?: number;
}

export const CommentSection = ({
  reviewId,
  comments,
  lineNumber,
}: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestAIReply, setRequestAIReply] = useState(true); //Toggle for AI reply
  const { addComment } = useReviewStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment(reviewId, newComment.trim(), lineNumber, requestAIReply); // Pass toggle
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "acum";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("ro-RO");
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        Conversation ({comments.length})
      </h4>

      {/* List of comments - with conversation style */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Start a conversation with AI Assistant! 🤖
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg ${
                comment.isAI
                  ? "bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 ml-4"
                  : "bg-gray-50 border border-gray-200 mr-4"
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  {comment.isAI ? (
                    <div className="flex items-center space-x-1">
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                      </svg>
                      <span className="text-sm font-bold text-purple-700">
                        AI Assistant
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700">
                        {comment.author.firstName} {comment.author.lastName}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-gray-500">
                    • {formatDate(comment.createdAt)}
                  </span>
                </div>
                {comment.lineNumber && (
                  <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded">
                    L{comment.lineNumber}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {comment.commentText}
              </p>
            </div>
          ))
        )}
      </div>

      {/* New comment form with AI toggle */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ask AI assistant about this issue..."
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          rows={3}
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <p className="text-xs text-gray-500">
              {lineNumber
                ? `Conversation for line ${lineNumber}`
                : "General conversation"}
            </p>
            {/* Toggle for AI reply */}
            {lineNumber && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requestAIReply}
                  onChange={(e) => setRequestAIReply(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-xs text-gray-600 flex items-center">
                  <svg
                    className="w-3 h-3 mr-1 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                  AI replies automatically
                </span>
              </label>
            )}
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-md"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
