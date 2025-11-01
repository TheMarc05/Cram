import { create } from "zustand";
import { analyzeApi, projectsApi, reviewsApi } from "../services/reviewApi";
import type { Project, Review, DashboardStats } from "../services/reviewApi";

interface UploadedFile {
  file: File;
  content: string;
  status: "pending" | "analyzing" | "completed" | "error";
  reviewId?: number;
  error?: string;
  summary?: any;
}

interface ReviewState {
  // State
  projects: Project[];
  currentProject: Project | null;
  currentReview: Review | null;
  dashboardStats: DashboardStats | null;
  uploadedFiles: UploadedFile[];
  isLoading: boolean;
  error: string | null;

  // Actions - Projects
  fetchProjects: () => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
    repoUrl?: string;
  }) => Promise<Project>;
  setCurrentProject: (project: Project | null) => void;
  deleteProject: (id: number) => Promise<void>;

  // Actions - Reviews
  fetchReview: (id: number) => Promise<void>;
  setCurrentReview: (review: Review | null) => void;
  fetchDashboardStats: () => Promise<void>;
  deleteReview: (id: number) => Promise<void>;
  addComment: (
    reviewId: number,
    commentText: string,
    lineNumber?: number,
    requestAIReply?: boolean
  ) => Promise<void>;

  // Actions - Upload & Analyze
  uploadFiles: (files: File[], projectId: number) => Promise<void>;
  removeUploadedFile: (index: number) => void;
  clearUploadedFiles: () => void;

  // Actions - General
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  currentReview: null,
  dashboardStats: null,
  uploadedFiles: [],
  isLoading: false,
  error: null,

  // Projects Actions
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectsApi.getAll();
      set({ projects: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to fetch projects",
        isLoading: false,
      });
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectsApi.create(data);
      const newProject = response.data;
      set((state) => ({
        projects: [newProject, ...state.projects],
        currentProject: newProject,
        isLoading: false,
      }));
      return newProject;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to create project",
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await projectsApi.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject:
          state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to delete project",
        isLoading: false,
      });
      throw error;
    }
  },

  // Reviews Actions
  fetchReview: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reviewsApi.getById(id);
      set({ currentReview: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to fetch review",
        isLoading: false,
      });
    }
  },

  setCurrentReview: (review) => set({ currentReview: review }),

  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await reviewsApi.getStats();
      set({ dashboardStats: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to fetch stats",
        isLoading: false,
      });
    }
  },

  deleteReview: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await reviewsApi.delete(id);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to delete review",
        isLoading: false,
      });
      throw error;
    }
  },

  addComment: async (
    reviewId,
    commentText,
    lineNumber,
    requestAIReply = true
  ) => {
    try {
      await reviewsApi.addComment(reviewId, {
        commentText,
        lineNumber,
        requestAIReply,
      });
      // Auto-refresh review to display new comment + AI reply
      await get().fetchReview(reviewId);
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to add comment",
      });
      throw error;
    }
  },

  // Upload & Analyze Actions
  uploadFiles: async (files: File[], projectId: number) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      file,
      content: "",
      status: "pending",
    }));

    set((state) => ({
      uploadedFiles: [...state.uploadedFiles, ...newFiles],
    }));

    const startIndex = get().uploadedFiles.length - files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const index = startIndex + i;

      try {
        // Citește conținutul
        const content = await file.text();

        // Update status la analyzing
        set((state) => ({
          uploadedFiles: state.uploadedFiles.map((f, idx) =>
            idx === index ? { ...f, content, status: "analyzing" } : f
          ),
        }));

        // Analizează cu AI
        const result = await analyzeApi.analyzeFile({
          projectId,
          filename: file.name,
          content,
          path: "/",
        });

        // Update status la completed
        set((state) => ({
          uploadedFiles: state.uploadedFiles.map((f, idx) =>
            idx === index
              ? {
                  ...f,
                  status: "completed",
                  reviewId: result.data.reviewId,
                  summary: result.data.summary,
                }
              : f
          ),
        }));
      } catch (error: any) {
        // Update status la error
        set((state) => ({
          uploadedFiles: state.uploadedFiles.map((f, idx) =>
            idx === index
              ? {
                  ...f,
                  status: "error",
                  error:
                    error.response?.data?.message ||
                    error.message ||
                    "Analysis failed",
                }
              : f
          ),
        }));
      }
    }
  },

  removeUploadedFile: (index) => {
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((_, idx) => idx !== index),
    }));
  },

  clearUploadedFiles: () => set({ uploadedFiles: [] }),

  // General Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
