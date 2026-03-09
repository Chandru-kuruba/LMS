import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Users, Award, BookOpen, Globe, Building, MapPin, Mail, Phone, Code, Cloud, Palette, Smartphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Logo URLs
const MSME_LOGO = "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/pmw7was4_msme.png";
const ISO_LOGO = "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/yn7tm6lm_iso.png";

const defaultContent = {
    title: "About Chand Web Technology Private Limited",
    description: "Chand Web Technology Private Limited is a Bengaluru-based IT services company incorporated on April 24, 2025. It is classified as an active, unlisted private company registered with the Registrar of Companies (RoC-Bangalore).",
    mission: "Empowering businesses and learners worldwide with modern digital transformation and custom development using advanced technology stacks.",
    vision: "To be the leading platform for professional skill development and digital transformation services.",
    corporate_info: {
        cin: "U62012KA2025PTC201894",
        authorized_capital: "₹1,00,000",
        paid_up_capital: "₹10,000"
    },
    address: "No. 8 Ground Floor, 6th Cross, Ayyappanagar, Krishnarajapuram, Bangalore, Karnataka – 560036",
    directors: [
        { name: "Hanumantha Uma", title: "Director" },
        { name: "Chandru Hanumantha", title: "Director" }
    ],
    services: [
        { icon: "Smartphone", title: "Web & Mobile Applications", description: "Cross-platform applications, custom websites using React, Next.js, Node.js, React Native" },
        { icon: "Code", title: "Custom Software Development", description: "FinTech dashboards, Healthcare applications, E-learning platforms, Retail POS systems" },
        { icon: "Cloud", title: "Cloud & Modernization", description: "Cloud-native architecture (AWS, Azure, Docker), Legacy application migration" },
        { icon: "Palette", title: "UI/UX Design", description: "UI design, UX research, Prototyping services" }
    ]
};

export default function AboutPage() {
    const [content, setContent] = useState(defaultContent);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await axios.get(`${API}/public/cms/about`);
            if (response.data.content) {
                setContent({ ...defaultContent, ...response.data.content });
            }
        } catch (error) {
            console.log("Using default about content");
        } finally {
            setIsLoading(false);
        }
    };

    const getServiceIcon = (iconName) => {
        const icons = { Smartphone, Code, Cloud, Palette };
        return icons[iconName] || Code;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 pt-24 pb-16 px-4">
                <div className="max-w-6xl mx-auto space-y-8">
                    <Skeleton className="h-16 w-1/2 mx-auto" />
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                    <div className="grid md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-16" data-testid="about-page">
            <div className="max-w-6xl mx-auto px-4">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="font-outfit text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {content.title}
                    </h1>
                    <p className="text-lg text-slate-300 max-w-4xl mx-auto leading-relaxed">
                        {content.description}
                    </p>
                </motion.div>

                {/* Corporate Information */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-heavy rounded-2xl p-8 mb-12 neon-border-purple"
                >
                    <h2 className="font-outfit text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <Building className="w-6 h-6 text-purple-400" />
                        Corporate Information
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="glass-light rounded-xl p-4">
                            <p className="text-slate-500 text-sm mb-1">CIN</p>
                            <p className="text-white font-mono text-sm">{content.corporate_info?.cin}</p>
                        </div>
                        <div className="glass-light rounded-xl p-4">
                            <p className="text-slate-500 text-sm mb-1">Authorized Capital</p>
                            <p className="text-white font-semibold">{content.corporate_info?.authorized_capital}</p>
                        </div>
                        <div className="glass-light rounded-xl p-4">
                            <p className="text-slate-500 text-sm mb-1">Paid-up Capital</p>
                            <p className="text-white font-semibold">{content.corporate_info?.paid_up_capital}</p>
                        </div>
                    </div>

                    <div className="mt-6 glass-light rounded-xl p-4">
                        <p className="text-slate-500 text-sm mb-1 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Registered Office
                        </p>
                        <p className="text-white">{content.address}</p>
                    </div>
                </motion.div>

                {/* Directors */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                >
                    <h2 className="font-outfit text-2xl font-bold text-white mb-6 text-center">Directors</h2>
                    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {content.directors?.map((director, index) => (
                            <div key={index} className="glass-medium rounded-xl p-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-white">
                                        {director.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-white">{director.name}</h3>
                                <p className="text-purple-400">{director.title}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Mission & Vision */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-heavy rounded-2xl p-8 neon-border-cyan"
                    >
                        <h2 className="font-outfit text-2xl font-bold text-white mb-4">Our Mission</h2>
                        <p className="text-slate-300 leading-relaxed">{content.mission}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-heavy rounded-2xl p-8 neon-border-purple"
                    >
                        <h2 className="font-outfit text-2xl font-bold text-white mb-4">Our Vision</h2>
                        <p className="text-slate-300 leading-relaxed">{content.vision}</p>
                    </motion.div>
                </div>

                {/* Services */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-12"
                >
                    <h2 className="font-outfit text-2xl font-bold text-white mb-8 text-center">Services & Specialized Expertise</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {content.services?.map((service, index) => {
                            const IconComponent = getServiceIcon(service.icon);
                            return (
                                <div key={index} className="glass-medium rounded-xl p-6 hover:scale-105 transition-transform">
                                    <IconComponent className="w-10 h-10 text-purple-400 mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">{service.title}</h3>
                                    <p className="text-slate-400 text-sm">{service.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Certifications */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-medium rounded-2xl p-8 text-center"
                >
                    <h2 className="font-outfit text-2xl font-bold text-white mb-6">Certifications & Registrations</h2>
                    <div className="flex justify-center items-center gap-8 flex-wrap">
                        <div className="text-center">
                            <img src={MSME_LOGO} alt="MSME Registered" className="h-16 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">MSME Registered</p>
                        </div>
                        <div className="text-center">
                            <img src={ISO_LOGO} alt="ISO 9001:2015" className="h-16 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">ISO 9001:2015 Certified</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
