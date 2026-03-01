import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
    Settings, Cloud, Mail, CreditCard, Globe, Plus, Trash2, Edit2, 
    Check, X, TestTube, Eye, EyeOff, Database, RefreshCw
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsPage() {
    const { accessToken } = useAuthStore();
    const [activeTab, setActiveTab] = useState("r2-buckets");
    const [isLoading, setIsLoading] = useState(true);
    
    // R2 Buckets State
    const [buckets, setBuckets] = useState([]);
    const [showBucketForm, setShowBucketForm] = useState(false);
    const [editingBucket, setEditingBucket] = useState(null);
    const [bucketForm, setBucketForm] = useState({
        name: "", account_id: "", access_key_id: "", secret_access_key: "",
        bucket_name: "", is_default: false, description: ""
    });
    
    // Email Settings State
    const [emailSettings, setEmailSettings] = useState({
        smtp_host: "", smtp_port: 465, smtp_user: "", smtp_password: "",
        smtp_from_email: "", smtp_from_name: "", smtp_use_ssl: true
    });
    const [testEmail, setTestEmail] = useState("");
    
    // General Settings State
    const [generalSettings, setGeneralSettings] = useState({
        site_name: "LUMINA LMS", currency: "INR", currency_symbol: "₹",
        referral_commission_percent: 10, min_withdrawal_amount: 10,
        support_email: "", support_phone: ""
    });
    
    // Payment Settings State
    const [paymentSettings, setPaymentSettings] = useState({
        payu_merchant_key: "", payu_merchant_salt: "", payu_mode: "test",
        razorpay_key_id: "", razorpay_key_secret: ""
    });
    
    const [showPasswords, setShowPasswords] = useState({});

    useEffect(() => {
        fetchAllSettings();
    }, [accessToken]);

    const fetchAllSettings = async () => {
        setIsLoading(true);
        try {
            const [bucketsRes, emailRes, generalRes, paymentRes] = await Promise.all([
                axios.get(`${API}/admin/settings/r2-buckets`, { headers: { Authorization: `Bearer ${accessToken}` } }),
                axios.get(`${API}/admin/settings/email`, { headers: { Authorization: `Bearer ${accessToken}` } }),
                axios.get(`${API}/admin/settings/general`, { headers: { Authorization: `Bearer ${accessToken}` } }),
                axios.get(`${API}/admin/settings/payment`, { headers: { Authorization: `Bearer ${accessToken}` } })
            ]);
            
            setBuckets(bucketsRes.data.buckets || []);
            if (emailRes.data.settings) setEmailSettings({ ...emailSettings, ...emailRes.data.settings });
            if (generalRes.data.settings) setGeneralSettings({ ...generalSettings, ...generalRes.data.settings });
            if (paymentRes.data.settings) setPaymentSettings({ ...paymentSettings, ...paymentRes.data.settings });
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // R2 Bucket Functions
    const handleSaveBucket = async () => {
        try {
            if (editingBucket) {
                await axios.put(
                    `${API}/admin/settings/r2-buckets/${editingBucket.id}`,
                    bucketForm,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                toast.success("Bucket updated successfully");
            } else {
                await axios.post(
                    `${API}/admin/settings/r2-buckets`,
                    bucketForm,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                toast.success("Bucket added successfully");
            }
            setShowBucketForm(false);
            setEditingBucket(null);
            setBucketForm({ name: "", account_id: "", access_key_id: "", secret_access_key: "", bucket_name: "", is_default: false, description: "" });
            fetchAllSettings();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to save bucket");
        }
    };

    const handleDeleteBucket = async (bucketId) => {
        if (!window.confirm("Are you sure you want to delete this bucket?")) return;
        try {
            await axios.delete(`${API}/admin/settings/r2-buckets/${bucketId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
            toast.success("Bucket deleted");
            fetchAllSettings();
        } catch (error) {
            toast.error("Failed to delete bucket");
        }
    };

    const handleTestBucket = async (bucketId) => {
        try {
            const res = await axios.post(
                `${API}/admin/settings/r2-buckets/${bucketId}/test`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success(`Connection successful! Found ${res.data.objects_found} objects`);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Connection failed");
        }
    };

    // Email Functions
    const handleSaveEmailSettings = async () => {
        try {
            await axios.put(`${API}/admin/settings/email`, emailSettings, { headers: { Authorization: `Bearer ${accessToken}` } });
            toast.success("Email settings saved");
        } catch (error) {
            toast.error("Failed to save email settings");
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) { toast.error("Enter a test email address"); return; }
        try {
            await axios.post(`${API}/admin/settings/email/test?test_email=${testEmail}`, null, { headers: { Authorization: `Bearer ${accessToken}` } });
            toast.success(`Test email sent to ${testEmail}`);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to send test email");
        }
    };

    // General Settings Functions
    const handleSaveGeneralSettings = async () => {
        try {
            await axios.put(`${API}/admin/settings/general`, generalSettings, { headers: { Authorization: `Bearer ${accessToken}` } });
            toast.success("General settings saved");
        } catch (error) {
            toast.error("Failed to save general settings");
        }
    };

    // Payment Settings Functions
    const handleSavePaymentSettings = async () => {
        try {
            await axios.put(`${API}/admin/settings/payment`, paymentSettings, { headers: { Authorization: `Bearer ${accessToken}` } });
            toast.success("Payment settings saved");
        } catch (error) {
            toast.error("Failed to save payment settings");
        }
    };

    const togglePasswordVisibility = (key) => {
        setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="settings-page">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-purple-400" />
                        System Settings
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage R2 buckets, email, payments, and more</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAllSettings}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="glass-light p-1">
                    <TabsTrigger value="r2-buckets" className="data-[state=active]:bg-purple-500/20">
                        <Cloud className="w-4 h-4 mr-2" /> R2 Buckets
                    </TabsTrigger>
                    <TabsTrigger value="email" className="data-[state=active]:bg-purple-500/20">
                        <Mail className="w-4 h-4 mr-2" /> Email / SMTP
                    </TabsTrigger>
                    <TabsTrigger value="general" className="data-[state=active]:bg-purple-500/20">
                        <Globe className="w-4 h-4 mr-2" /> General
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="data-[state=active]:bg-purple-500/20">
                        <CreditCard className="w-4 h-4 mr-2" /> Payment
                    </TabsTrigger>
                </TabsList>

                {/* R2 Buckets Tab */}
                <TabsContent value="r2-buckets" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-white">Cloudflare R2 Buckets ({buckets.length})</h2>
                        <Button onClick={() => { setShowBucketForm(true); setEditingBucket(null); setBucketForm({ name: "", account_id: "", access_key_id: "", secret_access_key: "", bucket_name: "", is_default: false, description: "" }); }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Bucket
                        </Button>
                    </div>

                    {/* Bucket Form */}
                    {showBucketForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 rounded-xl"
                        >
                            <h3 className="text-white font-semibold mb-4">{editingBucket ? "Edit Bucket" : "Add New Bucket"}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Display Name *</Label>
                                    <Input
                                        value={bucketForm.name}
                                        onChange={(e) => setBucketForm({ ...bucketForm, name: e.target.value })}
                                        placeholder="My Bucket 1"
                                        className="input-neon"
                                    />
                                </div>
                                <div>
                                    <Label>Bucket Name *</Label>
                                    <Input
                                        value={bucketForm.bucket_name}
                                        onChange={(e) => setBucketForm({ ...bucketForm, bucket_name: e.target.value })}
                                        placeholder="course"
                                        className="input-neon"
                                    />
                                </div>
                                <div>
                                    <Label>Account ID *</Label>
                                    <Input
                                        value={bucketForm.account_id}
                                        onChange={(e) => setBucketForm({ ...bucketForm, account_id: e.target.value })}
                                        placeholder="f9410553ef78ee46e796b9d2cda947e1"
                                        className="input-neon"
                                    />
                                </div>
                                <div>
                                    <Label>Access Key ID *</Label>
                                    <Input
                                        value={bucketForm.access_key_id}
                                        onChange={(e) => setBucketForm({ ...bucketForm, access_key_id: e.target.value })}
                                        placeholder="6a1b85da4a33cb9cfffd1f566f48504d"
                                        className="input-neon"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Secret Access Key *</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswords.secret ? "text" : "password"}
                                            value={bucketForm.secret_access_key}
                                            onChange={(e) => setBucketForm({ ...bucketForm, secret_access_key: e.target.value })}
                                            placeholder="Your secret key"
                                            className="input-neon pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility("secret")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            {showPasswords.secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <Label>Description (optional)</Label>
                                    <Input
                                        value={bucketForm.description}
                                        onChange={(e) => setBucketForm({ ...bucketForm, description: e.target.value })}
                                        placeholder="For course videos account 1"
                                        className="input-neon"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={bucketForm.is_default}
                                        onCheckedChange={(v) => setBucketForm({ ...bucketForm, is_default: v })}
                                    />
                                    <Label>Set as Default Bucket</Label>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button onClick={handleSaveBucket}>
                                    <Check className="w-4 h-4 mr-2" /> {editingBucket ? "Update" : "Add"} Bucket
                                </Button>
                                <Button variant="outline" onClick={() => { setShowBucketForm(false); setEditingBucket(null); }}>
                                    <X className="w-4 h-4 mr-2" /> Cancel
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Buckets List */}
                    <div className="grid gap-4">
                        {buckets.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No R2 buckets configured yet</p>
                                <p className="text-slate-500 text-sm">Add your first Cloudflare R2 bucket to start uploading videos</p>
                            </div>
                        ) : (
                            buckets.map((bucket) => (
                                <div key={bucket.id} className="glass-card p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                            <Cloud className="w-6 h-6 text-orange-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-semibold">{bucket.name}</h3>
                                                {bucket.is_default && (
                                                    <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">Default</span>
                                                )}
                                            </div>
                                            <p className="text-slate-400 text-sm">Bucket: {bucket.bucket_name}</p>
                                            <p className="text-slate-500 text-xs">Account: {bucket.account_id?.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleTestBucket(bucket.id)}>
                                            <TestTube className="w-4 h-4 mr-1" /> Test
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => {
                                            setEditingBucket(bucket);
                                            setBucketForm({
                                                name: bucket.name,
                                                account_id: bucket.account_id,
                                                access_key_id: bucket.access_key_id,
                                                secret_access_key: "",
                                                bucket_name: bucket.bucket_name,
                                                is_default: bucket.is_default,
                                                description: bucket.description || ""
                                            });
                                            setShowBucketForm(true);
                                        }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteBucket(bucket.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Email/SMTP Tab */}
                <TabsContent value="email" className="space-y-4">
                    <div className="glass-card p-6 rounded-xl space-y-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Mail className="w-5 h-5 text-purple-400" /> SMTP Email Configuration
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>SMTP Host</Label>
                                <Input
                                    value={emailSettings.smtp_host}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                                    placeholder="smtp.gmail.com"
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>SMTP Port</Label>
                                <Input
                                    type="number"
                                    value={emailSettings.smtp_port}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: parseInt(e.target.value) })}
                                    placeholder="465"
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>SMTP Username</Label>
                                <Input
                                    value={emailSettings.smtp_user}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })}
                                    placeholder="your-email@gmail.com"
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>SMTP Password / App Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPasswords.smtp ? "text" : "password"}
                                        value={emailSettings.smtp_password}
                                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })}
                                        placeholder="Your password"
                                        className="input-neon pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("smtp")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        {showPasswords.smtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <Label>From Email</Label>
                                <Input
                                    value={emailSettings.smtp_from_email}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_from_email: e.target.value })}
                                    placeholder="noreply@yourdomain.com"
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>From Name</Label>
                                <Input
                                    value={emailSettings.smtp_from_name}
                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_from_name: e.target.value })}
                                    placeholder="LUMINA LMS"
                                    className="input-neon"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={emailSettings.smtp_use_ssl}
                                    onCheckedChange={(v) => setEmailSettings({ ...emailSettings, smtp_use_ssl: v })}
                                />
                                <Label>Use SSL (Port 465)</Label>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-4 border-t border-white/10">
                            <Button onClick={handleSaveEmailSettings}>
                                <Check className="w-4 h-4 mr-2" /> Save Email Settings
                            </Button>
                            <div className="flex gap-2 ml-auto">
                                <Input
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="test@example.com"
                                    className="input-neon w-48"
                                />
                                <Button variant="outline" onClick={handleTestEmail}>
                                    <TestTube className="w-4 h-4 mr-2" /> Send Test Email
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* General Settings Tab */}
                <TabsContent value="general" className="space-y-4">
                    <div className="glass-card p-6 rounded-xl space-y-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Globe className="w-5 h-5 text-purple-400" /> General Site Settings
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Site Name</Label>
                                <Input
                                    value={generalSettings.site_name}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, site_name: e.target.value })}
                                    placeholder="LUMINA LMS"
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>Support Email</Label>
                                <Input
                                    value={generalSettings.support_email}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, support_email: e.target.value })}
                                    placeholder="support@yourdomain.com"
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>Currency Code</Label>
                                <Input
                                    value={generalSettings.currency}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                                    placeholder="INR"
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>Currency Symbol</Label>
                                <Input
                                    value={generalSettings.currency_symbol}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, currency_symbol: e.target.value })}
                                    placeholder="₹"
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>Referral Commission (%)</Label>
                                <Input
                                    type="number"
                                    value={generalSettings.referral_commission_percent}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, referral_commission_percent: parseFloat(e.target.value) })}
                                    placeholder="10"
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>Minimum Withdrawal Amount</Label>
                                <Input
                                    type="number"
                                    value={generalSettings.min_withdrawal_amount}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, min_withdrawal_amount: parseFloat(e.target.value) })}
                                    placeholder="10"
                                    className="input-neon"
                                />
                            </div>
                        </div>
                        <Button onClick={handleSaveGeneralSettings} className="mt-4">
                            <Check className="w-4 h-4 mr-2" /> Save General Settings
                        </Button>
                    </div>
                </TabsContent>

                {/* Payment Settings Tab */}
                <TabsContent value="payment" className="space-y-4">
                    <div className="glass-card p-6 rounded-xl space-y-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-purple-400" /> PayU Configuration
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Merchant Key</Label>
                                <Input
                                    value={paymentSettings.payu_merchant_key}
                                    onChange={(e) => setPaymentSettings({ ...paymentSettings, payu_merchant_key: e.target.value })}
                                    placeholder="Your PayU merchant key"
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>Merchant Salt</Label>
                                <div className="relative">
                                    <Input
                                        type={showPasswords.payu ? "text" : "password"}
                                        value={paymentSettings.payu_merchant_salt}
                                        onChange={(e) => setPaymentSettings({ ...paymentSettings, payu_merchant_salt: e.target.value })}
                                        placeholder="Your PayU merchant salt"
                                        className="input-neon pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("payu")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        {showPasswords.payu ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <Label>Mode</Label>
                                <select
                                    value={paymentSettings.payu_mode}
                                    onChange={(e) => setPaymentSettings({ ...paymentSettings, payu_mode: e.target.value })}
                                    className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                >
                                    <option value="test">Test</option>
                                    <option value="live">Live</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-xl space-y-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-400" /> Razorpay Configuration
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Key ID</Label>
                                <Input
                                    value={paymentSettings.razorpay_key_id}
                                    onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpay_key_id: e.target.value })}
                                    placeholder="rzp_test_..."
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label>Key Secret</Label>
                                <div className="relative">
                                    <Input
                                        type={showPasswords.razorpay ? "text" : "password"}
                                        value={paymentSettings.razorpay_key_secret}
                                        onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpay_key_secret: e.target.value })}
                                        placeholder="Your Razorpay secret"
                                        className="input-neon pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("razorpay")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        {showPasswords.razorpay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleSavePaymentSettings}>
                        <Check className="w-4 h-4 mr-2" /> Save Payment Settings
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
    );
}
