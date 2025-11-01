import { useDropzone } from "react-dropzone";
import { useReviewStore } from "../../store/reviewStore";
import { useNavigate } from "react-router-dom";

interface CodeUploaderProps {
  projectId: number;
  onAnalysisComplete?: (reviewId: number) => void;
}

export const CodeUploader = ({
  projectId,
  onAnalysisComplete,
}: CodeUploaderProps) => {
  const navigate = useNavigate();

  // Folosim Zustand store
  const { uploadedFiles, uploadFiles, removeUploadedFile, clearUploadedFiles } =
    useReviewStore();

  const onDrop = async (acceptedFiles: File[]) => {
    await uploadFiles(acceptedFiles, projectId);

    // Dacă există callback, apelează-l pentru primul fișier completat
    if (onAnalysisComplete) {
      const completedFile = uploadedFiles.find((f) => f.status === "completed");
      if (completedFile?.reviewId) {
        onAnalysisComplete(completedFile.reviewId);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/*": [
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".py",
        ".java",
        ".cs",
        ".go",
        ".rb",
        ".php",
        ".html",
        ".css",
        ".cpp",
        ".c",
        ".h",
        ".hpp",
      ],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleViewReview = (reviewId: number) => {
    navigate(`/review/${reviewId}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-blue-500 bg-blue-50 scale-[1.02]"
            : "border-gray-300 hover:border-gray-400 bg-white hover:shadow-md"
        }`}
      >
        <input {...getInputProps()} />

        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {isDragActive ? (
          <p className="text-lg text-blue-600 font-medium">
            Drop files here...
          </p>
        ) : (
          <div>
            <p className="text-lg text-gray-700 mb-2 font-medium">
              Drag & drop code files here, or click to select
            </p>
            <p className="text-sm text-gray-500 mb-1">
              Supported: .js, .jsx, .ts, .tsx, .py, .java, .cs, .go, .rb, .php,
              .html, .css, .cpp, .c
            </p>
            <p className="text-xs text-gray-400">Max file size: 5MB per file</p>
          </div>
        )}
      </div>

      {/* Lista fișierelor */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            {uploadedFiles.length > 0 && (
              <button
                onClick={clearUploadedFiles}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {uploadedFiles.map((uploadedFile, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 flex-1">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-3">
                {uploadedFile.status === "pending" && (
                  <span className="text-sm text-gray-500">Pending...</span>
                )}

                {uploadedFile.status === "analyzing" && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-blue-600 font-medium">
                      Analyzing...
                    </span>
                  </div>
                )}

                {uploadedFile.status === "completed" && (
                  <>
                    <div className="text-sm text-green-600 font-medium">
                      ✓ {uploadedFile.summary?.totalIssues || 0} issues
                    </div>
                    {uploadedFile.reviewId && (
                      <button
                        onClick={() => handleViewReview(uploadedFile.reviewId!)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded hover:bg-blue-50"
                      >
                        View Report
                      </button>
                    )}
                  </>
                )}

                {uploadedFile.status === "error" && (
                  <span className="text-sm text-red-600 font-medium">
                    ✗ {uploadedFile.error || "Error"}
                  </span>
                )}

                <button
                  onClick={() => removeUploadedFile(index)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Remove"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 hover:text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
