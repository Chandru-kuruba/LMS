import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Users, Award, BookOpen, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AboutPage() {
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await axios.get(`${API}/public/cms/about`);
            setContent(response.data.content || {});
        } catch (error) {
            setContent({});
        } finally {
            setIsLoading(false);
        }
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
            {/* Hero */}
            <div className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="font-outfit text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {content.title || "About LUMINA"}
                    </h1>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                        {content.description || "We're on a mission to democratize education and make high-quality learning accessible to everyone, everywhere."}
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
                >
                    {[
                        { icon: Users, value: "10,000+", label: "Students" },
                        { icon: BookOpen, value: "100+", label: "Courses" },
                        { icon: Award, value: "50+", label: "Instructors" },
                        { icon: Globe, value: "50+", label: "Countries" }
                    ].map((stat, index) => (
                        <div key={index} className="glass-medium rounded-xl p-6 text-center">
                            <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                            <p className="font-outfit text-3xl font-bold text-white">{stat.value}</p>
                            <p className="text-slate-400">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Mission & Vision */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-heavy rounded-2xl p-8 neon-border-cyan"
                    >
                        <h2 className="font-outfit text-2xl font-bold text-white mb-4">Our Mission</h2>
                        <p className="text-slate-300 leading-relaxed">
                            {content.mission || "To empower individuals worldwide with the skills and knowledge they need to succeed in the digital age. We believe that education should be accessible, engaging, and transformative."}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-heavy rounded-2xl p-8 neon-border-purple"
                    >
                        <h2 className="font-outfit text-2xl font-bold text-white mb-4">Our Vision</h2>
                        <p className="text-slate-300 leading-relaxed">
                            {content.vision || "To be the world's leading platform for skill development, where anyone can learn from the best instructors and build a successful career in their chosen field."}
                        </p>
                    </motion.div>
                </div>

                {/* Values */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                >
                    <h2 className="font-outfit text-3xl font-bold text-white mb-8">Our Values</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: "Excellence", description: "We strive for the highest quality in everything we do" },
                            { title: "Innovation", description: "We continuously improve and embrace new technologies" },
                            { title: "Community", description: "We build a supportive learning environment for all" }
                        ].map((value, index) => (
                            <div key={index} className="glass-medium rounded-xl p-6">
                                <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                                <p className="text-slate-400">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
