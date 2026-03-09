import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultPlans = [
    {
        name: "Free",
        price: 0,
        description: "Get started with basic courses",
        icon: Sparkles,
        color: "slate",
        features: [
            "Access to free courses",
            "Community forums",
            "Basic progress tracking",
            "Email support"
        ],
        cta: "Get Started",
        popular: false
    },
    {
        name: "Pro",
        price: 29,
        period: "month",
        description: "For serious learners",
        icon: Zap,
        color: "purple",
        features: [
            "All Free features",
            "Unlimited course access",
            "Certificate generation",
            "Priority support",
            "Offline downloads",
            "Project reviews"
        ],
        cta: "Start Pro",
        popular: true
    },
    {
        name: "Enterprise",
        price: 99,
        period: "month",
        description: "For teams and organizations",
        icon: Crown,
        color: "yellow",
        features: [
            "All Pro features",
            "Team management",
            "Custom learning paths",
            "Analytics dashboard",
            "API access",
            "Dedicated account manager",
            "Custom integrations"
        ],
        cta: "Contact Sales",
        popular: false
    }
];

export default function PricingPage() {
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await axios.get(`${API}/public/cms/pricing`);
            setContent(response.data.content || {});
        } catch (error) {
            setContent({});
        } finally {
            setIsLoading(false);
        }
    };

    const plans = content?.plans?.length > 0 ? content.plans : defaultPlans;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 pt-24 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-12 w-64 mx-auto mb-8" />
                    <div className="grid md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-16" data-testid="pricing-page">
            <div className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="font-outfit text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {content?.title || "Simple, Transparent Pricing"}
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        {content?.subtitle || "Choose the plan that's right for you. All plans include a 7-day free trial."}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => {
                        const Icon = plan.icon || Sparkles;
                        const colorClasses = {
                            slate: "border-slate-600",
                            purple: "border-purple-500 neon-border-purple",
                            yellow: "border-yellow-500"
                        };

                        return (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className={`relative glass-heavy rounded-2xl p-8 ${
                                    plan.popular ? colorClasses.purple : "border border-white/10"
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-semibold text-white">
                                        Most Popular
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                                        plan.popular ? "bg-purple-600/20" : "bg-slate-700/50"
                                    }`}>
                                        <Icon className={`w-8 h-8 ${plan.popular ? "text-purple-400" : "text-slate-400"}`} />
                                    </div>
                                    <h3 className="font-outfit text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                    <p className="text-slate-400">{plan.description}</p>
                                </div>

                                <div className="text-center mb-8">
                                    <div className="flex items-baseline justify-center">
                                        <span className="text-4xl font-bold text-white">
                                            ₹{plan.price}
                                        </span>
                                        {plan.period && (
                                            <span className="text-slate-400 ml-2">/{plan.period}</span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-start gap-3">
                                            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                                plan.popular ? "text-purple-400" : "text-green-400"
                                            }`} />
                                            <span className="text-slate-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link to={plan.price === 0 ? "/register" : "/contact"}>
                                    <Button
                                        className={`w-full ${
                                            plan.popular
                                                ? "btn-primary"
                                                : "bg-slate-700 hover:bg-slate-600 text-white"
                                        }`}
                                    >
                                        {plan.cta}
                                    </Button>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* FAQ Link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <p className="text-slate-400">
                        Have questions? Check out our{" "}
                        <Link to="/faq" className="text-purple-400 hover:underline">FAQ</Link>
                        {" "}or{" "}
                        <Link to="/contact" className="text-purple-400 hover:underline">contact us</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
