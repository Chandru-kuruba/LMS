import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Award,
    Download,
    ExternalLink,
    Calendar,
    BookOpen,
    Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CertificatesPage() {
    const { user, accessToken } = useAuthStore();
    const [certificates, setCertificates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCertificates();
    }, [accessToken]);

    const fetchCertificates = async () => {
        try {
            const response = await axios.get(`${API}/certificates`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCertificates(response.data.certificates || []);
        } catch (error) {
            console.error("Failed to fetch certificates:", error);
            toast.error("Failed to load certificates");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = async (certificate) => {
        // Track print
        try {
            await axios.post(
                `${API}/certificates/${certificate.certificate_id}/print`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
        } catch (error) {
            console.error("Failed to track print:", error);
        }

        // Open print-friendly version
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Certificate - ${certificate.course_title}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Great+Vibes&display=swap');
                    
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    body {
                        font-family: 'Outfit', sans-serif;
                        background: #0F172A;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 40px;
                    }
                    
                    .certificate {
                        width: 1000px;
                        height: 700px;
                        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
                        border: 3px solid;
                        border-image: linear-gradient(135deg, #8B5CF6, #00F5FF) 1;
                        padding: 60px;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .certificate::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%238B5CF6' fill-opacity='0.03'/%3E%3C/svg%3E");
                        pointer-events: none;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    
                    .logo {
                        font-size: 36px;
                        font-weight: 700;
                        background: linear-gradient(90deg, #00F5FF, #8B5CF6, #FF2E9F);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        margin-bottom: 10px;
                    }
                    
                    .title {
                        font-size: 48px;
                        font-weight: 700;
                        color: #F8FAFC;
                        margin-bottom: 10px;
                    }
                    
                    .subtitle {
                        font-size: 18px;
                        color: #94A3B8;
                    }
                    
                    .body {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    
                    .presented-to {
                        font-size: 16px;
                        color: #94A3B8;
                        margin-bottom: 15px;
                    }
                    
                    .name {
                        font-family: 'Great Vibes', cursive;
                        font-size: 64px;
                        color: #8B5CF6;
                        margin-bottom: 20px;
                    }
                    
                    .completion-text {
                        font-size: 18px;
                        color: #F8FAFC;
                        margin-bottom: 15px;
                    }
                    
                    .course-title {
                        font-size: 28px;
                        font-weight: 600;
                        color: #00F5FF;
                    }
                    
                    .footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        margin-top: auto;
                        position: absolute;
                        bottom: 60px;
                        left: 60px;
                        right: 60px;
                    }
                    
                    .footer-item {
                        text-align: center;
                    }
                    
                    .footer-label {
                        font-size: 12px;
                        color: #64748B;
                        margin-bottom: 5px;
                    }
                    
                    .footer-value {
                        font-size: 14px;
                        color: #F8FAFC;
                    }
                    
                    .cert-id {
                        font-family: monospace;
                        font-size: 12px;
                        color: #64748B;
                        text-align: center;
                        position: absolute;
                        bottom: 20px;
                        left: 0;
                        right: 0;
                    }
                    
                    @media print {
                        body { background: white; padding: 0; }
                        .certificate { 
                            border: 2px solid #8B5CF6;
                            box-shadow: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <div class="header">
                        <div class="logo">LUMINA</div>
                        <div class="title">Certificate of Completion</div>
                        <div class="subtitle">Online Learning Excellence</div>
                    </div>
                    
                    <div class="body">
                        <div class="presented-to">This is to certify that</div>
                        <div class="name">${certificate.name_on_certificate}</div>
                        <div class="completion-text">has successfully completed the course</div>
                        <div class="course-title">${certificate.course_title}</div>
                    </div>
                    
                    <div class="footer">
                        <div class="footer-item">
                            <div class="footer-label">Issue Date</div>
                            <div class="footer-value">${new Date(certificate.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                        <div class="footer-item">
                            <div class="footer-label">Completion Date</div>
                            <div class="footer-value">${new Date(certificate.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                    </div>
                    
                    <div class="cert-id">Certificate ID: ${certificate.certificate_id}</div>
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6" data-testid="certificates-page">
            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">My Certificates</h1>
                <p className="text-slate-400">
                    View and download your earned certificates
                </p>
            </div>

            {isLoading ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                </div>
            ) : certificates.length === 0 ? (
                <div className="glass-heavy rounded-xl p-12 text-center">
                    <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-white text-xl mb-2">No Certificates Yet</h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        Complete courses to earn certificates. Once you finish all lessons in a course,
                        you'll be able to request your certificate.
                    </p>
                    <Button
                        className="btn-primary"
                        onClick={() => window.location.href = '/my-courses'}
                    >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Go to My Courses
                    </Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {certificates.map((certificate, index) => (
                        <motion.div
                            key={certificate.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-heavy rounded-xl overflow-hidden"
                        >
                            {/* Certificate Preview */}
                            <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-3xl font-bold gradient-text mb-2">
                                        LUMINA
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        Certificate of Completion
                                    </div>
                                    <div className="mt-4 text-2xl font-outfit font-bold text-purple-400">
                                        {certificate.name_on_certificate}
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <Award className="w-10 h-10 text-yellow-500/50" />
                                </div>
                            </div>

                            {/* Certificate Details */}
                            <div className="p-6">
                                <h3 className="font-semibold text-white text-lg mb-2">
                                    {certificate.course_title}
                                </h3>
                                
                                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Issued {new Date(certificate.issue_date).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="glass-light rounded-lg p-3 mb-4">
                                    <p className="text-xs text-slate-500">Certificate ID</p>
                                    <p className="font-mono text-sm text-purple-400">
                                        {certificate.certificate_id}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 btn-primary"
                                        onClick={() => handlePrint(certificate)}
                                        data-testid={`print-cert-${certificate.id}`}
                                    >
                                        <Printer className="w-4 h-4 mr-2" />
                                        Print
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                        onClick={() => handlePrint(certificate)}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Info Box */}
            <div className="glass-medium rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">About Certificates</h3>
                <ul className="space-y-3 text-slate-400">
                    <li className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>Certificates are awarded upon completing 100% of course content</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <Printer className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>Print or download your certificates anytime</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>Each certificate has a unique ID for verification</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
