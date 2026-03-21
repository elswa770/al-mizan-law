import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * دالة موحدة لإنشاء الإعدادات الافتراضية للشركات
 * يمكن استخدامها في Onboarding أو Settings أو أي مكان آخر
 */
export const createDefaultSettingsUnified = async (firmId: string, firmName?: string) => {
  try {
    // جلب اسم الشركة إذا لم يُعطى
    if (!firmName) {
      const firmDoc = await getDoc(doc(db, 'firms', firmId));
      const firmData = firmDoc.exists() ? firmDoc.data() as any : {};
      firmName = firmData.name || 'شركة جديدة';
    }

    // General Settings
    const generalSettings = {
      firmName: firmName,
      firmAddress: '',
      firmPhone: '',
      firmEmail: '',
      website: '',
      timezone: 'Asia/Riyadh',
      language: 'ar',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      currency: 'EGP',
      theme: 'dark'
    };

    // Security Settings
    const securitySettings = {
      twoFactorAuth: false,
      sessionTimeout: 60, // استخدام 60 مثل Settings.tsx
      passwordMinLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      sessionMonitoring: true,
      logRetention: 90
    };

    // Notification Settings
    const notificationSettings = {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      caseReminders: true,
      hearingReminders: true,
      taskReminders: true,
      appointmentReminders: true,
      systemUpdates: true,
      securityAlerts: true,
      smtpSettings: {
        enabled: false,
        host: '',
        port: 587,
        username: '',
        password: '',
        encryption: 'tls',
        fromEmail: '',
        fromName: firmName
      },
      whatsappSettings: {
        enabled: false,
        apiKey: '',
        phoneNumber: '',
        templateNotifications: true
      },
      alertPreferences: {
        critical: true,
        warning: true,
        info: false,
        email: true,
        sms: false,
        push: true
      }
    };

    // Data Settings
    const dataSettings = {
      autoBackup: true,
      backupFrequency: 'daily',
      encryption: true,
      archiving: true,
      gdprCompliance: true,
      dataRetention: 365,
      maxFileSize: 10,
      exportFormat: 'pdf',
      cloudStorage: {
        enabled: false,
        provider: 'google-drive',
        bucketName: '',
        accessKey: '',
        secretKey: '',
        region: 'us-central1'
      }
    };

    // Save all settings to Firestore
    await setDoc(doc(db, 'settings', firmId), {
      generalSettings: JSON.stringify(generalSettings),
      securitySettings: JSON.stringify(securitySettings),
      notificationSettings: JSON.stringify(notificationSettings),
      dataSettings: JSON.stringify(dataSettings),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Default settings created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating default settings:', error);
    throw error;
  }
};
