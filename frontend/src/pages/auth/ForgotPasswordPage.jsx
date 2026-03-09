import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Zap, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

export default function ForgotPasswordPage() {
    const { forgotPassword, isLoading } = useAuthStore();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        const result = await forgotPassword(email);
        if (result.success) {
            setSent(true);
            toast.success("Reset instructions sent!");
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-8" data-testid="forgot-password-page">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Back Link */}
                <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-outfit text-xl font-bold gradient-text">
                        LUMINA
                    </span>
                </Link>

                {sent ? (
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-400" />
                        </div>
                        <h1 className="font-outfit text-3xl font-bold text-white mb-2">
                            Check your email
                        </h1>
                        <p className="text-slate-400 mb-8">
                            We've sent password reset instructions to <br />
                            <span className="text-purple-400 font-medium">{email}</span>
                        </p>
                        <Link to="/login">
                            <Button className="btn-secondary">
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <h1 className="font-outfit text-3xl font-bold text-white mb-2">
                            Forgot password?
                        </h1>
                        <p className="text-slate-400 mb-8">
                            No worries, we'll send you reset instructions.
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
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 input-neon"
                                        data-testid="forgot-email-input"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full btn-primary py-4"
                                disabled={isLoading}
                                data-testid="forgot-submit-btn"
                            >
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
}
