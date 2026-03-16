
import React, { useState } from 'react';
import { Scale, Lock, User, ArrowRight } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
      // App.tsx's AuthProvider will handle the state change
    } catch (err: any) {
      console.error(err);
      setError('فشل تسجيل الدخول باستخدام جوجل. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthProvider will handle the redirect
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صالح');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-600/20 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 relative">
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
           <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white shadow-lg mb-4">
              <Scale className="w-8 h-8" />
           </div>
           <h1 className="text-2xl font-bold text-slate-900">الميزان</h1>
           <p className="text-sm text-slate-500 mt-1">نظام إدارة مكاتب المحاماة</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 pb-8">
           {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
                 {error}
              </div>
           )}

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                 <User className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                 <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                   placeholder="example@email.com"
                   required
                 />
              </div>
           </div>

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
              <div className="relative">
                 <Lock className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                   placeholder="••••••••"
                   required
                 />
              </div>
           </div>

           <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" />
                 <span className="text-slate-600">تذكرني</span>
              </label>
              <a href="#" className="text-primary-600 hover:text-primary-700 font-bold hover:underline">نسيت كلمة المرور؟</a>
           </div>

           <button 
             type="submit" 
             disabled={isLoading}
             className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg"
           >
              {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                 <>
                    تسجيل الدخول <ArrowRight className="w-4 h-4" />
                 </>
              )}
           </button>

           <div className="relative flex items-center py-2">
             <div className="flex-grow border-t border-slate-200"></div>
             <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">أو</span>
             <div className="flex-grow border-t border-slate-200"></div>
           </div>

           <button 
             type="button" 
             onClick={handleGoogleLogin}
             disabled={isLoading}
             className="w-full py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 transition-all flex items-center justify-center gap-2 shadow-sm"
           >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              تسجيل الدخول باستخدام جوجل
           </button>
        </form>
        
        <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
           جميع الحقوق محفوظة © {new Date().getFullYear()} الميزان
        </div>
      </div>
    </div>
  );
};

export default Login;
