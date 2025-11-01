import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { ReviewViewer } from "../components/code-review/ReviewViewer";

export const ReviewDetail = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 pt-20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back</span>
        </button>

        <ReviewViewer reviewId={parseInt(reviewId || "0")} />
      </div>
    </div>
  );
};
