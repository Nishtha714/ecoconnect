// ─── services/api.ts ─────────────────────────────────────────────────────────
import { getToken as _getToken } from "./auth";

const BASE = "https://ecoconnect-backend-7qov.onrender.com";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StoredUser {
  user_id: string; name: string; email: string;
  role: "freelancer" | "client" | "admin";
  skills?: string[]; company_name?: string;
}

export interface Project {
  project_id: string; title: string; description?: string;
  budget: number; status: string;
  required_skills?: string[]; timeline?: string;
  client_name?: string; assigned_users?: string[];
  progress?: number; due_date?: string; created_at?: string;
  champion_name?: string; champion_rating?: number;
}

export interface Champion {
  user_id: string; name: string; email: string;
  skills: string[]; country?: string;
  avg_rating?: number; total_projects?: number;
  bio?: string; kyc_status?: "pending" | "verified" | "rejected";
  profile_complete?: number;
}

export interface Booking {
  booking_id: string; client_name: string; company: string;
  date: string; time: string; status: string;
}

export interface AdminReview {
  allocation_id: string; project_id: string; project_title: string;
  budget: number; client_name: string; champion_name: string;
  submitted_at: string; status: "pending" | "approved" | "rejected";
  kyc_status?: string;
}

export interface DashboardStats {
  active_projects?: number; completed_projects?: number;
  avg_rating?: number; total_earnings?: number;
  active_delta?: number; completed_delta?: number;
  rating_delta?: number; earnings_delta?: number;
  champions_hired?: number; pending_approval?: number;
  total_investment?: number;
  pending_reviews?: number; approved_today?: number;
  kyc_pending?: number; active_users?: number;
  approvals_today?: number; rejections_today?: number;
  kyc_verified_today?: number; avg_review_time?: string;
  total_users?: number;
}

export interface PublicChampion {
  user_id:   string;
  name:      string;
  role?:     string | null;
  skills?:   string[] | null;
  country?:  string | null;
  rating?:   number | null;
  reviews?:  number | null;
  projects?: number | null;
}

