import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    FileText,
    Save,
    Plus,
    Trash2,
    Home,
    Info,
    Phone,
    HelpCircle,
    Menu,
    Layout,
    Star,
    Tag,
    Search,
    Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultSections = {
    home: {
        hero: {
            title: "Master New Skills with",
            brand: "Chand Web Technology",
            subtitle: "Join thousands of students learning from industry experts. Get access to premium courses and earn while you learn through our affiliate program.",
            badge: "#1 Online Learning Platform",
            cta_primary: "Browse Courses",
            cta_secondary: "Get Started Free",
            background_image: ""
        },
        stats: {
            students: "50K+",
            courses: "200+",
            instructors: "50+"
        },
        features: {
            title: "Why Choose Us",
            subtitle: "Experience the best in online learning",
            items: [
                { icon: "Award", title: "Certified Courses", description: "Get industry-recognized certificates" },
                { icon: "Users", title: "Expert Instructors", description: "Learn from the best in the field" },
                { icon: "DollarSign", title: "Affiliate Program", description: "Earn 20% commission on referrals" },
                { icon: "Clock", title: "Lifetime Access", description: "Access courses anytime, anywhere" }
            ]
        },
        affiliate: {
            title: "Earn While You Learn",
            subtitle: "Join our affiliate program and earn 20% commission on every successful referral. Lifetime earnings!",
            cta: "Start Earning Now"
        }
    },
    about: {
        title: "About Us",
        description: "Chand Web Technology is an MSME registered and ISO 9001:2015 certified company dedicated to providing quality online education.",
        mission: "Empowering learners worldwide with accessible, high-quality education.",
        vision: "To be the leading platform for professional skill development.",
        founder: {
            name: "Chandru H",
            title: "Founder & Director",
            bio: "Passionate about education and technology"
        }
    },
    contact: {
        title: "Contact Us",
        description: "We'd love to hear from you",
        email: "support@chandwebtechnology.com",
        phone: "+91 1234567890",
        address: "India",
        form_enabled: true
    },
    footer: {
        company: {
            name: "Chand Web Technology",
            description: "Empowering learners worldwide with quality education",
            logo: "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/8733xudx_Untitled_design-removebg-preview.png"
        },
        certifications: [
            { name: "MSME", logo: "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/pmw7was4_msme.png" },
            { name: "ISO 9001:2015", logo: "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/yn7tm6lm_iso.png" }
        ],
        copyright: "© 2026 Chand Web Technology. All rights reserved.",
        social: {
            twitter: "",
            facebook: "",
            instagram: "",
            linkedin: ""
        }
    },
    navbar: {
        logo: {
            text: "Chand Web Technology",
            image: "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/8733xudx_Untitled_design-removebg-preview.png"
        },
        links: [
            { text: "Courses", url: "/courses" },
            { text: "Pricing", url: "/#pricing" },
            { text: "FAQ", url: "/#faq" },
            { text: "Contact", url: "/page/contact" }
        ],
        cta: { text: "Get Started", url: "/register" }
    },
    testimonials: [
        {
            name: "John Doe",
            role: "Software Developer",
            content: "Amazing courses! Helped me land my dream job.",
            avatar: "",
            rating: 5
        }
    ],
    pricing: {
        title: "Choose Your Plan",
        subtitle: "Flexible pricing for every learner",
        plans: []
    }
};

