import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { CreditCard, Tag, Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { user, accessToken } = useAuthStore();
    const { items, total, fetchCart, clearCart } = useCartStore();
    const [couponCode, setCouponCode] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (accessToken) fetchCart();
    }, [accessToken, fetchCart]);

    useEffect(() => {
        if (items.length === 0) {
            navigate("/cart");
        }
    }, [items, navigate]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error("Please enter a coupon code");
            return;
        }
        
        setIsApplyingCoupon(true);
        // In a real implementation, validate coupon with backend
        setTimeout(() => {
            toast.info("Coupon will be applied at checkout");
            setIsApplyingCoupon(false);
        }, 1000);
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        
        try {
            const response = await axios.post(
                `${API}/payments/initiate`,
                null,
                {
                    params: { coupon_code: couponCode || undefined },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            const paymentData = response.data;

            // In a real implementation, redirect to PayU
            // For demo, simulate successful payment
            toast.success("Redirecting to payment gateway...");

            // Simulate payment completion
            setTimeout(async () => {
                try {
                    await axios.post(
                        `${API}/payments/success`,
                        null,
                        {
                            params: {
                                txnid: paymentData.txn_id,
                                status: "success",
                                hash: paymentData.hash,
                                mihpayid: `PAYU${Date.now()}`
                            },
                            headers: { Authorization: `Bearer ${accessToken}` }
                        }
                    );
                    
                    clearCart();
                    toast.success("Payment successful! Courses added to your account.");
                    navigate("/my-courses");
                } catch (error) {
                    toast.error("Payment verification failed");
                    setIsProcessing(false);
                }
            }, 2000);

        } catch (error) {
            toast.error(error.response?.data?.detail || "Payment initiation failed");
            setIsProcessing(false);
        }
    };

    const finalTotal = total - discount;

    return (
        <div className="max-w-4xl mx-auto space-y-6" data-testid="checkout-page">
            <Button
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={() => navigate("/cart")}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cart
            </Button>

            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">Checkout</h1>
                <p className="text-slate-400">Complete your purchase</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="glass-medium rounded-xl p-6">
                        <h2 className="font-semibold text-white mb-4">Order Items</h2>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 pb-4 border-b border-white/10 last:border-0 last:pb-0">
                                    <img
                                        src={item.course?.thumbnail_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400"}
                                        alt={item.course?.title}
                                        className="w-24 h-16 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-white line-clamp-1">
                                            {item.course?.title}
                                        </h3>
                                        <p className="text-sm text-slate-500">{item.course?.category}</p>
                                    </div>
                                    <p className="font-semibold text-purple-400">
                                        ₹{item.price?.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Coupon */}
                    <div className="glass-medium rounded-xl p-6">
                        <h2 className="font-semibold text-white mb-4">Have a coupon?</h2>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                    type="text"
                                    placeholder="Enter coupon code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    className="pl-12 input-neon"
                                    data-testid="coupon-input"
                                />
                            </div>
                            <Button
                                className="btn-secondary"
                                onClick={handleApplyCoupon}
                                disabled={isApplyingCoupon}
                            >
                                {isApplyingCoupon ? "Applying..." : "Apply"}
                            </Button>
                        </div>
                    </div>

                    {/* Billing Info */}
                    <div className="glass-medium rounded-xl p-6">
                        <h2 className="font-semibold text-white mb-4">Billing Information</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-slate-400">First Name</Label>
                                <Input
                                    value={user?.first_name || ""}
                                    disabled
                                    className="mt-1 input-neon"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-400">Last Name</Label>
                                <Input
                                    value={user?.last_name || ""}
                                    disabled
                                    className="mt-1 input-neon"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Label className="text-slate-400">Email</Label>
                                <Input
                                    value={user?.email || ""}
                                    disabled
                                    className="mt-1 input-neon"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="glass-heavy rounded-xl p-6 sticky top-24 neon-border-purple">
                        <h2 className="font-outfit text-xl font-bold text-white mb-6">Payment Summary</h2>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-green-400">
                                    <span>Discount</span>
                                    <span>-${discount.toFixed(2)}</span>
                                </div>
                            )}
                            <hr className="border-white/10" />
                            <div className="flex justify-between text-white font-semibold text-xl">
                                <span>Total</span>
                                <span className="gradient-text">${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full btn-primary py-4"
                            onClick={handlePayment}
                            disabled={isProcessing}
                            data-testid="pay-now-btn"
                        >
                            {isProcessing ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Pay ${finalTotal.toFixed(2)}
                                </>
                            )}
                        </Button>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Lock className="w-4 h-4" />
                                <span>Secure SSL encryption</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <ShieldCheck className="w-4 h-4" />
                                <span>30-day money-back guarantee</span>
                            </div>
                        </div>

                        <p className="text-center text-xs text-slate-600 mt-4">
                            By completing your purchase, you agree to our Terms of Service
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
