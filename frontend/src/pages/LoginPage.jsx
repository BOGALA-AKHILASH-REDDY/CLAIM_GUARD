import React, { useState } from "react";
import { 
  ShieldCheck, Eye, EyeOff, Lock, User, ArrowRight, 
  CheckCircle2, AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LoginPage = ({ onBackToLanding }) => {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter your Insurance ID and password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    const res = await login(username.trim(), password.trim(), rememberMe);
    if (!res.success) {
      setErrorMsg(res.error || "Invalid user credentials or password.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-slate-200">
        
        {/* LEFT COLUMN: LIGHT THEME BRANDING & VALUE PROPOSITION */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-50 via-sky-50/60 to-indigo-50/40 p-8 sm:p-10 text-slate-900 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 relative overflow-hidden">
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToLanding}>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">CLAIMGUARD</h2>
                <span className="text-[10px] text-blue-600 font-bold block uppercase tracking-wider">
                  Denial Prevention System
                </span>
              </div>
            </div>

            <div className="mt-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/90 text-blue-800 text-xs font-bold border border-blue-200 mb-4 shadow-2xs">
                Pre-Submission Audit
              </span>
              <h3 className="text-2xl font-black leading-tight text-slate-900 tracking-tight">
                Provider Claim Denial Prevention Companion
              </h3>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed font-normal">
                Scan 16 vital factors, evaluate sum insured caps, calculate exact claimable amounts, and eliminate insurance rejections.
              </p>
            </div>

            {/* Bullet Highlights */}
            <div className="mt-8 space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium">16-Factor automated policy validation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium">ML Denial Risk scoring model</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium">Live Before/After Fix & Recheck engine</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-xs relative z-10">
            <button 
              onClick={onBackToLanding} 
              className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <span>← Return to homepage</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIGHT FORM */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Sign in to ClaimGuard
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Please enter your Insurance ID and password manually to access the system.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Insurance ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Insurance ID (e.g. POL-1001)"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember me on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
