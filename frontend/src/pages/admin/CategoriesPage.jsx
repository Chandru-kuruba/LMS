import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    FolderOpen,
    Plus,
    Edit2,
    Trash2,
    Search,
    BookOpen,
    Check,
    X,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminCategoriesPage() {
    const { accessToken } = useAuthStore();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Dialog states
    const [showDialog, setShowDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState("create"); // "create" or "edit"
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: ""
    });

    useEffect(() => {
        fetchCategories();
    }, [accessToken]);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API}/admin/categories`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            toast.error("Failed to load categories");
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateDialog = () => {
        setDialogMode("create");
        setFormData({ name: "", description: "", icon: "" });
        setSelectedCategory(null);
        setShowDialog(true);
    };

    const openEditDialog = (category) => {
        setDialogMode("edit");
        setFormData({
            name: category.name,
            description: category.description || "",
            icon: category.icon || ""
        });
        setSelectedCategory(category);
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            if (dialogMode === "create") {
                const params = new URLSearchParams();
                params.append("name", formData.name);
                if (formData.description) params.append("description", formData.description);
                if (formData.icon) params.append("icon", formData.icon);
                
                await axios.post(`${API}/admin/categories?${params.toString()}`, null, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                toast.success("Category created!");
            } else {
                const params = new URLSearchParams();
                params.append("name", formData.name);
                if (formData.description) params.append("description", formData.description);
                if (formData.icon) params.append("icon", formData.icon);
                
                await axios.put(
                    `${API}/admin/categories/${selectedCategory.id}?${params.toString()}`,
                    null,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                toast.success("Category updated!");
            }
            setShowDialog(false);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to save category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) return;
        
        try {
            await axios.delete(`${API}/admin/categories/${category.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Category deleted!");
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to delete category");
        }
    };

    const handleToggleActive = async (category) => {
        try {
            await axios.put(
                `${API}/admin/categories/${category.id}?is_active=${!category.is_active}`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success(category.is_active ? "Category disabled" : "Category enabled");
            fetchCategories();
        } catch (error) {
            toast.error("Failed to update category");
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6" data-testid="categories-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-purple-400" />
                        Category Management
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Create and manage course categories</p>
                </div>
                <Button className="btn-primary" onClick={openCreateDialog} data-testid="create-category-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{categories.length}</p>
                    <p className="text-sm text-slate-500">Total Categories</p>
                </div>
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">
                        {categories.filter(c => c.is_active).length}
                    </p>
                    <p className="text-sm text-slate-500">Active</p>
                </div>
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-400">
                        {categories.reduce((sum, c) => sum + (c.course_count || 0), 0)}
                    </p>
                    <p className="text-sm text-slate-500">Total Courses</p>
                </div>
            </div>

            {/* Search */}
            <div className="glass-heavy rounded-xl p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 input-neon"
                    />
                </div>
            </div>

            {/* Categories List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="text-center py-12 glass-medium rounded-xl">
                        <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">
                            {categories.length === 0 ? "No categories yet. Create your first category!" : "No categories match your search"}
                        </p>
                    </div>
                ) : (
                    filteredCategories.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`glass-medium rounded-xl p-5 flex items-center justify-between ${
                                !category.is_active ? 'opacity-60' : ''
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                                    <FolderOpen className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-white">{category.name}</h3>
                                        {!category.is_active && (
                                            <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                                                Disabled
                                            </span>
                                        )}
                                    </div>
                                    {category.description && (
                                        <p className="text-sm text-slate-400 mt-1">{category.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            {category.course_count || 0} courses
                                        </span>
                                        <span>
                                            Created: {new Date(category.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {/* Toggle Active */}
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={category.is_active}
                                        onCheckedChange={() => handleToggleActive(category)}
                                    />
                                </div>
                                
                                {/* Edit */}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-blue-400 hover:text-blue-300"
                                    onClick={() => openEditDialog(category)}
                                    data-testid={`edit-category-${category.id}`}
                                >
                                    <Edit2 className="w-5 h-5" />
                                </Button>
                                
                                {/* Delete */}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => handleDelete(category)}
                                    data-testid={`delete-category-${category.id}`}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="glass-heavy border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-purple-400" />
                            {dialogMode === "create" ? "Create Category" : "Edit Category"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Category Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Web Development"
                                className="input-neon"
                                data-testid="category-name-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of this category..."
                                className="input-neon"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Icon (optional)</Label>
                            <Input
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="e.g. code, palette, chart"
                                className="input-neon"
                            />
                            <p className="text-xs text-slate-500">Icon name for display (optional)</p>
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            className="btn-primary" 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            {dialogMode === "create" ? "Create Category" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
