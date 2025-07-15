// ===============================
// File: src/utils/googleDrive.ts
// ===============================

interface GoogleDriveConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
}

const GOOGLE_DRIVE_CONFIG: GoogleDriveConfig = {
  apiKey: "AIzaSyA7HyK-tVQOtcKI0Ax_bnbf7ZTP0VHVdp8",
  clientId: "281827061797-qlfieqikj0nkadq5gdavhbmnqncobgtt.apps.googleusercontent.com",
  clientSecret: "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"
  // ✅ In production, always use env vars.
};

class GoogleDriveService {
  private isAuthenticated = false;
  private accessToken: string | null = null;

  /**
   * Initialize Google API client once.
   */
  async initialize(): Promise<boolean> {
    try {
      if (!window.gapi) {
        await this.loadGoogleAPI();
      }

      await new Promise<void>((resolve) => {
        window.gapi.load('auth2', resolve);
      });

      const authInstance = window.gapi.auth2.init({
        client_id: GOOGLE_DRIVE_CONFIG.clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
      });

      // ✅ Listen to sign-in state changes
      authInstance.isSignedIn.listen((isSignedIn: boolean) => {
        console.log(`[GoogleDrive] Sign-in status changed: ${isSignedIn}`);
        this.isAuthenticated = isSignedIn;
        if (isSignedIn) {
          this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
        } else {
          this.accessToken = null;
        }
      });

      if (authInstance.isSignedIn.get()) {
        console.log('[GoogleDrive] Already signed in.');
        this.isAuthenticated = true;
        this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
        return true;
      }

      // ✅ Prompt only once
      console.log('[GoogleDrive] Not signed in — prompting...');
      await this.authenticate();
      return this.isAuthenticated;

    } catch (error) {
      console.error('[GoogleDrive] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Load Google API dynamically.
   */
  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  /**
   * Sign in — show account selector once.
   */
  async authenticate(): Promise<boolean> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn({
        prompt: 'select_account',
      });
      this.isAuthenticated = true;
      this.accessToken = user.getAuthResponse().access_token;
      console.log('[GoogleDrive] Signed in as:', user.getBasicProfile().getEmail());
      return true;
    } catch (error) {
      console.error('[GoogleDrive] Sign-in failed:', error);
      return false;
    }
  }

  async findOrCreateFolder(folderName: string, parentId?: string): Promise<string | null> {
    if (!this.accessToken) throw new Error('Not authenticated');

    try {
      const searchQuery = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const searchUrl = parentId
        ? `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)} and '${parentId}' in parents`
        : `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}`;

      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const searchData = await searchResponse.json();
      if (searchData.files?.length > 0) return searchData.files[0].id;

      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : undefined,
        }),
      });

      const createData = await createResponse.json();
      return createData.id;
    } catch (error) {
      console.error('[GoogleDrive] Failed to find/create folder:', error);
      return null;
    }
  }

  async uploadFile(file: Blob, fileName: string, customerName: string): Promise<boolean> {
    if (!this.accessToken) throw new Error('Not authenticated');

    try {
      const folderId = await this.findOrCreateFolder(customerName);
      if (!folderId) throw new Error('Folder creation failed');

      const form = new FormData();
      const metadata = {
        name: fileName,
        parents: [folderId],
      };
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: form,
        }
      );

      const result = await response.json();
      console.log('[GoogleDrive] Upload response:', result);
      return response.ok;
    } catch (error) {
      console.error('[GoogleDrive] Upload failed:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.isAuthenticated;
  }

  async signOut(): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.isAuthenticated = false;
      this.accessToken = null;
      console.log('[GoogleDrive] Signed out.');
    } catch (error) {
      console.error('[GoogleDrive] Sign out failed:', error);
    }
  }
}

// TypeScript: extend window
declare global {
  interface Window {
    gapi: any;
  }
}

export const googleDriveService = new GoogleDriveService();
