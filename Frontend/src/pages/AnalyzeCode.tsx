import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReviewStore } from "../store/reviewStore";
import { Navbar } from "../components/layout/Navbar";
import { CodeUploader } from "../components/code-review/CodeUploader";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export const AnalyzeCode = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, fetchProjects, isLoading } = useReviewStore();

  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects();
    }
  }, []);

  const currentProject = projects.find(
    (p) => p.id === parseInt(projectId || "0")
  );

  const handleAnalysisComplete = (reviewId: number) => {
    navigate(`/review/${reviewId}`);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." size="lg" />;
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Project not found
          </h1>
          <button
            onClick={() => navigate("/projects")}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
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
            <span>Back to Projects</span>
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentProject.name}
            </h1>
          </div>
          {currentProject.description && (
            <p className="text-gray-600">{currentProject.description}</p>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-900">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">How it works</span>
            </div>
            <p className="text-sm text-blue-800 mt-2">
              Upload your code files and our AI will analyze them for security
              issues, bugs, and performance problems.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-900">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">100% Local</span>
            </div>
            <p className="text-sm text-green-800 mt-2">
              All analysis is done locally using Ollama. Your code never leaves
              your machine.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-purple-900">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="font-medium">Fast Analysis</span>
            </div>
            <p className="text-sm text-purple-800 mt-2">
              Powered by CodeLlama 7B. Get results in seconds with actionable
              suggestions.
            </p>
          </div>
        </div>

        {/* Uploader */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Upload Code Files
          </h2>
          <CodeUploader
            projectId={parseInt(projectId || "0")}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
      </div>
    </div>
  );
};
