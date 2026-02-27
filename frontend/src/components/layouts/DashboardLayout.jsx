import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    BookOpen,
    ShoppingCart,
    Heart,
    User,
    Share2,
    Receipt,
    HelpCircle,
    LogOut,
    Menu,
    X,
    Zap,
    ChevronRight,
    Settings,
    Bell,
    Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { NotificationDropdown } from "@/components/NotificationDropdown";

const sidebarLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: BookOpen, label: "My Courses", href: "/my-courses" },
    { icon: Award, label: "Certificates", href: "/certificates" },
    { icon: ShoppingCart, label: "Cart", href: "/cart" },
    { icon: Heart, label: "Wishlist", href: "/wishlist" },
    { icon: Share2, label: "Referrals", href: "/referrals" },
    { icon: Receipt, label: "Orders", href: "/orders" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: HelpCircle, label: "Support", href: "/tickets" },
    { icon: User, label: "Profile", href: "/profile" },
];

export const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { items: cartItems } = useCartStore();

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
                        <span className="font-outfit text-xl font-bold gradient-text">
                            LUMINA
                        </span>
                    </Link>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="px-3 space-y-1">
                        {sidebarLinks.map((link) => {
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
                                    data-testid={`sidebar-${link.label.toLowerCase().replace(' ', '-')}`}
                                >
                                    <link.icon className="w-5 h-5" />
                                    <span className="font-medium">{link.label}</span>
                                    {link.label === "Cart" && cartItems.length > 0 && (
                                        <span className="ml-auto w-5 h-5 bg-purple-600 rounded-full text-xs flex items-center justify-center text-white">
                                            {cartItems.length}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                {/* User Section */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full border border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">
                                {user?.first_name} {user?.last_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={handleLogout}
                        data-testid="sidebar-logout"
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
                            {/* Mobile Sidebar Content */}
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <Link to="/" className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-outfit text-xl font-bold gradient-text">
                                        LUMINA
                                    </span>
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
                                    {sidebarLinks.map((link) => {
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
                            data-testid="mobile-sidebar-btn"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        {/* Breadcrumb */}
                        <div className="hidden lg:flex items-center gap-2 text-sm">
                            <Link to="/dashboard" className="text-slate-500 hover:text-white transition-colors">
                                Dashboard
                            </Link>
                            {location.pathname !== "/dashboard" && (
                                <>
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                    <span className="text-white capitalize">
                                        {location.pathname.split("/").pop().replace("-", " ")}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* Notifications */}
                            <NotificationDropdown />

                            {/* Browse Courses */}
                            <Link to="/courses">
                                <Button className="hidden sm:flex btn-primary text-sm py-2 px-4">
                                    Browse Courses
                                </Button>
                            </Link>

                            {/* Admin Link */}
                            {user?.role === "admin" && (
                                <Link to="/admin">
                                    <Button variant="outline" className="hidden sm:flex border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Admin
                                    </Button>
                                </Link>
                            )}
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

export default DashboardLayout;
