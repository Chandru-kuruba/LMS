import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/store/authStore";

// Layouts
import { MainLayout } from "@/components/layouts/MainLayout";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";

// Public Pages
import LandingPage from "@/pages/LandingPage";
import CoursesPage from "@/pages/CoursesPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import VerifyOTPPage from "@/pages/auth/VerifyOTPPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import DynamicPage from "@/pages/DynamicPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import FAQPage from "@/pages/FAQPage";
import PricingPage from "@/pages/PricingPage";
import VerifyCertificatePage from "@/pages/VerifyCertificatePage";

// Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import EnrolledCoursesPage from "@/pages/student/EnrolledCourses";
import CoursePlayerPage from "@/pages/student/CoursePlayer";
import CartPage from "@/pages/student/CartPage";
import CheckoutPage from "@/pages/student/CheckoutPage";
import WishlistPage from "@/pages/student/WishlistPage";
import ProfilePage from "@/pages/student/ProfilePage";
import ReferralsPage from "@/pages/student/ReferralsPage";
import OrdersPage from "@/pages/student/OrdersPage";
import TicketsPage from "@/pages/student/TicketsPage";
import NotificationsPage from "@/pages/student/NotificationsPage";
import CertificatesPage from "@/pages/student/CertificatesPage";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsersPage from "@/pages/admin/UsersPage";
import AdminCoursesPage from "@/pages/admin/CoursesPage";
import AdminWithdrawalsPage from "@/pages/admin/WithdrawalsPage";
import AdminCMSPage from "@/pages/admin/CMSPage";
import CourseEditorPage from "@/pages/admin/CourseEditor";
import AdminTicketsPage from "@/pages/admin/TicketsPage";
import AdminUserPerformancePage from "@/pages/admin/UserPerformancePage";
import AdminNotificationsPage from "@/pages/admin/NotificationsPage";
import AdminCertificatesManagePage from "@/pages/admin/CertificatesManagePage";
import CertificateDesignPage from "@/pages/admin/CertificateDesignPage";
import AdminSettingsPage from "@/pages/admin/SettingsPage";

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && user?.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    const { initializeAuth } = useAuthStore();

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    return (
        <div className="min-h-screen bg-[#0F172A]">
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/courses" element={<CoursesPage />} />
                        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/page/:slug" element={<DynamicPage />} />
                        <Route path="/privacy-policy" element={<DynamicPage />} />
                        <Route path="/terms-of-service" element={<DynamicPage />} />
                        <Route path="/refund-policy" element={<DynamicPage />} />
                        <Route path="/careers" element={<DynamicPage />} />
                        <Route path="/verify" element={<VerifyCertificatePage />} />
                        <Route path="/verify/:certId" element={<VerifyCertificatePage />} />
                    </Route>

                    {/* Auth Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-otp" element={<VerifyOTPPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Student Dashboard Routes */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<StudentDashboard />} />
                        <Route path="/my-courses" element={<EnrolledCoursesPage />} />
                        <Route path="/learn/:courseId" element={<CoursePlayerPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/wishlist" element={<WishlistPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/referrals" element={<ReferralsPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/tickets" element={<TicketsPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/certificates" element={<CertificatesPage />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route
                        element={
                            <ProtectedRoute requireAdmin>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                        <Route path="/admin/courses" element={<AdminCoursesPage />} />
                        <Route path="/admin/courses/:courseId" element={<CourseEditorPage />} />
                        <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
                        <Route path="/admin/cms" element={<AdminCMSPage />} />
                        <Route path="/admin/tickets" element={<AdminTicketsPage />} />
                        <Route path="/admin/users/:userId/performance" element={<AdminUserPerformancePage />} />
                        <Route path="/admin/certificates" element={<AdminCertificatesManagePage />} />
                        <Route path="/admin/certificate-design" element={<CertificateDesignPage />} />
                        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
            <Toaster position="top-right" richColors />
        </div>
    );
}

export default App;
