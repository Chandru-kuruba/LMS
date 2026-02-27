import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DynamicPage() {
    const { slug } = useParams();
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchContent();
    }, [slug]);

    const fetchContent = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API}/public/cms/${slug}`);
            setContent(response.data);
            setError(null);
        } catch (err) {
            setError("Page not found");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 pt-24 pb-16 px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 pt-24 pb-16 px-4 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="font-outfit text-4xl font-bold text-white mb-4">404</h1>
                    <p className="text-slate-400">Page not found</p>
                </div>
            </div>
        );
    }

    const pageContent = content?.content || {};
    const seo = content?.seo || {};

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-16">
            {/* SEO */}
            {seo.metaTitle && <title>{seo.metaTitle}</title>}
            
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert prose-lg max-w-none"
                >
                    {/* Title */}
                    {pageContent.title && (
                        <h1 className="font-outfit text-4xl md:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            {pageContent.title}
                        </h1>
                    )}

                    {/* Description */}
                    {pageContent.description && (
                        <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                            {pageContent.description}
                        </p>
                    )}

                    {/* Mission */}
                    {pageContent.mission && (
                        <div className="glass-medium rounded-xl p-6 mb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                            <p className="text-slate-300">{pageContent.mission}</p>
                        </div>
                    )}

                    {/* Vision */}
                    {pageContent.vision && (
                        <div className="glass-medium rounded-xl p-6 mb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
                            <p className="text-slate-300">{pageContent.vision}</p>
                        </div>
                    )}

                    {/* Generic Content Sections */}
                    {pageContent.sections && pageContent.sections.map((section, index) => (
                        <div key={index} className="mb-8">
                            {section.title && (
                                <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                            )}
                            {section.content && (
                                <div className="text-slate-300 whitespace-pre-wrap">{section.content}</div>
                            )}
                        </div>
                    ))}

                    {/* Contact Info */}
                    {pageContent.email && (
                        <div className="glass-heavy rounded-xl p-6 mt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
                            <div className="space-y-2 text-slate-300">
                                {pageContent.email && <p>Email: <a href={`mailto:${pageContent.email}`} className="text-purple-400">{pageContent.email}</a></p>}
                                {pageContent.phone && <p>Phone: {pageContent.phone}</p>}
                                {pageContent.address && <p>Address: {pageContent.address}</p>}
                            </div>
                        </div>
                    )}

                    {/* Last Updated */}
                    {content?.updated_at && (
                        <p className="text-sm text-slate-500 mt-8">
                            Last updated: {new Date(content.updated_at).toLocaleDateString()}
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