export default function AdminCMSPage() {
    const { accessToken } = useAuthStore();
    const [activeTab, setActiveTab] = useState("home");
    const [cmsData, setCmsData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState({});
    const [faqs, setFaqs] = useState([]);
    const [newFaq, setNewFaq] = useState({ question: "", answer: "" });

    useEffect(() => {
        fetchAllCMS();
        fetchFAQs();
    }, [accessToken]);

    const fetchAllCMS = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API}/admin/cms`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const sections = response.data.sections || [];
            const data = {};
            sections.forEach(s => {
                data[s.slug] = s.content;
            });
            // Merge with defaults
            Object.keys(defaultSections).forEach(key => {
                if (!data[key]) {
                    data[key] = defaultSections[key];
                }
            });
            setCmsData(data);
        } catch (error) {
            console.error("Failed to fetch CMS:", error);
            setCmsData(defaultSections);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFAQs = async () => {
        try {
            const response = await axios.get(`${API}/faqs`);
            setFaqs(response.data.faqs || []);
        } catch (error) {
            console.error("Failed to fetch FAQs:", error);
        }
    };

    const saveCMSSection = async (slug) => {
        setIsSaving({ ...isSaving, [slug]: true });
        try {
            await axios.put(
                `${API}/admin/cms/${slug}`,
                {
                    title: slug.charAt(0).toUpperCase() + slug.slice(1),
                    content: cmsData[slug],
                    seo: {}
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success(`${slug} section saved!`);
        } catch (error) {
            toast.error(`Failed to save ${slug}`);
        } finally {
            setIsSaving({ ...isSaving, [slug]: false });
        }
    };

    const updateField = (section, path, value) => {
        setCmsData(prev => {
            const newData = { ...prev };
            const keys = path.split(".");
            let current = newData[section];
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };

    const handleAddFaq = async () => {
        if (!newFaq.question || !newFaq.answer) {
            toast.error("Please fill in both fields");
            return;
        }
        try {
            await axios.post(
                `${API}/admin/faqs`,
                null,
                {
                    params: { question: newFaq.question, answer: newFaq.answer, order: faqs.length },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            toast.success("FAQ added!");
            setNewFaq({ question: "", answer: "" });
            fetchFAQs();
        } catch (error) {
            toast.error("Failed to add FAQ");
        }
    };

    const handleDeleteFaq = async (faqId) => {
        try {
            await axios.delete(`${API}/admin/faqs/${faqId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("FAQ deleted");
            fetchFAQs();
        } catch (error) {
            toast.error("Failed to delete FAQ");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="admin-cms-page">
            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">CMS Management</h1>
                <p className="text-slate-400">Control all website content dynamically</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="glass-light flex-wrap h-auto p-1">
                    <TabsTrigger value="home" className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Home
                    </TabsTrigger>
                    <TabsTrigger value="about" className="flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        About
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Contact
                    </TabsTrigger>
                    <TabsTrigger value="faq" className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        FAQ
                    </TabsTrigger>
                    <TabsTrigger value="navbar" className="flex items-center gap-2">
                        <Menu className="w-4 h-4" />
                        Navbar
                    </TabsTrigger>
                    <TabsTrigger value="footer" className="flex items-center gap-2">
                        <Layout className="w-4 h-4" />
                        Footer
                    </TabsTrigger>
                    <TabsTrigger value="testimonials" className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Testimonials
                    </TabsTrigger>
                </TabsList>

                {/* Home Section */}
                <TabsContent value="home">
                    <div className="glass-heavy rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-semibold text-white text-lg">Home Page - Hero Section</h2>
                            <Button
                                className="btn-primary"
                                onClick={() => saveCMSSection("home")}
                                disabled={isSaving.home}
                            >
                                {isSaving.home ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save</>}
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Hero Title</Label>
                                <Input
                                    placeholder="Main headline"
                                    value={cmsData.home?.hero?.title || ""}
                                    onChange={(e) => updateField("home", "hero.title", e.target.value)}
                                    className="input-neon"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Hero Subtitle</Label>
                                <Textarea
                                    placeholder="Supporting text"
                                    value={cmsData.home?.hero?.subtitle || ""}
                                    onChange={(e) => updateField("home", "hero.subtitle", e.target.value)}
                                    className="input-neon"
                                />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">CTA Button Text</Label>
                                    <Input
                                        placeholder="Get Started"
                                        value={cmsData.home?.hero?.cta_text || ""}
                                        onChange={(e) => updateField("home", "hero.cta_text", e.target.value)}
                                        className="input-neon"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">CTA Link</Label>
                                    <Input
                                        placeholder="/courses"
                                        value={cmsData.home?.hero?.cta_link || ""}
                                        onChange={(e) => updateField("home", "hero.cta_link", e.target.value)}
                                        className="input-neon"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Hero Image URL</Label>
                                <Input
                                    placeholder="https://..."
                                    value={cmsData.home?.hero?.image_url || ""}
                                    onChange={(e) => updateField("home", "hero.image_url", e.target.value)}
                                    className="input-neon"
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* About Section */}
                <TabsContent value="about">
                    <div className="glass-heavy rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-semibold text-white text-lg">About Page</h2>
                            <Button
                                className="btn-primary"
                                onClick={() => saveCMSSection("about")}
                                disabled={isSaving.about}
                            >
                                {isSaving.about ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save</>}
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Page Title</Label>
                                <Input
                                    placeholder="About Us"
                                    value={cmsData.about?.title || ""}
                                    onChange={(e) => updateField("about", "title", e.target.value)}
                                    className="input-neon"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Description</Label>
                                <Textarea
                                    placeholder="About your company..."
                                    value={cmsData.about?.description || ""}
                                    onChange={(e) => updateField("about", "description", e.target.value)}
                                    className="input-neon min-h-[100px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Mission</Label>
                                <Textarea
                                    placeholder="Your mission statement..."
                                    value={cmsData.about?.mission || ""}
                                    onChange={(e) => updateField("about", "mission", e.target.value)}
                                    className="input-neon"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Vision</Label>
                                <Textarea
                                    placeholder="Your vision..."
                                    value={cmsData.about?.vision || ""}
                                    onChange={(e) => updateField("about", "vision", e.target.value)}
                                    className="input-neon"
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Contact Section */}
                <TabsContent value="contact">
                    <div className="glass-heavy rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-semibold text-white text-lg">Contact Page</h2>
                            <Button
                                className="btn-primary"
                                onClick={() => saveCMSSection("contact")}
                                disabled={isSaving.contact}
                            >
                                {isSaving.contact ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save</>}
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Page Title</Label>
                                <Input
                                    placeholder="Contact Us"
                                    value={cmsData.contact?.title || ""}
                                    onChange={(e) => updateField("contact", "title", e.target.value)}
                                    className="input-neon"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Description</Label>
                                <Textarea
                                    placeholder="Contact page description..."
                                    value={cmsData.contact?.description || ""}
                                    onChange={(e) => updateField("contact", "description", e.target.value)}
                                    className="input-neon"
                                />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Email</Label>
                                    <Input
                                        placeholder="support@example.com"
                                        value={cmsData.contact?.email || ""}
                                        onChange={(e) => updateField("contact", "email", e.target.value)}
                                        className="input-neon"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Phone</Label>
                                    <Input
                                        placeholder="+1 234 567 890"
                                        value={cmsData.contact?.phone || ""}
                                        onChange={(e) => updateField("contact", "phone", e.target.value)}
                                        className="input-neon"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Address</Label>
                                <Textarea
                                    placeholder="123 Street, City, Country"
                                    value={cmsData.contact?.address || ""}
                                    onChange={(e) => updateField("contact", "address", e.target.value)}
                                    className="input-neon"
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* FAQ Section */}
                <TabsContent value="faq">
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="glass-heavy rounded-xl p-6">
                            <h2 className="font-semibold text-white mb-4">Add New FAQ</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Question</Label>
                                    <Input
                                        placeholder="Enter question"
                                        value={newFaq.question}
                                        onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                                        className="input-neon"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Answer</Label>
                                    <Textarea
                                        placeholder="Enter answer"
                                        value={newFaq.answer}
                                        onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                                        className="input-neon min-h-[100px]"
                                    />
                                </div>
                                <Button className="w-full btn-primary" onClick={handleAddFaq}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add FAQ
                                </Button>
                            </div>
                        </div>

                        <div className="glass-heavy rounded-xl p-6">
                            <h2 className="font-semibold text-white mb-4">Current FAQs ({faqs.length})</h2>
                            {faqs.length === 0 ? (
                                <div className="text-center py-8">
                                    <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">No FAQs yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {faqs.map((faq) => (
                                        <motion.div
                                            key={faq.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="glass-light rounded-lg p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <p className="font-medium text-white mb-1">{faq.question}</p>
                                                    <p className="text-sm text-slate-400 line-clamp-2">{faq.answer}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-400 hover:text-red-300 flex-shrink-0"
                                                    onClick={() => handleDeleteFaq(faq.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Navbar Section */}
                <TabsContent value="navbar">
                    <div className="glass-heavy rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-semibold text-white text-lg">Navigation Bar</h2>
                            <Button
                                className="btn-primary"
                                onClick={() => saveCMSSection("navbar")}
                                disabled={isSaving.navbar}
                            >
                                {isSaving.navbar ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save</>}
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Logo Text</Label>
                                    <Input
                                        placeholder="LUMINA"
                                        value={cmsData.navbar?.logo_text || ""}
                                        onChange={(e) => updateField("navbar", "logo_text", e.target.value)}
                                        className="input-neon"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Logo Image URL</Label>
                                    <Input
                                        placeholder="https://..."
                                        value={cmsData.navbar?.logo_url || ""}
                                        onChange={(e) => updateField("navbar", "logo_url", e.target.value)}
                                        className="input-neon"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Footer Section */}
                <TabsContent value="footer">
                    <div className="glass-heavy rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-semibold text-white text-lg">Footer</h2>
                            <Button
                                className="btn-primary"
                                onClick={() => saveCMSSection("footer")}
                                disabled={isSaving.footer}
                            >
                                {isSaving.footer ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save</>}
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Copyright Text</Label>
                                <Input
                                    placeholder="© 2024 Your Company"
                                    value={cmsData.footer?.copyright || ""}
                                    onChange={(e) => updateField("footer", "copyright", e.target.value)}
                                    className="input-neon"
                                />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Twitter URL</Label>
                                    <Input
                                        placeholder="https://twitter.com/..."
                                        value={cmsData.footer?.social?.twitter || ""}
                                        onChange={(e) => updateField("footer", "social.twitter", e.target.value)}
                                        className="input-neon"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Facebook URL</Label>
                                    <Input
                                        placeholder="https://facebook.com/..."
                                        value={cmsData.footer?.social?.facebook || ""}
                                        onChange={(e) => updateField("footer", "social.facebook", e.target.value)}
                                        className="input-neon"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Instagram URL</Label>
                                    <Input
                                        placeholder="https://instagram.com/..."
                                        value={cmsData.footer?.social?.instagram || ""}
                                        onChange={(e) => updateField("footer", "social.instagram", e.target.value)}
                                        className="input-neon"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">LinkedIn URL</Label>
                                    <Input
                                        placeholder="https://linkedin.com/..."
                                        value={cmsData.footer?.social?.linkedin || ""}
                                        onChange={(e) => updateField("footer", "social.linkedin", e.target.value)}
                                        className="input-neon"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Testimonials Section */}
                <TabsContent value="testimonials">
                    <div className="glass-heavy rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-semibold text-white text-lg">Testimonials</h2>
                            <Button
                                className="btn-primary"
                                onClick={() => saveCMSSection("testimonials")}
                                disabled={isSaving.testimonials}
                            >
                                {isSaving.testimonials ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save</>}
                            </Button>
                        </div>
                        <p className="text-slate-400 mb-4">
                            Testimonials are managed dynamically. Current testimonials are displayed on the homepage.
                        </p>
                        {Array.isArray(cmsData.testimonials) && cmsData.testimonials.length > 0 ? (
                            <div className="space-y-3">
                                {cmsData.testimonials.map((t, idx) => (
                                    <div key={idx} className="glass-light rounded-lg p-4">
                                        <p className="font-medium text-white">{t.name}</p>
                                        <p className="text-sm text-slate-400">{t.role}</p>
                                        <p className="text-slate-300 mt-2">{t.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500">No testimonials added yet.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
