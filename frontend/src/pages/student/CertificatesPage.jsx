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
    Printer,
    Share2,
    Edit,
    Save,
    X,
    Unlock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Logo URLs - Updated with new logos
const COMPANY_LOGO = "https://customer-assets.emergentagent.com/job_lms-cert-design/artifacts/hdcdkoww_Untitled_design-removebg-preview.png";
const MSME_LOGO = "https://customer-assets.emergentagent.com/job_lms-cert-design/artifacts/03i639mu_cropped_circle_image%20%281%29.png";
const ISO_LOGO = "https://customer-assets.emergentagent.com/job_lms-cert-design/artifacts/q4oopvv8_iso-removebg-preview%20%281%29.png";

export default function CertificatesPage() {
    const { user, accessToken } = useAuthStore();
    const [certificates, setCertificates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingCert, setEditingCert] = useState(null);
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

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

    const openEditDialog = (cert) => {
        setEditingCert(cert);
        setNewName(cert.name_on_certificate);
        setShowEditDialog(true);
    };

    const handleUpdateName = async () => {
        if (!newName.trim()) {
            toast.error("Please enter a name");
            return;
        }

        setIsSaving(true);
        try {
            await axios.put(
                `${API}/certificates/${editingCert.certificate_id}/update-name`,
                null,
                {
                    params: { new_name: newName },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            toast.success("Name updated successfully! Certificate is now locked.");
            setShowEditDialog(false);
            fetchCertificates();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to update name");
        } finally {
            setIsSaving(false);
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

        // Open print-friendly version with A4 Landscape design (297mm × 210mm)
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Certificate - ${certificate.course_title}</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Great+Vibes&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    @page { 
                        size: 297mm 210mm;
                        margin: 0; 
                    }
                    @media print {
                        html, body { 
                            width: 297mm;
                            height: 210mm;
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact;
                        }
                        .certificate { 
                            width: 297mm !important; 
                            height: 210mm !important;
                            page-break-after: avoid;
                        }
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    html, body {
                        width: 297mm;
                        height: 210mm;
                    }
                    
                    body {
                        font-family: 'Outfit', sans-serif;
                        background: #0a0a0a;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0;
                    }
                    
                    .certificate {
                        width: 297mm;
                        height: 210mm;
                        background: linear-gradient(145deg, #1a1a2e 0%, #0d0d1a 50%, #1a1a2e 100%);
                        border: 4px solid;
                        border-image: linear-gradient(135deg, #ffd700, #ff8c00, #ffd700) 1;
                        padding: 12mm 18mm;
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
                        background: 
                            radial-gradient(circle at 10% 10%, rgba(255, 215, 0, 0.05) 0%, transparent 30%),
                            radial-gradient(circle at 90% 90%, rgba(255, 140, 0, 0.05) 0%, transparent 30%);
                        pointer-events: none;
                    }
                    
                    .inner-border {
                        position: absolute;
                        top: 6mm;
                        left: 6mm;
                        right: 6mm;
                        bottom: 6mm;
                        border: 2px solid rgba(255, 215, 0, 0.3);
                        pointer-events: none;
                    }
                    
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 8mm;
                    }
                    
                    /* LARGER LOGO - 200px width equivalent in mm */
                    .company-logo {
                        width: 65mm;
                        height: auto;
                        max-height: 25mm;
                        object-fit: contain;
                    }
                    
                    .cert-logos {
                        display: flex;
                        gap: 5mm;
                        align-items: center;
                    }
                    
                    .cert-logo {
                        height: 18mm;
                        width: auto;
                        object-fit: contain;
                    }
                    
                    .main-content {
                        text-align: center;
                        padding: 3mm 0;
                    }
                    
                    .certificate-title {
                        font-family: 'Playfair Display', serif;
                        font-size: 16mm;
                        font-weight: 700;
                        color: #ffd700;
                        text-transform: uppercase;
                        letter-spacing: 4mm;
                        margin-bottom: 2mm;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    }
                    
                    .certificate-subtitle {
                        font-size: 5.5mm;
                        color: #94a3b8;
                        letter-spacing: 2mm;
                        text-transform: uppercase;
                        margin-bottom: 6mm;
                    }
                    
                    .presented-to {
                        font-size: 5mm;
                        color: #94a3b8;
                        margin-bottom: 3mm;
                    }
                    
                    .recipient-name {
                        font-family: 'Great Vibes', cursive;
                        font-size: 22mm;
                        color: #ffd700;
                        margin: 3mm 0 5mm;
                        text-shadow: 2px 2px 4px rgba(255, 215, 0, 0.2);
                    }
                    
                    .completion-text {
                        font-size: 5mm;
                        color: #e2e8f0;
                        margin-bottom: 3mm;
                    }
                    
                    .course-name {
                        font-family: 'Playfair Display', serif;
                        font-size: 9mm;
                        font-weight: 600;
                        color: #60a5fa;
                        margin-bottom: 6mm;
                    }
                    
                    .details-row {
                        display: flex;
                        justify-content: center;
                        gap: 25mm;
                        margin-bottom: 6mm;
                    }
                    
                    .detail-item {
                        text-align: center;
                    }
                    
                    .detail-label {
                        font-size: 3.5mm;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5mm;
                        margin-bottom: 1.5mm;
                    }
                    
                    .detail-value {
                        font-size: 4.5mm;
                        color: #e2e8f0;
                    }
                    
                    .signature-section {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        padding: 0 20mm;
                        position: absolute;
                        bottom: 15mm;
                        left: 12mm;
                        right: 12mm;
                    }
                    
                    .signature-box {
                        text-align: center;
                        width: 65mm;
                    }
                    
                    .signature {
                        font-family: 'Great Vibes', cursive;
                        font-size: 11mm;
                        color: #ffd700;
                        border-bottom: 2px solid #ffd700;
                        padding-bottom: 1mm;
                        margin-bottom: 2mm;
                    }
                    
                    .signature-name {
                        font-size: 4mm;
                        color: #e2e8f0;
                        font-weight: 600;
                    }
                    
                    .signature-title {
                        font-size: 3mm;
                        color: #64748b;
                    }
                    
                    .cert-id-section {
                        position: absolute;
                        bottom: 5mm;
                        left: 50%;
                        transform: translateX(-50%);
                        text-align: center;
                    }
                    
                    .cert-id {
                        font-family: monospace;
                        font-size: 3mm;
                        color: #64748b;
                        letter-spacing: 1px;
                    }
                    
                    .verification-text {
                        font-size: 2.5mm;
                        color: #475569;
                        margin-top: 1mm;
                    }
                    
                    /* QR Code positioning */
                    .qr-section {
                        position: absolute;
                        bottom: 12mm;
                        right: 15mm;
                    }
                    
                    .qr-placeholder {
                        width: 25mm;
                        height: 25mm;
                        background: white;
                        border-radius: 2mm;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <div class="inner-border"></div>
                    
                    <div class="header">
                        <img src="${COMPANY_LOGO}" alt="Chand Web Technology" class="company-logo">
                        <div class="cert-logos">
                            <img src="${MSME_LOGO}" alt="MSME Certified" class="cert-logo">
                            <img src="${ISO_LOGO}" alt="ISO 9001:2015" class="cert-logo">
                        </div>
                    </div>
                    
                    <div class="main-content">
                        <div class="certificate-title">Certificate</div>
                        <div class="certificate-subtitle">of Completion</div>
                        
                        <div class="presented-to">This is to certify that</div>
                        <div class="recipient-name">${certificate.name_on_certificate}</div>
                        
                        <div class="completion-text">has successfully completed the course</div>
                        <div class="course-name">${certificate.course_title}</div>
                        
                        <div class="details-row">
                            <div class="detail-item">
                                <div class="detail-label">Issue Date</div>
                                <div class="detail-value">${new Date(certificate.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Completion Date</div>
                                <div class="detail-value">${new Date(certificate.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature">Chandru H</div>
                            <div class="signature-name">Chandru H</div>
                            <div class="signature-title">Founder & Director</div>
                        </div>
                        <div class="signature-box">
                            <div class="signature">Authorized</div>
                            <div class="signature-name">Chand Web Technology Pvt Ltd</div>
                            <div class="signature-title">CIN: U62012KA2025PTC201894</div>
                        </div>
                    </div>
                    
                    <div class="cert-id-section">
                        <div class="cert-id">Certificate ID: ${certificate.certificate_id}</div>
                        <div class="verification-text">Verify at: ${window.location.origin}/verify/${certificate.certificate_id}</div>
                    </div>
                </div>
                <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleShare = (certificate) => {
        const verifyUrl = `${window.location.origin}/verify/${certificate.certificate_id}`;
        if (navigator.share) {
            navigator.share({
                title: `Certificate - ${certificate.course_title}`,
                text: `I earned a certificate in ${certificate.course_title} from Chand Web Technology Pvt Ltd!`,
                url: verifyUrl
            });
        } else {
            navigator.clipboard.writeText(verifyUrl);
            toast.success("Verification link copied to clipboard!");
        }
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
                            className="glass-heavy rounded-xl overflow-hidden border border-yellow-500/20"
                        >
                            {/* Certificate Preview */}
                            <div className="relative h-48 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-4 left-4 w-20 h-20 border-2 border-yellow-500 rounded-full" />
                                    <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-yellow-500 rounded-full" />
                                </div>
                                
                                <div className="text-center relative z-10">
                                    <div className="flex justify-center gap-4 mb-3">
                                        <img src={COMPANY_LOGO} alt="Logo" className="h-8 object-contain" />
                                    </div>
                                    <div className="text-lg font-bold text-yellow-500 mb-1">
                                        CERTIFICATE
                                    </div>
                                    <div className="text-xs text-slate-400 tracking-widest mb-3">
                                        OF COMPLETION
                                    </div>
                                    <div className="font-outfit text-xl font-bold text-white">
                                        {certificate.name_on_certificate}
                                    </div>
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
                                    <p className="font-mono text-sm text-yellow-500">
                                        {certificate.certificate_id}
                                    </p>
                                </div>

                                {/* Edit Name Button - Only shown when unlocked */}
                                {certificate.is_locked === false && (
                                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <div className="flex items-center gap-2 text-green-400 mb-2">
                                            <Unlock className="w-4 h-4" />
                                            <span className="text-sm font-medium">Name Editing Enabled</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-2">
                                            Admin has unlocked this certificate. You can edit your name once.
                                        </p>
                                        <Button
                                            size="sm"
                                            className="w-full bg-green-600 hover:bg-green-500"
                                            onClick={() => openEditDialog(certificate)}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit My Name
                                        </Button>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white"
                                        onClick={() => handlePrint(certificate)}
                                        data-testid={`print-cert-${certificate.id}`}
                                    >
                                        <Printer className="w-4 h-4 mr-2" />
                                        Print
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                        onClick={() => handleShare(certificate)}
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Edit Name Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="glass-heavy border-green-500/30">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Edit className="w-5 h-5 text-green-400" />
                            Edit Certificate Name
                        </DialogTitle>
                    </DialogHeader>

                    {editingCert && (
                        <div className="space-y-4 py-4">
                            <div className="glass-light rounded-lg p-3">
                                <p className="text-xs text-slate-500">Certificate</p>
                                <p className="text-white font-medium">{editingCert.course_title}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm">Your Name on Certificate</label>
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="input-neon"
                                />
                                <p className="text-xs text-slate-500">
                                    This is how your name will appear on the certificate. 
                                    After saving, the certificate will be locked again.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    className="bg-green-600 hover:bg-green-500" 
                                    onClick={handleUpdateName}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Name
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Company Info */}
            <div className="glass-medium rounded-xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="font-semibold text-white mb-2">About Your Certificates</h3>
                        <p className="text-slate-400 text-sm">
                            All certificates are issued by Chand Web Technology Private Limited (CIN: U62012KA2025PTC201894), 
                            an MSME registered and ISO 9001:2015 certified company based in Bangalore, Karnataka.
                            Each certificate has a unique ID that can be verified online.
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <img src={MSME_LOGO} alt="MSME" className="h-12 object-contain" />
                        <img src={ISO_LOGO} alt="ISO" className="h-12 object-contain" />
                    </div>
                </div>
            </div>
        </div>
    );
}
