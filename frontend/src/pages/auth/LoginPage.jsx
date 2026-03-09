import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, error, clearError } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (!formData.email || !formData.password) {
            toast.error("Please fill in all fields");
            return;
        }

        const result = await login(formData.email, formData.password);
        if (result.success) {
            toast.success("Welcome back!");
            if (result.user.role === "admin") {
                navigate("/admin");
            } else {
                navigate("/dashboard");
            }
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex" data-testid="login-page">
            {/* Left Side - Form */}
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
                        Welcome back
                    </h1>
                    <p className="text-slate-400 mb-8">
                        Sign in to continue your learning journey
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="pl-12 input-neon"
                                    data-testid="login-email-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-purple-400 hover:text-purple-300"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="pl-12 pr-12 input-neon"
                                    data-testid="login-password-input"
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

                        <Button
                            type="submit"
                            className="w-full btn-primary py-4"
                            disabled={isLoading}
                            data-testid="login-submit-btn"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-slate-400">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">
                            Sign up
                        </Link>
                    </p>

                    {/* Demo Credentials */}
                    <div className="mt-8 p-4 glass-light rounded-xl">
                        <p className="text-sm text-slate-400 mb-2">Demo Admin Credentials:</p>
                        <p className="text-sm text-slate-300">Email: admin@lumina.com</p>
                        <p className="text-sm text-slate-300">Password: admin123</p>
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Decorative */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-purple-900/20 via-slate-900 to-cyan-900/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
                
                <div className="relative text-center max-w-md">
                    <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center neon-glow-purple">
                        <Zap className="w-16 h-16 text-white" />
                    </div>
                    <h2 className="font-outfit text-3xl font-bold text-white mb-4">
                        Continue Learning
                    </h2>
                    <p className="text-slate-400">
                        Pick up where you left off and keep building your skills with industry-leading courses.
                    </p>
                </div>
            </div>
        </div>
    );
}
