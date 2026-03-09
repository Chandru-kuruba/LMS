import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Tag,
    Plus,
    Trash2,
    Edit,
    Percent,
    DollarSign,
    Calendar,
    Users,
    Copy,
    CheckCircle,
    XCircle,
    Search
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CouponsPage() {
    const { accessToken } = useAuthStore();
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        max_uses: "",
        valid_until: "",
        min_order_amount: "",
        is_active: true
    });

    useEffect(() => {
        fetchCoupons();
    }, [accessToken]);

    const fetchCoupons = async () => {
        try {
            const response = await axios.get(`${API}/admin/coupons`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCoupons(response.data.coupons || []);
        } catch (error) {
            console.error("Failed to fetch coupons:", error);
            toast.error("Failed to load coupons");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCoupon = async () => {
        if (!formData.code || !formData.discount_value) {
            toast.error("Code and discount value are required");
            return;
        }

        try {
            const payload = {
                code: formData.code.toUpperCase(),
                discount_type: formData.discount_type,
                discount_value: parseFloat(formData.discount_value),
                max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
                valid_until: formData.valid_until || null,
                min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null
            };

            await axios.post(`${API}/admin/coupons`, payload, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            toast.success("Coupon created successfully!");
            setShowCreateDialog(false);
            resetForm();
            fetchCoupons();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to create coupon");
        }
    };

    const handleUpdateCoupon = async () => {
        if (!editingCoupon) return;

        try {
            await axios.put(`${API}/admin/coupons/${editingCoupon.id}`, formData, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            toast.success("Coupon updated successfully!");
            setEditingCoupon(null);
            resetForm();
            fetchCoupons();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to update coupon");
        }
    };

    const handleDeleteCoupon = async (couponId) => {
        if (!confirm("Are you sure you want to deactivate this coupon?")) return;

        try {
            await axios.delete(`${API}/admin/coupons/${couponId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Coupon deactivated");
            fetchCoupons();
        } catch (error) {
            toast.error("Failed to deactivate coupon");
        }
    };

    const handleToggleActive = async (coupon) => {
        try {
            await axios.put(`${API}/admin/coupons/${coupon.id}`, {
                is_active: !coupon.is_active
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchCoupons();
        } catch (error) {
            toast.error("Failed to update coupon status");
        }
    };

    const openEditDialog = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value.toString(),
            max_uses: coupon.max_uses?.toString() || "",
            valid_until: coupon.valid_until?.split("T")[0] || "",
            min_order_amount: coupon.min_order_amount?.toString() || "",
            is_active: coupon.is_active
        });
    };

    const resetForm = () => {
        setFormData({
            code: "",
            discount_type: "percentage",
            discount_value: "",
            max_uses: "",
            valid_until: "",
            min_order_amount: "",
            is_active: true
        });
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success("Coupon code copied!");
    };

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const generateRandomCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, code }));
    };

    return (
        <div className="space-y-6" data-testid="coupons-page">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Coupon Management</h1>
                    <p className="text-slate-400">Create and manage discount coupons</p>
                </div>
                <Button
                    className="btn-primary"
                    onClick={() => setShowCreateDialog(true)}
                    data-testid="create-coupon-btn"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Coupon
                </Button>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search coupons..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-neon pl-10"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="glass-heavy rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Coupons</p>
                            <p className="font-outfit text-xl font-bold text-white">{coupons.length}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-heavy rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Active</p>
                            <p className="font-outfit text-xl font-bold text-white">
                                {coupons.filter(c => c.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="glass-heavy rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Inactive</p>
                            <p className="font-outfit text-xl font-bold text-white">
                                {coupons.filter(c => !c.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coupons List */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="glass-heavy rounded-xl p-12 text-center">
                    <Tag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-white text-xl mb-2">No Coupons Found</h3>
                    <p className="text-slate-400 mb-6">Create your first coupon to offer discounts</p>
                    <Button className="btn-primary" onClick={() => setShowCreateDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Coupon
                    </Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCoupons.map((coupon, index) => (
                        <motion.div
                            key={coupon.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`glass-heavy rounded-xl p-5 border ${
                                coupon.is_active ? "border-green-500/20" : "border-red-500/20 opacity-60"
                            }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        coupon.discount_type === "percentage" 
                                            ? "bg-purple-500/20" 
                                            : "bg-green-500/20"
                                    }`}>
                                        {coupon.discount_type === "percentage" 
                                            ? <Percent className="w-5 h-5 text-purple-400" />
                                            : <DollarSign className="w-5 h-5 text-green-400" />
                                        }
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-white text-lg">
                                                {coupon.code}
                                            </span>
                                            <button
                                                onClick={() => copyCode(coupon.code)}
                                                className="p-1 hover:bg-white/10 rounded"
                                            >
                                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-purple-400 font-semibold">
                                            {coupon.discount_type === "percentage" 
                                                ? `${coupon.discount_value}% OFF`
                                                : `₹${coupon.discount_value} OFF`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={coupon.is_active}
                                    onCheckedChange={() => handleToggleActive(coupon)}
                                />
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                                {coupon.max_uses && (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Users className="w-4 h-4" />
                                        <span>Max uses: {coupon.max_uses}</span>
                                    </div>
                                )}
                                {coupon.valid_until && (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>Expires: {new Date(coupon.valid_until).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {coupon.min_order_amount && (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <DollarSign className="w-4 h-4" />
                                        <span>Min order: ₹{coupon.min_order_amount}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-slate-700"
                                    onClick={() => openEditDialog(coupon)}
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={showCreateDialog || !!editingCoupon} onOpenChange={(open) => {
                if (!open) {
                    setShowCreateDialog(false);
                    setEditingCoupon(null);
                    resetForm();
                }
            }}>
                <DialogContent className="glass-heavy border-purple-500/20 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Tag className="w-5 h-5 text-purple-400" />
                            {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-slate-300 text-sm">Coupon Code</label>
                            <div className="flex gap-2">
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        code: e.target.value.toUpperCase() 
                                    }))}
                                    placeholder="e.g., SAVE20"
                                    className="input-neon font-mono"
                                    data-testid="coupon-code-input"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={generateRandomCode}
                                    className="border-slate-700"
                                >
                                    Generate
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm">Discount Type</label>
                                <Select
                                    value={formData.discount_type}
                                    onValueChange={(value) => setFormData(prev => ({ 
                                        ...prev, 
                                        discount_type: value 
                                    }))}
                                >
                                    <SelectTrigger className="input-neon">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm">
                                    {formData.discount_type === "percentage" ? "Discount %" : "Discount ₹"}
                                </label>
                                <Input
                                    type="number"
                                    value={formData.discount_value}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        discount_value: e.target.value 
                                    }))}
                                    placeholder={formData.discount_type === "percentage" ? "20" : "100"}
                                    className="input-neon"
                                    data-testid="discount-value-input"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm">Max Uses (optional)</label>
                                <Input
                                    type="number"
                                    value={formData.max_uses}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        max_uses: e.target.value 
                                    }))}
                                    placeholder="Unlimited"
                                    className="input-neon"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm">Min Order ₹ (optional)</label>
                                <Input
                                    type="number"
                                    value={formData.min_order_amount}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        min_order_amount: e.target.value 
                                    }))}
                                    placeholder="No minimum"
                                    className="input-neon"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-300 text-sm">Valid Until (optional)</label>
                            <Input
                                type="date"
                                value={formData.valid_until}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    valid_until: e.target.value 
                                }))}
                                className="input-neon"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCreateDialog(false);
                                    setEditingCoupon(null);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="btn-primary"
                                onClick={editingCoupon ? handleUpdateCoupon : handleCreateCoupon}
                                data-testid="save-coupon-btn"
                            >
                                {editingCoupon ? "Update Coupon" : "Create Coupon"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
