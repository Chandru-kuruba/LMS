import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
    Zap,
    Play,
    Users,
    BookOpen,
    Award,
    ChevronRight,
    Star,
    ArrowRight,
    Check,
    Plus,
    Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function LandingPage() {
    const [courses, setCourses] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [cms, setCms] = useState(null);
    const [stats, setStats] = useState({
        students: "50K+",
        courses: "200+",
        instructors: "50+"
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, faqsRes, cmsRes] = await Promise.all([
                    axios.get(`${API}/courses?limit=6`),
                    axios.get(`${API}/faqs`),
                    axios.get(`${API}/cms`)
                ]);
                setCourses(coursesRes.data.courses || []);
                setFaqs(faqsRes.data.faqs || []);
                
                const sections = cmsRes.data.sections || {};
                setCms(sections);
                
                // Update stats from CMS if available
                if (sections.home?.stats) {
                    setStats(sections.home.stats);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, []);

    // Get CMS content with fallbacks
    const hero = cms?.home?.hero || {
        title: "Master New Skills with",
        brand: "Chand Web Technology",
        subtitle: "Join thousands of students learning from industry experts. Get access to premium courses and earn while you learn.",
        cta_primary: "Browse Courses",
        cta_secondary: "Get Started Free",
        badge: "#1 Online Learning Platform"
    };

    return (
        <div className="bg-[#0F172A]">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden" data-testid="hero-section">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-grid opacity-30" />
                
                {/* Animated Orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial="initial"
                            animate="animate"
                            variants={staggerContainer}
                            className="text-left"
                        >
                            <motion.div variants={fadeInUp} className="mb-6">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light text-purple-400 text-sm font-medium">
                                    <Zap className="w-4 h-4" />
                                    {hero.badge || "#1 Online Learning Platform"}
                                </span>
                            </motion.div>

                            <motion.h1 variants={fadeInUp} className="font-outfit text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
                                {hero.title}{" "}
                                <span className="gradient-text">{hero.brand || "Chand Web Technology"}</span>
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-slate-400 mb-8 max-w-xl">
                                {hero.subtitle || "Join thousands of students learning from industry experts. Get access to premium courses and earn while you learn through our affiliate program."}
                            </motion.p>

                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                                <Link to="/courses">
                                    <Button className="btn-primary text-lg py-4 px-8 w-full sm:w-auto" data-testid="hero-browse-btn">
                                        {hero.cta_primary || "Browse Courses"}
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button className="btn-secondary text-lg py-4 px-8 w-full sm:w-auto" data-testid="hero-signup-btn">
                                        <Play className="w-5 h-5 mr-2" />
                                        {hero.cta_secondary || "Get Started Free"}
                                    </Button>
                                </Link>
                            </motion.div>

                            {/* Stats */}
                            <motion.div variants={fadeInUp} className="mt-12 flex gap-8 sm:gap-12">
                                <div>
                                    <p className="font-outfit text-3xl sm:text-4xl font-bold text-white">{stats.students || "50K+"}</p>
                                    <p className="text-slate-500 text-sm">Students</p>
                                </div>
                                <div>
                                    <p className="font-outfit text-3xl sm:text-4xl font-bold text-white">{stats.courses || "200+"}</p>
                                    <p className="text-slate-500 text-sm">Courses</p>
                                </div>
                                <div>
                                    <p className="font-outfit text-3xl sm:text-4xl font-bold text-white">{stats.instructors || "50+"}</p>
                                    <p className="text-slate-500 text-sm">Instructors</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right Content - Course Cards Stack */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="relative hidden lg:block"
                        >
                            <div className="relative">
                                {/* Floating Cards */}
                                <div className="absolute -top-10 -left-10 w-64 glass-medium rounded-2xl p-4 animate-float">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                                            <Award className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">Certificate</p>
                                            <p className="text-slate-500 text-sm">Upon completion</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-1/3 -right-5 w-64 glass-medium rounded-2xl p-4 animate-float" style={{ animationDelay: "0.5s" }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">20% Commission</p>
                                            <p className="text-slate-500 text-sm">Affiliate program</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Card */}
                                <div className="glass-heavy rounded-3xl p-6 neon-border-purple">
                                    <img
                                        src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"
                                        alt="Featured Course"
                                        className="w-full aspect-video object-cover rounded-2xl mb-4"
                                    />
                                    <h3 className="font-outfit text-xl font-semibold text-white mb-2">
                                        Complete Web Development
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="text-white font-medium">4.9</span>
                                            <span className="text-slate-500">(2.4k)</span>
                                        </div>
                                        <span className="text-2xl font-bold text-purple-400">$49.99</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-8 h-12 rounded-full border-2 border-purple-500/50 flex items-start justify-center p-2">
                        <div className="w-1.5 h-3 bg-purple-500 rounded-full animate-pulse" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 lg:py-32 relative" data-testid="features-section">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-block px-4 py-2 rounded-full glass-light text-cyan-400 text-sm font-medium mb-4"
                        >
                            Why Choose LUMINA
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
                        >
                            Everything You Need to{" "}
                            <span className="gradient-text">Succeed</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-400 text-lg max-w-2xl mx-auto"
                        >
                            Our platform provides all the tools and resources you need to learn, grow, and earn.
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: BookOpen,
                                title: "Premium Courses",
                                description: "Access high-quality courses created by industry experts with lifetime access.",
                                color: "from-purple-600 to-purple-400"
                            },
                            {
                                icon: Award,
                                title: "Certificates",
                                description: "Earn verified certificates upon course completion to showcase your skills.",
                                color: "from-cyan-500 to-cyan-400"
                            },
                            {
                                icon: Users,
                                title: "Community",
                                description: "Connect with fellow learners and instructors through our chat system.",
                                color: "from-pink-600 to-pink-400"
                            },
                            {
                                icon: Zap,
                                title: "Interactive Quizzes",
                                description: "Test your knowledge with quizzes and track your progress in real-time.",
                                color: "from-yellow-500 to-orange-400"
                            },
                            {
                                icon: Star,
                                title: "Earn While You Learn",
                                description: "Earn 20% commission for every referral through our affiliate program.",
                                color: "from-green-500 to-emerald-400"
                            },
                            {
                                icon: Play,
                                title: "Video Lessons",
                                description: "Learn at your own pace with HD video lessons and downloadable resources.",
                                color: "from-blue-600 to-blue-400"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="card-feature group"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="font-outfit text-xl font-semibold text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Courses Section */}
            <section className="py-24 lg:py-32 bg-slate-900/50" data-testid="courses-section">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
                        <div>
                            <h2 className="font-outfit text-3xl sm:text-4xl font-bold text-white mb-2">
                                Featured Courses
                            </h2>
                            <p className="text-slate-400">Explore our most popular courses</p>
                        </div>
                        <Link to="/courses">
                            <Button className="btn-secondary">
                                View All Courses
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link to={`/courses/${course.id}`} className="block card-course course-card-glow group">
                                    <div className="relative aspect-video overflow-hidden">
                                        <img
                                            src={course.thumbnail_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                        <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                                            {course.category}
                                        </span>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-outfit text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                                            {course.short_description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span className="text-white font-medium text-sm">
                                                    {course.average_rating?.toFixed(1) || "New"}
                                                </span>
                                                <span className="text-slate-500 text-sm">
                                                    ({course.review_count || 0})
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                {course.discount_price ? (
                                                    <>
                                                        <span className="text-slate-500 line-through text-sm mr-2">
                                                            ${course.price}
                                                        </span>
                                                        <span className="text-xl font-bold text-purple-400">
                                                            ${course.discount_price}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xl font-bold text-purple-400">
                                                        ${course.price}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Affiliate Section */}
            <section className="py-24 lg:py-32 relative overflow-hidden" id="pricing" data-testid="affiliate-section">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-cyan-900/20" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="inline-block px-4 py-2 rounded-full glass-light text-pink-400 text-sm font-medium mb-4">
                                Affiliate Program
                            </span>
                            <h2 className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                                Earn While You{" "}
                                <span className="gradient-text">Learn</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-8">
                                Join our affiliate program and earn 20% commission on every successful referral. Share your unique link and start earning passive income today.
                            </p>

                            <ul className="space-y-4 mb-8">
                                {[
                                    "20% commission on every sale",
                                    "Unique referral link",
                                    "Real-time tracking dashboard",
                                    "Monthly payouts",
                                    "No minimum threshold"
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-green-400" />
                                        </div>
                                        <span className="text-slate-300">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link to="/register">
                                <Button className="btn-primary text-lg py-4 px-8">
                                    Start Earning Now
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="glass-heavy rounded-3xl p-8 neon-border-cyan">
                                <div className="text-center mb-8">
                                    <p className="text-slate-400 mb-2">Potential Monthly Earnings</p>
                                    <p className="font-outfit text-5xl font-bold gradient-text">$2,000+</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="glass-light rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-400">10 Referrals</span>
                                            <span className="text-white font-semibold">$200/month</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full w-1/4 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full" />
                                        </div>
                                    </div>

                                    <div className="glass-light rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-400">50 Referrals</span>
                                            <span className="text-white font-semibold">$1,000/month</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full w-1/2 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full" />
                                        </div>
                                    </div>

                                    <div className="glass-light rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-400">100 Referrals</span>
                                            <span className="text-white font-semibold">$2,000/month</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full w-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 lg:py-32 bg-slate-900/50" id="faq" data-testid="faq-section">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="font-outfit text-3xl sm:text-4xl font-bold text-white mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-slate-400">
                            Got questions? We've got answers.
                        </p>
                    </div>

                    <Accordion type="single" collapsible className="space-y-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={faq.id}
                                value={faq.id}
                                className="glass-medium rounded-xl border-none overflow-hidden"
                            >
                                <AccordionTrigger className="px-6 py-4 text-left text-white hover:text-purple-400 hover:no-underline">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4 text-slate-400">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 lg:py-32 relative overflow-hidden" data-testid="cta-section">
                <div className="absolute inset-0 bg-mesh" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-3xl" />
                
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Ready to Start Your{" "}
                            <span className="gradient-text">Learning Journey</span>?
                        </h2>
                        <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
                            Join thousands of students who are already mastering new skills and building their careers with LUMINA.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button className="btn-primary text-lg py-4 px-8 w-full sm:w-auto" data-testid="cta-signup-btn">
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link to="/courses">
                                <Button className="btn-secondary text-lg py-4 px-8 w-full sm:w-auto">
                                    Browse Courses
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
