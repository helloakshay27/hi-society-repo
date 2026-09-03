/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL?: string;
  /**
   * Local backend base URL for development auth (e.g. the local Rails server).
   * When set, the auth flow (organization lookup + sign-in) and getBaseUrl()
   * target this URL instead of the remote Hi-Society hosts.
   * Example: VITE_LOCAL_BASE_URL=http://127.0.0.1:3000
   */
  readonly VITE_LOCAL_BASE_URL?: string;
  readonly VITE_FACE_AUTH_API_URL?: string;
  readonly VITE_FACE_ENROLL_PATH?: string;
  readonly VITE_FACE_COLLECTION_ID?: string;
  readonly VITE_FACE_RECOGNIZE_PATH?: string;
  readonly VITE_FACE_RECOGNIZE_COLLECTION_ID?: string;
  // add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
