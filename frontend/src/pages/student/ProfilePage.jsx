import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { User, Mail, Phone, Save, Camera, Building, GraduationCap, BookOpen, Hash, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProfilePage() {
    const { user, updateProfile, accessToken, fetchUser } = useAuthStore();
    const fileInputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        phone: user?.phone || "",
        bio: user?.bio || "",
        college_name: user?.college_details?.college_name || "",
        degree: user?.college_details?.degree || "",
        branch: user?.college_details?.branch || "",
        year_of_study: user?.college_details?.year_of_study || "",
        roll_number: user?.college_details?.roll_number || ""
    });

    useEffect(() => {
        // Fetch profile image from backend
        const fetchProfileImage = async () => {
            if (accessToken) {
                try {
                    const response = await axios.get(`${API}/user/profile-image`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    if (response.data.image_url) {
                        setProfileImageUrl(response.data.image_url);
                    }
                } catch (error) {
                    console.error("Failed to fetch profile image:", error);
                }
            }
        };
        fetchProfileImage();
    }, [user, accessToken]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file type. Only JPG, PNG, WEBP allowed");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large. Max 5MB allowed");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(
                `${API}/user/upload-profile-image`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );
            toast.success("Profile image uploaded!");
            
            // Refresh profile image
            const imgResponse = await axios.get(`${API}/user/profile-image`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (imgResponse.data.image_url) {
                setProfileImageUrl(imgResponse.data.image_url);
            }
            
            // Refresh user data
            await fetchUser();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await updateProfile(formData);
        if (result.success) {
            toast.success("Profile updated successfully!");
        } else {
            toast.error(result.error);
        }
        setIsLoading(false);
    };

    const avatarUrl = profileImageUrl || user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;

    return (
        <div className="max-w-2xl mx-auto space-y-6" data-testid="profile-page">
            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">Profile Settings</h1>
                <p className="text-slate-400">Manage your account information</p>
            </div>

            <div className="glass-heavy rounded-xl p-6 lg:p-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/10">
                    <div className="relative">
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-24 h-24 rounded-2xl border-2 border-purple-500 object-cover"
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Camera className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <div>
                        <h2 className="font-outfit text-xl font-semibold text-white">
                            {user?.first_name} {user?.last_name}
                        </h2>
                        <p className="text-slate-400">{user?.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-400 capitalize">
                            {user?.role}
                        </span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-slate-300">First Name</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <Input
                                        id="first_name"
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="pl-12 input-neon"
                                        data-testid="profile-firstname-input"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-slate-300">Last Name</Label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="input-neon"
                                    data-testid="profile-lastname-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                                id="email"
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="pl-12 input-neon opacity-50 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-slate-500">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                                className="pl-12 input-neon"
                                data-testid="profile-phone-input"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                        <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            className="input-neon min-h-[100px]"
                            data-testid="profile-bio-input"
                        />
                    </div>

                    {/* College Details */}
                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">College Details</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="college_name" className="text-slate-300">College/University Name</Label>
                                <div className="relative">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <Input
                                        id="college_name"
                                        type="text"
                                        value={formData.college_name}
                                        onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                                        placeholder="Enter your college name"
                                        className="pl-12 input-neon"
                                        data-testid="profile-college-input"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="degree" className="text-slate-300">Degree</Label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <Input
                                            id="degree"
                                            type="text"
                                            value={formData.degree}
                                            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                                            placeholder="e.g., B.Tech, MBA"
                                            className="pl-12 input-neon"
                                            data-testid="profile-degree-input"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="branch" className="text-slate-300">Branch/Major</Label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <Input
                                            id="branch"
                                            type="text"
                                            value={formData.branch}
                                            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                            placeholder="e.g., Computer Science"
                                            className="pl-12 input-neon"
                                            data-testid="profile-branch-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="year_of_study" className="text-slate-300">Year of Study</Label>
                                    <Input
                                        id="year_of_study"
                                        type="text"
                                        value={formData.year_of_study}
                                        onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                                        placeholder="e.g., 3rd Year"
                                        className="input-neon"
                                        data-testid="profile-year-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roll_number" className="text-slate-300">Roll Number</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <Input
                                            id="roll_number"
                                            type="text"
                                            value={formData.roll_number}
                                            onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                                            placeholder="Your roll number"
                                            className="pl-12 input-neon"
                                            data-testid="profile-roll-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="btn-primary"
                        disabled={isLoading}
                        data-testid="save-profile-btn"
                    >
                        {isLoading ? (
                            "Saving..."
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </form>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="font-outfit text-2xl font-bold text-white">{user?.points || 0}</p>
                    <p className="text-sm text-slate-500">Points</p>
                </div>
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="font-outfit text-2xl font-bold text-white">{user?.badges?.length || 0}</p>
                    <p className="text-sm text-slate-500">Badges</p>
                </div>
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="font-outfit text-2xl font-bold text-white">${user?.wallet_balance?.toFixed(2) || "0.00"}</p>
                    <p className="text-sm text-slate-500">Wallet</p>
                </div>
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="font-outfit text-2xl font-bold text-white">${user?.total_earnings?.toFixed(2) || "0.00"}</p>
                    <p className="text-sm text-slate-500">Earnings</p>
                </div>
            </div>

            {/* Referral Code */}
            <div className="glass-medium rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Your Referral Code</h3>
                <div className="referral-code-box rounded-lg p-4 text-center">
                    <p className="font-mono text-2xl font-bold text-white">{user?.referral_code}</p>
                    <p className="text-sm text-slate-500 mt-2">Share this code to earn 20% lifetime commission</p>
                </div>
            </div>
        </div>
    );
}
