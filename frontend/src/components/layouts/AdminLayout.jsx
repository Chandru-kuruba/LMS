import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    DollarSign,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Zap,
    ChevronRight,
    ArrowLeft,
    MessageSquare,
    Award,
    Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/store/authStore";

const adminLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Users, label: "Users", href: "/admin/users" },
    { icon: BookOpen, label: "Courses", href: "/admin/courses" },
    { icon: Award, label: "Certificates", href: "/admin/certificates" },
    { icon: Palette, label: "Cert Design", href: "/admin/certificate-design" },
    { icon: Bell, label: "Notifications", href: "/admin/notifications" },
    { icon: DollarSign, label: "Withdrawals", href: "/admin/withdrawals" },
    { icon: MessageSquare, label: "Tickets", href: "/admin/tickets" },
    { icon: FileText, label: "CMS", href: "/admin/cms" },
];

export const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 min-h-screen glass-heavy border-r border-white/10 fixed left-0 top-0 bottom-0">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-outfit text-xl font-bold gradient-text block">
                                LUMINA
                            </span>
                            <span className="text-xs text-purple-400 font-medium">ADMIN</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="px-3 space-y-1">
                        {adminLinks.map((link) => {
                            const isActive = location.pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                                        isActive
                                            ? "bg-purple-600/20 text-purple-400 active"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                                    data-testid={`admin-sidebar-${link.label.toLowerCase()}`}
                                >
                                    <link.icon className="w-5 h-5" />
                                    <span className="font-medium">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="px-3 mt-6">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to App</span>
                        </Link>
                    </div>
                </ScrollArea>

                {/* User Section */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={user?.profile_image_url || user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full border-2 border-purple-500 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">
                                {user?.first_name} {user?.last_name}
                            </p>
                            <p className="text-xs text-purple-400 font-medium">Administrator</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={handleLogout}
                        data-testid="admin-logout"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-72 glass-heavy border-r border-white/10 z-50 lg:hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <Link to="/" className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <span className="font-outfit text-xl font-bold gradient-text block">
                                            LUMINA
                                        </span>
                                        <span className="text-xs text-purple-400 font-medium">ADMIN</span>
                                    </div>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <ScrollArea className="flex-1 py-4">
                                <nav className="px-3 space-y-1">
                                    {adminLinks.map((link) => {
                                        const isActive = location.pathname === link.href;
                                        return (
                                            <Link
                                                key={link.href}
                                                to={link.href}
                                                onClick={() => setIsSidebarOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                                                    isActive
                                                        ? "bg-purple-600/20 text-purple-400"
                                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                                }`}
                                            >
                                                <link.icon className="w-5 h-5" />
                                                <span className="font-medium">{link.label}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </ScrollArea>

                            <div className="p-4 border-t border-white/10">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 glass-heavy border-b border-white/10">
                    <div className="flex items-center justify-between h-16 px-4 lg:px-8">
                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden text-slate-400 hover:text-white"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        {/* Breadcrumb */}
                        <div className="hidden lg:flex items-center gap-2 text-sm">
                            <Link to="/admin" className="text-slate-500 hover:text-white transition-colors">
                                Admin
                            </Link>
                            {location.pathname !== "/admin" && (
                                <>
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                    <span className="text-white capitalize">
                                        {location.pathname.split("/").pop()}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-slate-400 hover:text-white hover:bg-white/5"
                            >
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
