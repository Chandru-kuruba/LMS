import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    BookOpen, 
    ShoppingCart, 
    Heart, 
    User, 
    Menu, 
    X, 
    LogIn,
    ChevronDown,
    Search,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export const MainLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { isAuthenticated, user, logout } = useAuthStore();
    const { items: cartItems } = useCartStore();
    const navigate = useNavigate();

    const navLinks = [
        { label: "Courses", href: "/courses", icon: BookOpen },
        { label: "Pricing", href: "/#pricing", icon: Zap },
    ];

    return (
        <div className="min-h-screen bg-[#0F172A] bg-mesh">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-heavy">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-outfit text-xl font-bold gradient-text hidden sm:block">
                                LUMINA
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className="text-slate-400 hover:text-white transition-colors duration-200 font-medium"
                                    data-testid={`nav-${link.label.toLowerCase()}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            {/* Search Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white hover:bg-white/5"
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                data-testid="search-btn"
                            >
                                <Search className="w-5 h-5" />
                            </Button>

                            {isAuthenticated ? (
                                <>
                                    {/* Cart */}
                                    <Link to="/cart" className="relative" data-testid="cart-btn">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-white hover:bg-white/5"
                                        >
                                            <ShoppingCart className="w-5 h-5" />
                                        </Button>
                                        {cartItems.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full text-xs flex items-center justify-center text-white font-medium">
                                                {cartItems.length}
                                            </span>
                                        )}
                                    </Link>

                                    {/* Wishlist */}
                                    <Link to="/wishlist" className="hidden sm:block" data-testid="wishlist-btn">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-white hover:bg-white/5"
                                        >
                                            <Heart className="w-5 h-5" />
                                        </Button>
                                    </Link>

                                    {/* User Menu */}
                                    <div className="relative group">
                                        <Button
                                            variant="ghost"
                                            className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5"
                                            data-testid="user-menu-btn"
                                        >
                                            <img
                                                src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                                                alt="Avatar"
                                                className="w-8 h-8 rounded-full border border-white/10"
                                            />
                                            <span className="hidden sm:block font-medium">
                                                {user?.first_name}
                                            </span>
                                            <ChevronDown className="w-4 h-4" />
                                        </Button>

                                        {/* Dropdown */}
                                        <div className="absolute right-0 top-full mt-2 w-48 py-2 glass-heavy rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                            <Link
                                                to="/dashboard"
                                                className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                                data-testid="dashboard-link"
                                            >
                                                Dashboard
                                            </Link>
                                            <Link
                                                to="/my-courses"
                                                className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                My Courses
                                            </Link>
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                Profile
                                            </Link>
                                            {user?.role === "admin" && (
                                                <Link
                                                    to="/admin"
                                                    className="block px-4 py-2 text-purple-400 hover:text-purple-300 hover:bg-white/5 transition-colors"
                                                    data-testid="admin-link"
                                                >
                                                    Admin Panel
                                                </Link>
                                            )}
                                            <hr className="my-2 border-white/10" />
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    navigate("/");
                                                }}
                                                className="block w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                                                data-testid="logout-btn"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link to="/login">
                                        <Button
                                            variant="ghost"
                                            className="text-slate-400 hover:text-white hidden sm:flex"
                                            data-testid="login-btn"
                                        >
                                            <LogIn className="w-4 h-4 mr-2" />
                                            Login
                                        </Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button className="btn-primary text-sm py-2 px-4" data-testid="get-started-btn">
                                            Get Started
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden text-slate-400 hover:text-white hover:bg-white/5"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                data-testid="mobile-menu-btn"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden glass-heavy border-t border-white/10"
                        >
                            <div className="px-4 py-4 space-y-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <link.icon className="w-5 h-5" />
                                        {link.label}
                                    </Link>
                                ))}
                                {isAuthenticated && (
                                    <>
                                        <hr className="border-white/10 my-2" />
                                        <Link
                                            to="/wishlist"
                                            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <Heart className="w-5 h-5" />
                                            Wishlist
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search Overlay */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 glass-heavy border-t border-white/10 p-4"
                        >
                            <div className="max-w-2xl mx-auto">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search for courses..."
                                        className="w-full input-neon pl-12 pr-4"
                                        autoFocus
                                        data-testid="search-input"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Main Content */}
            <main className="pt-16 lg:pt-20">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-slate-900/50 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="col-span-2 md:col-span-1">
                            <Link to="/" className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-outfit text-xl font-bold gradient-text">
                                    LUMINA
                                </span>
                            </Link>
                            <p className="text-slate-500 text-sm">
                                Master new skills with industry-leading courses. Join thousands of learners worldwide.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-outfit font-semibold text-white mb-4">Platform</h4>
                            <ul className="space-y-2">
                                <li><Link to="/courses" className="text-slate-500 hover:text-white transition-colors text-sm">Browse Courses</Link></li>
                                <li><Link to="/#pricing" className="text-slate-500 hover:text-white transition-colors text-sm">Pricing</Link></li>
                                <li><Link to="/#faq" className="text-slate-500 hover:text-white transition-colors text-sm">FAQ</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-outfit font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">About Us</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Contact</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Careers</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-outfit font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Terms of Service</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Refund Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-500 text-sm">
                            © {new Date().getFullYear()} LUMINA. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-slate-500 hover:text-purple-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                            </a>
                            <a href="#" className="text-slate-500 hover:text-purple-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            </a>
                            <a href="#" className="text-slate-500 hover:text-purple-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
