import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { register, isLoading, clearError } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        referral_code: ""
    });

    // Auto-fill referral code from URL
    useEffect(() => {
        const refCode = searchParams.get("ref");
        if (refCode) {
            setFormData(prev => ({ ...prev, referral_code: refCode }));
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
            toast.error("Please fill in all fields");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        const result = await register({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            password: formData.password,
            referral_code: formData.referral_code || undefined
        });

        if (result.success) {
            toast.success("Registration successful! Please verify your email.");
            navigate("/verify-otp", { state: { email: result.email } });
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex" data-testid="register-page">
            {/* Left Side - Decorative */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-purple-900/20 via-slate-900 to-cyan-900/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
                
                <div className="relative text-center max-w-md">
                    <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center neon-glow-purple">
                        <Zap className="w-16 h-16 text-white" />
                    </div>
                    <h2 className="font-outfit text-3xl font-bold text-white mb-4">
                        Start Your Journey
                    </h2>
                    <p className="text-slate-400">
                        Join thousands of learners mastering new skills and building successful careers.
                    </p>

                    <div className="mt-8 grid grid-cols-3 gap-4">
                        <div className="glass-light rounded-xl p-4 text-center">
                            <p className="font-outfit text-2xl font-bold text-white">50K+</p>
                            <p className="text-xs text-slate-500">Students</p>
                        </div>
                        <div className="glass-light rounded-xl p-4 text-center">
                            <p className="font-outfit text-2xl font-bold text-white">200+</p>
                            <p className="text-xs text-slate-500">Courses</p>
                        </div>
                        <div className="glass-light rounded-xl p-4 text-center">
                            <p className="font-outfit text-2xl font-bold text-white">20%</p>
                            <p className="text-xs text-slate-500">Commission</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-outfit text-xl font-bold gradient-text">
                            LUMINA
                        </span>
                    </Link>

                    <h1 className="font-outfit text-3xl font-bold text-white mb-2">
                        Create an account
                    </h1>
                    <p className="text-slate-400 mb-8">
                        Start your learning journey today
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-slate-300">First Name</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <Input
                                        id="first_name"
                                        type="text"
                                        placeholder="John"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="pl-12 input-neon"
                                        data-testid="register-firstname-input"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-slate-300">Last Name</Label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    placeholder="Doe"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="input-neon"
                                    data-testid="register-lastname-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="pl-12 input-neon"
                                    data-testid="register-email-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 6 characters"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="pl-12 pr-12 input-neon"
                                    data-testid="register-password-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="pl-12 input-neon"
                                    data-testid="register-confirm-password-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="referral_code" className="text-slate-300">Referral Code (Optional)</Label>
                            <div className="relative">
                                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                    id="referral_code"
                                    type="text"
                                    placeholder="Enter referral code"
                                    value={formData.referral_code}
                                    onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                                    className="pl-12 input-neon uppercase"
                                    data-testid="register-referral-input"
                                />
                            </div>
                            {formData.referral_code && (
                                <p className="text-xs text-green-400">You'll be linked to this referrer permanently</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full btn-primary py-4"
                            disabled={isLoading}
                            data-testid="register-submit-btn"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-slate-400">
                        Already have an account?{" "}
                        <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                            Sign in
                        </Link>
                    </p>

                    <p className="mt-4 text-center text-xs text-slate-500">
                        By creating an account, you agree to our{" "}
                        <a href="#" className="text-purple-400 hover:underline">Terms of Service</a>
                        {" "}and{" "}
                        <a href="#" className="text-purple-400 hover:underline">Privacy Policy</a>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
