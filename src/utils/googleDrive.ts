interface GoogleDriveConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
}

const GOOGLE_DRIVE_CONFIG: GoogleDriveConfig = {
  apiKey: "AIzaSyA7HyK-tVQOtcKI0Ax_bnbf7ZTP0VHVdp8",
  clientId: "281827061797-qlfieqikj0nkadq5gdavhbmnqncobgtt.apps.googleusercontent.com",
  clientSecret: "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"
};

class GoogleDriveService {
  private isAuthenticated = false;
  private accessToken: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Load Google API script
      if (!window.gapi) {
        await this.loadGoogleAPI();
      }

      await new Promise((resolve) => {
        window.gapi.load('auth2', resolve);
      });

      const authInstance = window.gapi.auth2.init({
        client_id: GOOGLE_DRIVE_CONFIG.clientId,
        scope: 'https://www.googleapis.com/auth/drive.file'
      });

      // Check if user is already signed in
      if (authInstance.isSignedIn.get()) {
        this.isAuthenticated = true;
        this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);
      return false;
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async authenticate(): Promise<boolean> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      
      this.isAuthenticated = true;
      this.accessToken = user.getAuthResponse().access_token;
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async findOrCreateFolder(folderName: string, parentId?: string): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // Search for existing folder
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

      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }

      // Create new folder if not found
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
      console.error('Failed to find or create folder:', error);
      return null;
    }
  }

  async uploadFile(
    file: Blob, 
    fileName: string, 
    customerName: string
  ): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // Find or create customer folder
      const folderId = await this.findOrCreateFolder(customerName);
      if (!folderId) {
        throw new Error('Failed to create customer folder');
      }

      // Upload file
      const form = new FormData();
      const metadata = {
        name: fileName,
        parents: [folderId],
      };

      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: form,
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to upload file:', error);
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
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    gapi: any;
  }
}

export const googleDriveService = new GoogleDriveService();