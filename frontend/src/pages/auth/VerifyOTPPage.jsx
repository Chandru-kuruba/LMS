import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuthStore } from "@/store/authStore";

export default function VerifyOTPPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";
    const { verifyOTP, resendOTP, isLoading } = useAuthStore();
    const [otp, setOtp] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error("Please enter the complete OTP");
            return;
        }

        const result = await verifyOTP(email, otp);
        if (result.success) {
            toast.success("Email verified successfully!");
            navigate("/login");
        } else {
            toast.error(result.error);
        }
    };

    const handleResend = async () => {
        const result = await resendOTP(email);
        if (result.success) {
            toast.success("OTP sent successfully!");
        } else {
            toast.error(result.error);
        }
    };

    if (!email) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">No email provided</h2>
                    <Link to="/register">
                        <Button className="btn-primary">Go to Register</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-8" data-testid="verify-otp-page">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Back Link */}
                <Link to="/register" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Register
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

                <h1 className="font-outfit text-3xl font-bold text-white mb-2">
                    Verify your email
                </h1>
                <p className="text-slate-400 mb-2">
                    We've sent a 6-digit code to
                </p>
                <p className="text-purple-400 font-medium mb-8">{email}</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={setOtp}
                            data-testid="otp-input"
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-12 h-14 text-xl border-slate-700 bg-slate-900/50" />
                                <InputOTPSlot index={1} className="w-12 h-14 text-xl border-slate-700 bg-slate-900/50" />
                                <InputOTPSlot index={2} className="w-12 h-14 text-xl border-slate-700 bg-slate-900/50" />
                                <InputOTPSlot index={3} className="w-12 h-14 text-xl border-slate-700 bg-slate-900/50" />
                                <InputOTPSlot index={4} className="w-12 h-14 text-xl border-slate-700 bg-slate-900/50" />
                                <InputOTPSlot index={5} className="w-12 h-14 text-xl border-slate-700 bg-slate-900/50" />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    <Button
                        type="submit"
                        className="w-full btn-primary py-4"
                        disabled={isLoading || otp.length !== 6}
                        data-testid="verify-otp-submit-btn"
                    >
                        {isLoading ? "Verifying..." : "Verify Email"}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-400 mb-2">Didn't receive the code?</p>
                    <button
                        onClick={handleResend}
                        disabled={isLoading}
                        className="text-purple-400 hover:text-purple-300 font-medium disabled:opacity-50"
                        data-testid="resend-otp-btn"
                    >
                        Resend OTP
                    </button>
                </div>

                {/* Info Box */}
                <div className="mt-8 p-4 glass-light rounded-xl">
                    <p className="text-sm text-slate-400">
                        <strong className="text-slate-300">Tip:</strong> Check your spam folder if you don't see the email. The OTP expires in 10 minutes.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
