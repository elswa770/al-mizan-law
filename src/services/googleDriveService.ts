
/// <reference types="vite/client" />

interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  discoveryDocs: string[];
  scope: string;
}

interface UploadResponse {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
}

class GoogleDriveService {
  private config: GoogleDriveConfig;
  private tokenClient: any;
  private gapiInited: boolean = false;
  private gisInited: boolean = false;

  constructor() {
    // هذه القيم تأتي من متغيرات البيئة أو القيم الافتراضية المقدمة من المستخدم
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID || '287795275811-sansq8k853b20gueh2ubev5f3m1lhabs.apps.googleusercontent.com', 
      apiKey: import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || 'AIzaSyDtTpdqiQY4-xqaJdRYzQkZKcmXDWBan5M', 
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      scope: 'https://www.googleapis.com/auth/drive.file'
    };
    // console.log('🔍 Using Client ID:', this.config.clientId);
  }

  // تهيئة Google APIs
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // التحقق من وجود gapi مسبقاً
      if (window.gapi && window.gapi.client) {
        this.gapiInited = true;
        this.gisInited = true;
        this.restoreToken(); // استعادة الـ token
        this.checkReady(resolve, reject);
        return;
      }

      // تحميل Google APIs
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!window.gapi) {
          console.error('window.gapi not found after script load');
          reject(new Error('Google API script loaded but gapi not found'));
          return;
        }
        window.gapi.load('client', async () => {
          try {
            // التحقق من وجود gapi.client قبل التهيئة
            if (!window.gapi.client) {
              throw new Error('Google API client not available');
            }
            
            await window.gapi.client.init({
              apiKey: this.config.apiKey,
              discoveryDocs: this.config.discoveryDocs,
            });
            
            this.gapiInited = true;
            this.restoreToken(); // استعادة الـ token بعد التهيئة
            this.checkReady(resolve, reject);
          } catch (error) {
            console.error('Error initializing Google API client:', error);
            // لا نمنع التشغيل حتى لو فشلت التهيئة
            this.gapiInited = true;
            this.checkReady(resolve, reject);
          }
        });
      };
      script.onerror = (event) => {
        console.error('Failed to load Google APIs script:', event);
        reject(new Error('Failed to load Google APIs. Please check your internet connection or if an adblocker is blocking Google scripts.'));
      };
      document.body.appendChild(script);

      // تحميل Google Identity Services
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      gisScript.onload = () => {
        if (!window.google || !window.google.accounts) {
          console.error('window.google.accounts not found after script load');
          reject(new Error('Google Identity Services loaded but accounts not found'));
          return;
        }
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.config.clientId,
          scope: this.config.scope,
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              window.gapi.client.setToken(tokenResponse);
              this.saveToken(tokenResponse);
              this.checkReady(resolve, reject);
            }
          },
          error_callback: (error: any) => {
            console.warn('Google Identity Services background error:', error);
            // Don't reject the initialization promise here, 
            // as this callback is also used for subsequent sign-ins
          }
        });
        this.gisInited = true;
        this.checkReady(resolve, reject);
      };
      gisScript.onerror = (event) => {
        console.error('Failed to load Google Identity Services:', event);
        reject(new Error('Failed to load Google Identity Services. Please check your internet connection or if an adblocker is blocking Google scripts.'));
      };
      document.body.appendChild(gisScript);
    });
  }

  private checkReady(resolve: Function, reject: Function): void {
    if (this.gapiInited && this.gisInited) {
      resolve();
    }
  }

  // حفظ الـ token في localStorage
  private saveToken(token: any): void {
    try {
      console.log('💾 Saving token to localStorage...');
      console.log('💾 Original token:', {
        access_token: token.access_token ? token.access_token.substring(0, 10) + '...' : 'none',
        expires_in: token.expires_in,
        expires_at: token.expires_at
      });
      
      // إضافة وقت انتهاء الصلاحية
      const now = Date.now();
      const expiresInMs = (token.expires_in || 3600) * 1000;
      const expiresAt = now + expiresInMs;
      
      const tokenWithExpiry = {
        ...token,
        expires_at: expiresAt,
        expires_in: token.expires_in || 3600
      };
      
      console.log('💾 Token with expiry:', {
        now: now,
        expiresInMs: expiresInMs,
        expiresAt: expiresAt,
        timeUntilExpiry: expiresInMs / 1000 / 60 + ' minutes'
      });
      
      localStorage.setItem('google_drive_token', JSON.stringify(tokenWithExpiry));
      
      // التحقق من الحفظ
      const saved = localStorage.getItem('google_drive_token');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ Token saved successfully, verified:', {
          hasAccessToken: !!parsed.access_token,
          expiresAt: parsed.expires_at,
          timeUntilExpiry: (parsed.expires_at - Date.now()) / 1000 / 60 + ' minutes'
        });
      } else {
        console.error('❌ Token save verification failed');
      }
    } catch (error) {
      console.error('❌ Failed to save token to localStorage:', error);
    }
  }

  // استعادة الـ token من localStorage
  private restoreToken(): void {
    try {
      console.log('🔄 Restoring token from localStorage...');
      const savedToken = localStorage.getItem('google_drive_token');
      if (savedToken) {
        const token = JSON.parse(savedToken);
        if (token.access_token) {
          // التحقق من صلاحية الـ token
          const now = Date.now();
          const expiresAt = token.expires_at || 0;
          
          if (now < expiresAt) {
            window.gapi.client.setToken(token);
            console.log('✅ Token restored successfully');
          } else {
            console.log('⏰ Saved token expired, clearing...');
            this.clearToken();
          }
        }
      } else {
        console.log('📭 No saved token found');
      }
    } catch (error) {
      console.error('❌ Failed to restore token from localStorage:', error);
    }
  }

  // مسح الـ token من localStorage
  private clearToken(): void {
    try {
      localStorage.removeItem('google_drive_token');
    } catch (error) {
      console.error('❌ Failed to clear token from localStorage:', error);
    }
  }

  // تسجيل الدخول والحصول على رمز الوصول
  async signIn(): Promise<void> {
    if (!this.tokenClient) {
      throw new Error('Google Drive service not initialized');
    }

    if (!this.config.clientId) {
      throw new Error('Google Client ID is missing. Please configure it in settings.');
    }

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            console.log('✅ Token received:', tokenResponse.access_token.substring(0, 10) + '...');
            
            // حساب expires_at وتحديث tokenResponse
            const now = Date.now();
            const expiresInMs = (tokenResponse.expires_in || 3600) * 1000;
            tokenResponse.expires_at = now + expiresInMs;
            
            console.log('✅ Token expires_at set to:', tokenResponse.expires_at);
            
            window.gapi.client.setToken(tokenResponse);
            this.saveToken(tokenResponse);
            resolve();
          } else if (tokenResponse && tokenResponse.error) {
            console.error('Token response error:', tokenResponse);
            reject(new Error(`Google Auth Error: ${tokenResponse.error_description || tokenResponse.error}`));
          } else {
            reject(new Error('Failed to get access token'));
          }
        };

        this.tokenClient.error_callback = (error: any) => {
          console.error('Sign-in error callback:', error);
          const currentOrigin = window.location.origin;
          if (error.type === 'popup_closed') {
            reject(new Error(`⚠️ تم إغلاق نافذة تسجيل الدخول.\n\nيرجى التأكد من:\n1️⃣ إضافة الرابط التالي في Authorized JavaScript Origins في Google Cloud Console:\n👉 ${currentOrigin}\n\n2️⃣ السماح بالنوافذ المنبثقة (Popups) في متصفحك.\n3️⃣ التأكد من صحة الـ Client ID المستخدم.`));
          } else if (error.type === 'access_denied') {
            reject(new Error('❌ تم رفض الوصول. يرجى الموافقة على الصلاحيات المطلوبة لاستخدام Google Drive.'));
          } else {
            reject(new Error(`❌ خطأ في تسجيل الدخول (${error.type}): ${error.message || 'حدث خطأ غير متوقع'}`));
          }
        };

        // Use select_account as it's generally more stable for repeated logins
        this.tokenClient.requestAccessToken({
          prompt: 'select_account',
          hint: '',
        });
      } catch (error) {
        console.error('Error triggering requestAccessToken:', error);
        reject(error);
      }
    });
  }

  // إعادة المصادقة تلقائياً عند فشل الـ token
  async reauthenticate(): Promise<void> {
    // مسح الـ token القديم
    this.clearToken();
    
    // محاولة تسجيل الدخول مرة أخرى
    try {
      await this.signIn();
    } catch (error) {
      console.error('❌ Re-authentication failed:', error);
      throw error;
    }
  }

  // رفع ملف إلى Google Drive
  async uploadFile(file: File, folderName?: string): Promise<UploadResponse> {
    try {
      // التحقق من حجم الملف (100MB كحد أقصى)
      const token = window.gapi.client.getToken();
      if (!token || !token.access_token) {
        throw new Error('لم يتم تسجيل الدخول. يرجى تسجيل الدخول إلى Google.');
      }

      // إنشاء مجلدات منظمة
      let folderId = '';
      if (folderName) {
        // إنشاء أو الحصول على مجلد المكتب الرئيسي
        const mainFolderId = await this.getOrCreateFolder('المكتب - الميزان');
        
        // التحقق إذا كان اسم المجلد يبدأ بـ "القضية" أو "الموكل" أو "المحامي" أو "الجلسة"
        if (folderName.startsWith('القضية')) {
          // إنشاء أو الحصول على مجلد القضايا
          const casesFolderId = await this.getOrCreateFolder('المكتب - الميزان');
          const casesMainFolderId = await this.getOrCreateFolderInParent('القضايا', casesFolderId);
          
          // إنشاء مجلد القضية المحددة ووضع المستندات مباشرة فيه
          folderId = await this.getOrCreateFolderInParent(folderName, casesMainFolderId);
        } else if (folderName.startsWith('الموكل')) {
          // إنشاء أو الحصول على مجلد الموكلين
          const casesFolderId = await this.getOrCreateFolder('المكتب - الميزان');
          const clientsFolderId = await this.getOrCreateFolderInParent('الموكلون', casesFolderId);
          
          // إنشاء مجلد الموكل المحدد
          folderId = await this.getOrCreateFolderInParent(folderName, clientsFolderId);
        } else if (folderName.startsWith('المحامي')) {
          // إنشاء أو الحصول على مجلد المحامين
          const casesFolderId = await this.getOrCreateFolder('المكتب - الميزان');
          const lawyersFolderId = await this.getOrCreateFolderInParent('المحامين', casesFolderId);
          
          // إنشاء مجلد المحامي المحدد
          // استخراج اسم المحامي من المسار
          const lawyerName = folderName.replace('المحامي - ', '');
          folderId = await this.getOrCreateFolderInParent(lawyerName, lawyersFolderId);
        } else if (folderName.startsWith('الجلسة')) {
          // للجلسات المباشرة - استخراج معلومات القضية
          const mainFolderId = await this.getOrCreateFolder('المكتب - الميزان');
          const casesMainFolderId = await this.getOrCreateFolderInParent('القضايا', mainFolderId);
          
          // استخراج اسم القضية من اسم الجلسة (يفترض التنسيق: الجلسة - [تاريخ] - [اسم القضية] - [رقم القضية])
          const parts = folderName.split(' - ');
          console.log('🔍 Hearing folder parts:', parts);
          
          if (parts.length >= 3) {
            // دمج اسم القضية مع رقم القضية (إذا موجود)
            const caseNameWithNumber = parts.slice(2).join(' - ');
            const unifiedCaseName = `القضية - ${caseNameWithNumber}`;
            
            console.log('🔍 Extracted case name with number:', caseNameWithNumber);
            console.log('🔍 Unified case folder name:', unifiedCaseName);
            
            // البحث أولاً عن المجلد الموحد
            let caseFolderId = null;
            try {
              const searchResponse = await window.gapi.client.drive.files.list({
                q: `name = '${unifiedCaseName}' and '${casesMainFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
                fields: 'files(id, name)'
              });
              
              const foundFolders = searchResponse.result.files || [];
              if (foundFolders.length > 0) {
                caseFolderId = foundFolders[0].id;
                console.log('🔍 Found exact case folder:', unifiedCaseName);
              }
            } catch (error) {
              console.error('🔍 Error searching for exact case folder:', error);
            }
            
            if (!caseFolderId) {
              console.log('🔍 Case folder not found, searching for case folders to match...');
              // إذا لم يتم العثور عليه، ابحث عن جميع مجلدات القضايا وحاول مطابقتها
              const searchResponse = await window.gapi.client.drive.files.list({
                q: `'${casesMainFolderId}' in parents and name contains 'القضية -' and mimeType = 'application/vnd.google-apps.folder'`,
                fields: 'files(id, name)'
              });
              
              const caseFolders = searchResponse.result.files || [];
              console.log('🔍 Found case folders:', caseFolders.map(f => f.name));
              
              // محاولة مطابقة اسم القضية بدون رقم القضية
              const caseTitle = parts[2];
              const matchingFolder = caseFolders.find(folder => {
                const folderName = folder.name;
                return folderName.includes(caseTitle);
              });
              
              if (matchingFolder) {
                caseFolderId = matchingFolder.id;
                console.log('🔍 Found matching case folder:', matchingFolder.name);
              }
            } else {
              console.log('🔍 Found exact case folder:', unifiedCaseName);
            }
            
            if (!caseFolderId) {
              console.log('🔍 Creating new case folder:', unifiedCaseName);
              caseFolderId = await this.getOrCreateFolderInParent(unifiedCaseName, casesMainFolderId);
            }
            
            const hearingsFolderId = await this.getOrCreateFolderInParent('الجلسات', caseFolderId);
            
            // إنشاء مجلد باسم تاريخ الجلسة
            const hearingDate = parts[1];
            folderId = await this.getOrCreateFolderInParent(hearingDate, hearingsFolderId);
          } else {
            // افتراضي: ضع في مجلد عام
            folderId = await this.getOrCreateFolderInParent('مستندات عامة', mainFolderId);
          }
        } else {
          // افتراضي: ضع في مجلد عام
          folderId = await this.getOrCreateFolderInParent('مستندات عامة', mainFolderId);
        }
        
      }

      const metadata = {
        name: file.name,
        parents: folderId ? [folderId] : undefined,
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      console.log('Sending request to Google Drive API...');
      
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
        method: 'POST',
        headers: new Headers({
          'Authorization': `Bearer ${token.access_token}`,
        }),
        body: form,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('غير مصرح بالوصول. يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 403) {
          throw new Error('ممنوع الوصول. يرجى التحقق من صلاحيات Google Drive.');
        } else if (response.status === 429) {
          throw new Error('تم تجاوز حد الطلبات. يرجى المحاولة بعد قليل.');
        } else if (response.status === 503) {
          throw new Error('خدمة Google Drive غير متاحة حالياً. يرجى المحاولة لاحقاً.');
        } else {
          throw new Error(`فشل الرفع: ${response.status} - ${errorText}`);
        }
      }

      const result = await response.json();
      
      // جعل الملف متاحاً للعامة (معطل مؤقتاً بسبب خطأ API)
      // await this.makeFilePublic(result.id); // معطل مؤقتاً

      return {
        fileId: result.id,
        fileName: result.name,
        webViewLink: result.webViewLink,
        webContentLink: result.webContentLink,
      };
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }

  // البحث عن مجلد أو إنشاؤه
  private async getOrCreateFolder(folderName: string): Promise<string> {
    try {
      
      const token = window.gapi.client.getToken();
      if (!token || !token.access_token) {
        throw new Error('لم يتم تسجيل الدخول. يرجى تسجيل الدخول إلى Google.');
      }

      // البحث عن المجلد باستخدام REST API بدلاً من gapi.client
      console.log('Searching for folder using REST API...');
      try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)`, {
          method: 'GET',
          headers: new Headers({
            'Authorization': `Bearer ${token.access_token}`,
          }),
        });

        console.log('Search response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('فشل البحث عن المجلد: 401 - غير مصرح. يرجى تسجيل الدخول مرة أخرى.');
          } else if (response.status === 403) {
            throw new Error('فشل البحث عن المجلد: 403 - ممنوع. قد تكون هناك مشكلة في API Key أو الصلاحيات.');
          } else {
            const errorText = await response.text();
            throw new Error(`فشل البحث عن المجلد: ${response.status} - ${errorText}`);
          }
        }

        const searchResult = await response.json();
        console.log('Search result:', searchResult);

        if (searchResult.files && searchResult.files.length > 0) {
          console.log('Folder found:', searchResult.files[0]);
          return searchResult.files[0].id;
        }
      } catch (searchError: any) {
        console.error('Search error:', searchError);
        
        // إذا كان الخطأ 401، حاول إعادة المصادقة
        if (searchError.message.includes('401') || searchError.message.includes('غير مصرح')) {
          console.log('🔄 Token expired, attempting re-authentication...');
          try {
            await this.reauthenticate();
            // إعادة المحاولة بعد إعادة المصادقة
            return await this.getOrCreateFolder(folderName);
          } catch (reauthError) {
            console.error('❌ Re-authentication failed:', reauthError);
            throw searchError;
          }
        }
        
        throw searchError;
      }

      console.log('Creating new folder...');

      // إنشاء مجلد جديد باستخدام REST API
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`فشل إنشاء المجلد: ${createResponse.status}`);
      }

      const createResult = await createResponse.json();
      console.log('Folder created:', createResult);
      return createResult.id;
    } catch (error) {
      console.error('Error getting/creating folder:', error);
      throw error;
    }
  }

  // البحث عن مجلد فرعي أو إنشاؤه داخل مجلد أب
  private async getOrCreateFolderInParent(folderName: string, parentFolderId: string): Promise<string> {
    try {
      console.log(`Searching for subfolder: ${folderName} in parent: ${parentFolderId}`);
      
      const token = window.gapi.client.getToken();
      if (!token || !token.access_token) {
        throw new Error('لم يتم تسجيل الدخول. يرجى تسجيل الدخول إلى Google.');
      }

      // البحث عن المجلد الفرعي داخل المجلد الأب
      const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}'+and+mimeType='application/vnd.google-apps.folder'+and+'${parentFolderId}'+in+parents+and+trashed=false&fields=files(id,name)`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
        },
      });

      if (!searchResponse.ok) {
        if (searchResponse.status === 401) {
          throw new Error('فشل البحث عن المجلد الفرعي: 401 - غير مصرح. يرجى تسجيل الدخول مرة أخرى.');
        } else if (searchResponse.status === 403) {
          throw new Error('فشل البحث عن المجلد الفرعي: 403 - ممنوع. قد تكون هناك مشكلة في API Key أو الصلاحيات.');
        } else {
          throw new Error(`فشل البحث عن المجلد الفرعي: ${searchResponse.status}`);
        }
      }

      const searchResult = await searchResponse.json();
      console.log('Subfolder search result:', searchResult);

      if (searchResult.files && searchResult.files.length > 0) {
        console.log('Subfolder found:', searchResult.files[0]);
        return searchResult.files[0].id;
      }

      console.log('Creating new subfolder...');

      // إنشاء مجلد فرعي جديد داخل المجلد الأب
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        }),
      });

      if (!createResponse.ok) {
        if (createResponse.status === 401) {
          throw new Error('فشل إنشاء المجلد الفرعي: 401 - غير مصرح. يرجى تسجيل الدخول مرة أخرى.');
        } else if (createResponse.status === 403) {
          throw new Error('فشل إنشاء المجلد الفرعي: 403 - ممنوع. قد تكون هناك مشكلة في API Key أو الصلاحيات.');
        } else {
          throw new Error(`فشل إنشاء المجلد الفرعي: ${createResponse.status}`);
        }
      }

      const createResult = await createResponse.json();
      console.log('Subfolder created:', createResult);
      return createResult.id;
    } catch (error: any) {
      console.error('Error getting/creating subfolder:', error);
      
      // إذا كان الخطأ 401، حاول إعادة المصادقة
      if (error.message.includes('401') || error.message.includes('غير مصرح')) {
        console.log('🔄 Token expired in subfolder, attempting re-authentication...');
        try {
          await this.reauthenticate();
          // إعادة المحاولة بعد إعادة المصادقة
          return await this.getOrCreateFolderInParent(folderName, parentFolderId);
        } catch (reauthError) {
          console.error('❌ Re-authentication failed in subfolder:', reauthError);
          throw error;
        }
      }
      
      throw error;
    }
  }

  // جعل الملف متاحاً للعامة
  private async makeFilePublic(fileId: string): Promise<void> {
    try {
      await window.gapi.client.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (error) {
      console.error('Error making file public:', error);
    }
  }

  // حذف ملف
  async deleteFile(fileId: string): Promise<void> {
    try {
      await window.gapi.client.drive.files.delete({
        fileId: fileId,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // التحقق من تسجيل الدخول
  isSignedIn(): boolean {
    try {
      console.log('🔍 Checking sign-in status...');
      
      // التحقق من وجود gapi و client أولاً
      if (!window.gapi || !window.gapi.client) {
        console.log('🔍 isSignedIn: gapi or gapi.client not available');
        return false;
      }
      
      // التحقق من الـ token في الذاكرة أولاً
      const currentToken = window.gapi.client.getToken();
      console.log('🔍 Current token in memory:', currentToken ? 'exists' : 'none');
      
      if (currentToken && currentToken.access_token) {
        // التحقق إذا كان الـ token صالحاً (ليس منتهي الصلاحية)
        const now = Date.now();
        let expiresAt = currentToken.expires_at || 0;
        
        // إذا لم يوجد expires_at في الذاكرة، حاول الحصول عليه من localStorage
        if (!expiresAt) {
          const savedToken = localStorage.getItem('google_drive_token');
          if (savedToken) {
            const parsed = JSON.parse(savedToken);
            expiresAt = parsed.expires_at || 0;
            console.log('🔍 Using expires_at from localStorage:', expiresAt);
          }
        }
        
        const tokenAge = now - expiresAt;
        
        console.log('🔍 Token age check - Now:', now, 'Expires:', expiresAt, 'Age:', tokenAge);
        
        if (tokenAge < 0) { // Token not expired
          console.log('🔍 isSignedIn: Valid token found in memory');
          return true;
        } else {
          console.log('🔍 isSignedIn: Token expired, clearing...');
          window.gapi.client.setToken(null);
          this.clearToken();
        }
      }
      
      // إذا لم يوجد في الذاكرة، حاول استعادته من localStorage
      try {
        const savedToken = localStorage.getItem('google_drive_token');
        console.log('🔍 Saved token in localStorage:', savedToken ? 'exists' : 'none');
        
        if (savedToken) {
          const token = JSON.parse(savedToken);
          if (token.access_token) {
            // التحقق من صلاحية الـ token المحفوظ
            const now = Date.now();
            const expiresAt = token.expires_at || 0;
            const tokenAge = now - expiresAt;
            
            console.log('🔍 Saved token age check - Now:', now, 'Expires:', expiresAt, 'Age:', tokenAge);
            
            if (tokenAge < 0) {
              // استعادة التوكن مع expires_at الصحيح
              window.gapi.client.setToken(token);
              console.log('🔍 isSignedIn: Valid token restored from localStorage');
              return true;
            } else {
              console.log('🔍 isSignedIn: Saved token expired, clearing...');
              this.clearToken();
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to check saved token:', error);
      }
      
      console.log('🔍 isSignedIn: No valid token found');
      return false;
    } catch (error) {
      console.error('❌ Error in isSignedIn:', error);
      return false;
    }
  }

  // تسجيل الخروج
  signOut(): void {
    if (window.gapi?.client?.getToken()) {
      window.gapi.client.setToken(null);
      this.clearToken(); // ✅ مسح الـ token من localStorage
      console.log('✅ Sign-out successful, token cleared');
    }
  }
}

// تصدير الخدمة
export const googleDriveService = new GoogleDriveService();

export type { UploadResponse };

// تعريفات TypeScript للـ Google APIs
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}