export interface PublicProject {
  project_id:    string;
  title:         string;
  company_name?: string | null;
  status:        string;
  budget_min?:   number | null;
  budget_max?:   number | null;
  duration?:     string | null;
  skills?:       string[] | null;
  applicants?:   number | null;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function api<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (auth) {
    const token = await _getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Public (no auth) ────────────────────────────────────────────────────────
export const getPublicChampions = () =>
  api<PublicChampion[]>("/public/champions", {}, false);

export const getPublicProjects = () =>
  api<PublicProject[]>("/public/projects", {}, false);

export const getPublicStats = () =>
  api<{ total_champions: number; active_projects: number; total_placements: number }>(
    "/get-stats", {}, false,
  );

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginUser = (email: string, password: string) =>
  api<{ access_token: string; user: StoredUser }>("/login", {
    method: "POST", body: JSON.stringify({ email, password }),
  }, false);

export const addUser = (payload: Record<string, unknown>) =>
  api<{ message: string; user_id: string }>("/add-user", {
    method: "POST", body: JSON.stringify(payload),
  }, false);

export const addClient = (payload: Record<string, unknown>) =>
  api<{ message: string; user_id: string }>("/add-client", {
    method: "POST", body: JSON.stringify(payload),
  }, false);

// ─── OTP ──────────────────────────────────────────────────────────────────────
export const sendOtp = (payload: Record<string, unknown>) =>
  api<{ message: string }>("/add-user/send-otp", {
    method: "POST", body: JSON.stringify(payload),
  }, false);

export const verifyOtp = (email: string, otp: string) =>
  api<{ message: string; user_id: string }>(
    `/add-user/verify-otp?email=${encodeURIComponent(email)}&otp=${otp}`,
    { method: "POST" }, false,
  );

// ─── Admin ────────────────────────────────────────────────────────────────────

// FIX: was "/get-dashboard" → "/dashboard"
export const getDashboard = () =>
  api<{ stats: DashboardStats; active_projects: number; total_users: number }>(
    "/dashboard",
  );

export const getProjects = () => api<Project[]>("/get-projects");

export const getFreelancers = () => api<StoredUser[]>("/get-freelancers");

// FIX: was "/get-project?project_id=" → "/get-project/{id}"
export const getProjectById = (projectId: string) =>
  api<Project>(`/get-project/${projectId}`);

export const suggestUsers = (skills: string[]) =>
  api<Array<{ user_id: string; name: string; skills: string[]; score: number; earnings: number }>>(
    "/suggest-users", { method: "POST", body: JSON.stringify({ skills }) },
  );

export const getAllocations = () =>
  api<AdminReview[]>("/get-all-allocations");

// FIX: was "/get-allocations?project_id=" → "/get-allocations/{id}"
export const getProjectAllocationHistory = (projectId: string) =>
  api<Array<{
    allocation_id: string; user_name: string;
    decision: string; notes?: string; decided_at: string;
  }>>(`/get-allocations/${projectId}`);

/**
 * adminDecision — supports two call signatures:
 *
 * Short form (used by dashboard.tsx):
 *   adminDecision(projectId, "approve")
 *   adminDecision(projectId, "reshortlist", undefined, "Some note")
 *
 * Long form (used by allocate.tsx / command center):
 *   adminDecision(projectId, userId, "approve", "Some note")
 *
 * FIX: was calling "/admin-decision" → corrected to "/admin/decision"
 */
export const adminDecision = (
  projectId:        string,
  userIdOrDecision: string,
  decision?:        "approve" | "reshortlist" | "reject",
  notes?:           string,
) => {
  const isShortForm = decision === undefined;
  return api<{ message: string }>("/admin/decision", {    // ← FIXED URL
    method: "POST",
    body: isShortForm
      ? JSON.stringify({ project_id: projectId, decision: userIdOrDecision, notes })
      : JSON.stringify({ project_id: projectId, user_id: userIdOrDecision, decision, notes }),
  });
};

export const verifyKYC = (userId: string, status: "verified" | "rejected") =>
  api<void>(`/update-user/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ kyc_status: status }),
  });

export const getAllUsers  = () => api<StoredUser[]>("/get-users");
export const getAllProjects = () => api<Project[]>("/get-projects");

// FIX: was "/admin/dashboard" → "/dashboard"
export const getAdminDashboard = () =>
  api<{ stats: DashboardStats; pending_reviews: AdminReview[]; recent_activity: any[] }>(
    "/dashboard",
  );

// ─── Champion / Freelancer ────────────────────────────────────────────────────

// FIX: was "/get-earnings?user_id=" → "/get-earnings/{id}"
export const getEarnings = (userId: string) =>
  api<{ earnings: number }>(`/get-earnings/${userId}`);

export const getChampionDashboard = () =>
  api<{ stats: DashboardStats; projects: Project[]; bookings: Booking[]; profile_complete: number }>(
    "/freelancer/dashboard",
  );

export const getChampionProjects = () => api<Project[]>("/freelancer/projects");

export const getResume = () =>
  api<{ url: string; filename: string }>("/freelancer/resume");

export const uploadResume = async (file: any) => {
  const token = await _getToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/freelancer/resume`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
};

// New: increment applicant counter when a champion applies
export const applyToProject = (projectId: string) =>
  api<{ message: string }>(`/apply-project/${projectId}`, { method: "POST" });

// Add this API call to services/api.ts first:
export const getUserProfile = (userId: string) =>
  api<any>(`/get-user/${userId}`);

// New: full allocation history for a champion
export const getUserAllocationHistory = (userId: string) =>
  api<Array<{
    allocation_id: string; project_title: string;
    decision: string; notes?: string; decided_at: string;
  }>>(`/get-user-allocations/${userId}`);

// ─── Client ───────────────────────────────────────────────────────────────────
export const getClientDashboard = () =>
  api<{ stats: DashboardStats; projects: Project[]; pending_approvals: AdminReview[] }>(
    "/client/dashboard",
  );

/**
 * getClientProjects — FIX: was calling "/client/projects" (doesn't exist).
 * Now calls the correct backend route.
 *
 * - Pass clientEmail to filter by that client: GET /get-client-projects/{email}
 * - Call with no args to get all projects (falls back to /get-projects)
 *   Used by client-portal.tsx which calls getClientProjects() without args.
 */
export const getClientProjects = (clientEmail?: string) =>
  clientEmail
    ? api<Project[]>(`/get-client-projects/${encodeURIComponent(clientEmail)}`)
    : api<Project[]>("/get-projects");

export const addProject = (payload: Record<string, unknown>) =>
  api<{ message: string; project_id: string }>(
    "/add-project", { method: "POST", body: JSON.stringify(payload) },
  );

export const updateProject = (projectId: string, payload: Record<string, unknown>) =>
  api<{ message: string }>(
    `/update-project/${projectId}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );

// FIX: was POST "/update-project-status" → PATCH "/update-project-status/{id}"
export const updateProjectStatus = (projectId: string, status: string) =>
  api<void>(
    `/update-project-status/${projectId}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );

export const deleteProject = (projectId: string) =>
  api<{ message: string }>(`/delete-project/${projectId}`, { method: "DELETE" });

export const rateChampion = (championId: string, rating: number, comment?: string) =>
  api<void>("/client/rate", {
    method: "POST",
    body: JSON.stringify({ champion_id: championId, rating, comment }),
  });
