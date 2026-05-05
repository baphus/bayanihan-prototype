import React, { useEffect, useState, useRef } from "react"
import { AtSign, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Info, AlertCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { MOCK_AUTH_USERS } from "../data/unifiedData"
import { clearActiveRole, setActiveRole } from "../utils/authSession"
import AppHeader from "../components/layout/AppHeader"
import AppFooter from "../components/layout/AppFooter"
import { AppButton } from "../components/ui/AppButton"

export default function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<"login" | "otp">("login")
  
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")

  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    clearActiveRole()
  }, [])

  const applyMockCredentials = (nextEmail: string, nextPassword: string) => {
    setEmail(nextEmail)
    setPassword(nextPassword)
    setLoginError("")
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    
    const user = MOCK_AUTH_USERS.find(u => u.email === email && u.password === password)
    
    if (user) {
      setStep("otp")
    } else {
      setLoginError("Invalid email or password. Please use correct credentials.")
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOtp = () => {
    const otpValue = otp.join("")
    if (otpValue.length === 6) {
      const user = MOCK_AUTH_USERS.find(u => u.email === email)
      if (!user) return

      setActiveRole(user.role, { email: user.email, name: user.name })

      if (user?.role === "System Admin") {
        navigate("/system-admin")
        return
      }

      if (user?.role === "Agency") {
        navigate("/agency")
        return
      }

      navigate("/case-manager")
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("")
    if (pastedData.length > 0) {
      const newOtp = ["", "", "", "", "", ""]
      pastedData.forEach((char, index) => {
        if (index < 6) newOtp[index] = char
      })
      setOtp(newOtp)
      otpRefs.current[Math.min(pastedData.length - 1, 5)]?.focus()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface">
      <AppHeader />

      <main className="flex-1 flex flex-col">
        {/* Unified Hero Background */}
        <div className="bg-primary pt-16 pb-32">
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary-container/30"></div>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-32 mb-24 w-full max-w-6xl px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row shadow-2xl bg-surface border border-outline-variant/30 overflow-hidden">
            
            {/* Left Column: Branding with Background Image */}
            <div className="lg:w-2/5 relative min-h-[500px] flex flex-col justify-center text-white overflow-hidden">
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80" 
                  alt="Government Professional Environment" 
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/85 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-primary/40 to-transparent"></div>
              </div>
              
              <div className="relative z-10 p-10 lg:p-14">
                <div className="mb-8">
                  <img src="/logo.png" alt="Bayanihan Logo" className="h-14 w-14 object-contain" />
                </div>
                
                <h1 className="mb-6 font-headline text-2xl lg:text-3xl font-black leading-tight tracking-tight uppercase">
                  Bayanihan<br />One Window
                </h1>
                
                <div className="h-1 w-16 bg-[#94f0df] mb-8"></div>
                
                <p className="max-w-xs text-base text-white/80 leading-relaxed font-medium">
                  Connecting government agencies for seamless migrant worker assistance across Region VII.
                </p>
              </div>
            </div>

            {/* Right Column: Inputs (Two-thirds width) */}
            <div className="lg:w-3/5 p-10 lg:p-14 bg-surface">
              {step === "login" && (
                <div className="max-w-md mx-auto">
                  <div className="mb-8 flex items-center gap-3 border-b border-outline-variant pb-4">
                    <span className="material-symbols-outlined text-primary text-2xl">lock_open</span>
                    <h2 className="font-headline text-xl font-bold">Sign In</h2>
                  </div>

                  <div className="mb-8 bg-surface-container-highest/20 p-5 border border-outline-variant/20 italic">
                    <div className="flex items-start gap-3 text-xs font-medium text-on-surface-variant">
                      <Info className="h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="font-bold text-primary mb-1 uppercase tracking-tighter">Mock Credentials:</p>
                        <div className="flex flex-col gap-2">
                          <button type="button" onClick={() => applyMockCredentials("admin@example.com", "password123")} className="text-left hover:underline">System Admin: admin@example.com</button>
                          <button type="button" onClick={() => applyMockCredentials("manager@example.com", "password123")} className="text-left hover:underline">Case Manager: manager@example.com</button>
                          <button type="button" onClick={() => applyMockCredentials("agency@example.com", "password123")} className="text-left hover:underline">Agency: agency@example.com</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-6">
                    {loginError && (
                      <div className="bg-error-container p-4 border border-error/20 flex items-center gap-3 mb-6">
                        <AlertCircle className="h-5 w-5 text-error" />
                        <p className="text-xs font-semibold text-on-error-container">{loginError}</p>
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Work Email Address</label>
                      <div className="relative">
                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant/40" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-outline bg-surface-container px-4 py-3 pl-12 text-sm focus:border-primary focus:outline-none rounded-none" required />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Secure Password</label>
                        <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot Access?</button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant/40" />
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-outline bg-surface-container px-4 py-3 pl-12 pr-12 text-sm focus:border-primary focus:outline-none rounded-none" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <AppButton type="submit" variant="primary" fullWidth size="lg" className="py-4">Sign In to Dashboard</AppButton>
                  </form>
                </div>
              )}

              {step === "otp" && (
                <div className="max-w-md mx-auto text-center">
                  <div className="mb-10 flex flex-col items-center gap-4">
                    <div className="h-20 w-20 bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <ShieldCheck size={40} />
                    </div>
                    <h2 className="font-headline text-2xl font-black uppercase text-primary">OTP SENT</h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed">For security, enter the 6-digit verification code sent to your work email address.</p>
                  </div>

                  <div className="mb-10 flex justify-center gap-3" onPaste={handlePaste}>
                    {otp.map((digit, idx) => (
                      <input key={idx} ref={el => { otpRefs.current[idx] = el }} type="text" maxLength={1} value={digit} onChange={e => handleOtpChange(idx, e.target.value)} onKeyDown={e => handleOtpKeyDown(idx, e)} className="h-14 w-12 border border-outline bg-surface-container text-center text-xl font-bold focus:border-primary focus:outline-none rounded-none" />
                    ))}
                  </div>

                  <AppButton onClick={handleVerifyOtp} type="button" variant="primary" fullWidth size="lg" className="py-4">Verify & Continue</AppButton>
                  <button type="button" onClick={() => setStep("login")} className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary mx-auto transition-colors">
                    <ArrowLeft size={16} /> Return to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
