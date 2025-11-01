import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReviewStore } from "../store/reviewStore";
import { Navbar } from "../components/layout/Navbar";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { guidelinesApi, type CodingGuideline } from "../services/reviewApi";

export const Projects = () => {
  const navigate = useNavigate();
  const { projects, isLoading, fetchProjects, createProject, deleteProject } =
    useReviewStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableGuidelines, setAvailableGuidelines] = useState<CodingGuideline[]>([]);
  const [selectedGuidelineIds, setSelectedGuidelineIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    repoUrl: "",
    customRules: "",
  });

  useEffect(() => {
    fetchProjects();
    loadGuidelines();
  }, []);

  const loadGuidelines = async () => {
    try {
      const response = await guidelinesApi.getAll();
      setAvailableGuidelines(response.data);
    } catch (error) {
      console.error("Failed to load guidelines:", error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProject = await createProject({
        ...formData,
        guidelineIds: selectedGuidelineIds.length > 0 ? selectedGuidelineIds : undefined,
      });
      setShowCreateModal(false);
      setFormData({ name: "", description: "", repoUrl: "", customRules: "" });
      setSelectedGuidelineIds([]);
      navigate(`/analyze/${newProject.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const toggleGuideline = (id: string) => {
    setSelectedGuidelineIds((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  const handleDeleteProject = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(id);
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading projects..." size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="text-gray-600 mt-2">
              Manage your code review projects
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first project to start analyzing code
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => navigate(`/analyze/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
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
                    <h3 className="text-lg font-semibold text-gray-900">
                      {project.name}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {project.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {project.description}
                  </p>
                )}

                {project.repoUrl && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <span className="truncate">{project.repoUrl}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{project._count?.files || 0} files analyzed</span>
                  <span>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="absolute right-4 top-20 bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New Project
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              <form onSubmit={handleCreateProject} id="project-form" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="My Awesome Project"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="A brief description of your project..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository URL
                </label>
                <input
                  type="url"
                  value={formData.repoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, repoUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coding Guidelines
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                  {availableGuidelines.length === 0 ? (
                    <p className="text-sm text-gray-500">Loading guidelines...</p>
                  ) : (
                    availableGuidelines.map((guideline) => (
                      <label
                        key={guideline.id}
                        className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGuidelineIds.includes(guideline.id)}
                          onChange={() => toggleGuideline(guideline.id)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {guideline.name}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              {guideline.language.join(", ")}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {guideline.description}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {selectedGuidelineIds.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedGuidelineIds.length} guideline(s) selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Rules (Optional)
                </label>
                <textarea
                  value={formData.customRules}
                  onChange={(e) =>
                    setFormData({ ...formData, customRules: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  rows={4}
                  placeholder="Define custom coding standards for this project..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add project-specific coding rules that will be enforced during AI review
                </p>
              </div>
              </form>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 rounded-b-lg">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="project-form"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
