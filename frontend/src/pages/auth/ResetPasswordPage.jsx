import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Zap, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const { resetPassword, isLoading } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.password || !formData.confirmPassword) {
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

        const result = await resetPassword(token, formData.password);
        if (result.success) {
            setSuccess(true);
            toast.success("Password reset successful!");
        } else {
            toast.error(result.error);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Invalid reset link</h2>
                    <Link to="/forgot-password">
                        <Button className="btn-primary">Request New Link</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-8" data-testid="reset-password-page">
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

                {success ? (
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-400" />
                        </div>
                        <h1 className="font-outfit text-3xl font-bold text-white mb-2">
                            Password Reset!
                        </h1>
                        <p className="text-slate-400 mb-8">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>
                        <Link to="/login">
                            <Button className="btn-primary">
                                Sign In
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <h1 className="font-outfit text-3xl font-bold text-white mb-2">
                            Set new password
                        </h1>
                        <p className="text-slate-400 mb-8">
                            Your new password must be different from previously used passwords.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="pl-12 pr-12 input-neon"
                                        data-testid="reset-password-input"
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
                                        data-testid="reset-confirm-password-input"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full btn-primary py-4"
                                disabled={isLoading}
                                data-testid="reset-submit-btn"
                            >
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
}
