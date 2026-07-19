const BASE_URL = "http://localhost:5000/api";

const API = {
  // Auth
  REGISTER: `${BASE_URL}/auth/register`,
  LOGIN: `${BASE_URL}/auth/login`,
  GET_ME: `${BASE_URL}/auth/me`,
  UPLOAD_IMAGE: `${BASE_URL}/auth/upload-image`,

  // Jobs
  JOBS: `${BASE_URL}/jobs`,
  MY_JOBS: `${BASE_URL}/jobs/my-jobs`,
  JOB_BY_ID: (id) => `${BASE_URL}/jobs/${id}`,
  TOGGLE_JOB_STATUS: (id) => `${BASE_URL}/jobs/${id}/toggle-status`,

  // Applications
  APPLICATIONS: `${BASE_URL}/applications`,
  MY_APPLICATIONS: `${BASE_URL}/applications/my-applications`,
  MY_APPLICANTS: `${BASE_URL}/applications/my-applicants`,
  CHECK_APPLICATION: (jobId) => `${BASE_URL}/applications/check/${jobId}`,
  APPLICATIONS_BY_JOB: (jobId) => `${BASE_URL}/applications/job/${jobId}`,
  UPDATE_APPLICATION_STATUS: (id) => `${BASE_URL}/applications/${id}/status`,

  // Users
  USER_BY_ID: (id) => `${BASE_URL}/users/${id}`,
  UPDATE_PROFILE: `${BASE_URL}/users/profile`,
  CHANGE_PASSWORD: `${BASE_URL}/users/change-password`,

  // Saved Jobs
  SAVED_JOBS: `${BASE_URL}/saved-jobs`,
  CHECK_SAVED: (jobId) => `${BASE_URL}/saved-jobs/check/${jobId}`,
  UNSAVE_JOB: (jobId) => `${BASE_URL}/saved-jobs/${jobId}`,

  // Analytics
  ANALYTICS: `${BASE_URL}/analytics`,
};

export default API;
