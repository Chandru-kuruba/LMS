import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Company logos
const COMPANY_LOGO = "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/8733xudx_Untitled_design-removebg-preview.png";
const MSME_LOGO = "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/pmw7was4_msme.png";
const ISO_LOGO = "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/yn7tm6lm_iso.png";

export const MainLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [cms, setCms] = useState(null);
    const { isAuthenticated, user, logout } = useAuthStore();
    const { items: cartItems } = useCartStore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCms = async () => {
            try {
                const response = await axios.get(`${API}/cms`);
                setCms(response.data.sections || {});
            } catch (error) {
                console.error("Failed to fetch CMS:", error);
            }
        };
        fetchCms();
    }, []);

    const navbarCms = cms?.navbar || {};
    const footerCms = cms?.footer || {};
    
    const logoText = navbarCms.logo?.text || "Chand Web Technology";
    const logoImage = navbarCms.logo?.image || COMPANY_LOGO;

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
                            <img src={logoImage} alt="Logo" className="h-10 w-auto object-contain" />
                            <span className="font-outfit text-lg font-bold gradient-text hidden sm:block">
                                {logoText}
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
                                <img src={logoImage} alt="Logo" className="h-10 w-auto object-contain" />
                                <span className="font-outfit text-lg font-bold gradient-text">
                                    {footerCms.company?.name || logoText}
                                </span>
                            </Link>
                            <p className="text-slate-500 text-sm mb-4">
                                {footerCms.company?.description || "Empowering learners worldwide with quality education."}
                            </p>
                            {/* Certification logos */}
                            <div className="flex items-center gap-3 mt-4">
                                <img src={MSME_LOGO} alt="MSME Certified" className="h-8 object-contain" />
                                <img src={ISO_LOGO} alt="ISO 9001:2015" className="h-8 object-contain" />
                            </div>
                        </div>

                        <div>
                            <h4 className="font-outfit font-semibold text-white mb-4">Platform</h4>
                            <ul className="space-y-2">
                                <li><Link to="/courses" className="text-slate-500 hover:text-white transition-colors text-sm">Browse Courses</Link></li>
                                <li><Link to="/#pricing" className="text-slate-500 hover:text-white transition-colors text-sm">Pricing</Link></li>
                                <li><Link to="/#faq" className="text-slate-500 hover:text-white transition-colors text-sm">FAQ</Link></li>
                                <li><Link to="/verify" className="text-slate-500 hover:text-white transition-colors text-sm">Verify Certificate</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-outfit font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-2">
                                <li><Link to="/page/about" className="text-slate-500 hover:text-white transition-colors text-sm">About Us</Link></li>
                                <li><Link to="/page/contact" className="text-slate-500 hover:text-white transition-colors text-sm">Contact</Link></li>
                                <li><Link to="/page/careers" className="text-slate-500 hover:text-white transition-colors text-sm">Careers</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-outfit font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-2">
                                <li><Link to="/page/privacy-policy" className="text-slate-500 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                                <li><Link to="/page/terms-of-service" className="text-slate-500 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
                                <li><Link to="/page/refund-policy" className="text-slate-500 hover:text-white transition-colors text-sm">Refund Policy</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-500 text-sm">
                            © {new Date().getFullYear()} {footerCms.company?.name || "Chand Web Technology"}. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href={footerCms.social?.twitter || "#"} className="text-slate-500 hover:text-purple-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                            </a>
                            <a href={footerCms.social?.linkedin || "#"} className="text-slate-500 hover:text-purple-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            </a>
                            <a href={footerCms.social?.instagram || "#"} className="text-slate-500 hover:text-purple-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
