import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Award,
    Search,
    CheckCircle,
    XCircle,
    Calendar,
    BookOpen,
    User,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VerifyCertificatePage() {
    const { certId } = useParams();
    const [searchParams] = useSearchParams();
    const [certificateId, setCertificateId] = useState(certId || searchParams.get("id") || "");
    const [certificate, setCertificate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [verified, setVerified] = useState(null);

    const handleVerify = async () => {
        if (!certificateId.trim()) {
            toast.error("Please enter a certificate ID");
            return;
        }

        setIsLoading(true);
        setVerified(null);
        setCertificate(null);

        try {
            const response = await axios.get(`${API}/public/certificates/verify/${certificateId}`);
            setCertificate(response.data.certificate);
            setVerified(true);
        } catch (error) {
            setVerified(false);
            if (error.response?.status === 404) {
                toast.error("Certificate not found");
            } else {
                toast.error("Verification failed");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] bg-mesh flex items-center justify-center px-4 py-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="font-outfit text-3xl font-bold text-white mb-2">
                        Certificate Verification
                    </h1>
                    <p className="text-slate-400">
                        Verify the authenticity of a LUMINA certificate
                    </p>
                </div>

                {/* Search Box */}
                <div className="glass-heavy rounded-2xl p-8 mb-6">
                    <div className="flex gap-3">
                        <Input
                            value={certificateId}
                            onChange={(e) => setCertificateId(e.target.value)}
                            placeholder="Enter Certificate ID (e.g., LUMINA-XXXXXXXX-XXXXXXXX-YYYYMMDD)"
                            className="input-neon flex-1"
                            onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                        />
                        <Button 
                            className="btn-primary px-6" 
                            onClick={handleVerify}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Verify
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Result */}
                {verified !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`glass-heavy rounded-2xl overflow-hidden ${
                            verified ? "border border-green-500/30" : "border border-red-500/30"
                        }`}
                    >
                        {/* Status Banner */}
                        <div className={`p-4 ${verified ? "bg-green-500/10" : "bg-red-500/10"}`}>
                            <div className="flex items-center justify-center gap-3">
                                {verified ? (
                                    <>
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                        <span className="text-xl font-semibold text-green-400">
                                            Certificate Verified
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-8 h-8 text-red-400" />
                                        <span className="text-xl font-semibold text-red-400">
                                            Certificate Not Found
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Certificate Details */}
                        {certificate && (
                            <div className="p-6 space-y-6">
                                {/* Certificate Preview */}
                                <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold gradient-text mb-2">
                                            LUMINA
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            Certificate of Completion
                                        </div>
                                        <div className="mt-4 text-xl font-outfit font-bold text-purple-400">
                                            {certificate.name_on_certificate}
                                        </div>
                                    </div>
                                    <Award className="absolute top-4 right-4 w-8 h-8 text-yellow-500/50" />
                                </div>

                                {/* Details Grid */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="glass-light rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                            <User className="w-4 h-4" />
                                            Recipient Name
                                        </div>
                                        <p className="text-white font-medium">
                                            {certificate.name_on_certificate}
                                        </p>
                                    </div>

                                    <div className="glass-light rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                            <BookOpen className="w-4 h-4" />
                                            Course
                                        </div>
                                        <p className="text-white font-medium">
                                            {certificate.course_title}
                                        </p>
                                    </div>

                                    <div className="glass-light rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                            <Calendar className="w-4 h-4" />
                                            Issue Date
                                        </div>
                                        <p className="text-white font-medium">
                                            {new Date(certificate.issue_date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div className="glass-light rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                            <Award className="w-4 h-4" />
                                            Certificate ID
                                        </div>
                                        <p className="text-purple-400 font-mono text-sm">
                                            {certificate.certificate_id}
                                        </p>
                                    </div>
                                </div>

                                {/* Security Note */}
                                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                                    <p className="text-slate-400 text-sm">
                                        This certificate has been verified as authentic and was issued by LUMINA.
                                    </p>
                                </div>
                            </div>
                        )}

                        {!verified && !certificate && (
                            <div className="p-6 text-center">
                                <p className="text-slate-400">
                                    The certificate ID you entered could not be found in our system.
                                    Please check the ID and try again.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Info Box */}
                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        Certificate IDs can be found at the bottom of any LUMINA certificate.
                        <br />
                        Format: LUMINA-XXXXXXXX-XXXXXXXX-YYYYMMDD
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
