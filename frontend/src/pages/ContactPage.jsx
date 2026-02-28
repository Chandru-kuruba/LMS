import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultContact = {
    title: "Contact Us",
    description: "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
    email: "info@chandwebtechnology.com",
    secondary_email: "chanduh345@gmail.com",
    phone: "+91 72043 43968",
    website: "chandwebtechnology.com",
    address: "No. 8 Ground Floor, 6th Cross, Ayyappanagar, Krishnarajapuram, Bangalore, Karnataka – 560036"
};

export default function ContactPage() {
    const [content, setContent] = useState(defaultContact);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await axios.get(`${API}/public/cms/contact`);
            if (response.data.content) {
                setContent({ ...defaultContact, ...response.data.content });
            }
        } catch (error) {
            console.log("Using default contact content");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        // In a real app, this would send the message to a backend endpoint
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("Message sent! We'll get back to you soon.");
        setFormData({ name: "", email: "", subject: "", message: "" });
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 pt-24 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-12 w-64 mx-auto mb-8" />
                    <div className="grid md:grid-cols-2 gap-8">
                        <Skeleton className="h-96 rounded-xl" />
                        <Skeleton className="h-96 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-16" data-testid="contact-page">
            <div className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="font-outfit text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {content.title || "Contact Us"}
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        {content.description || "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="glass-heavy rounded-2xl p-8">
                            <h2 className="font-outfit text-2xl font-bold text-white mb-6">Get in Touch</h2>
                            
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">Email</h3>
                                        <a href={`mailto:${content.email}`} className="text-slate-400 hover:text-purple-400 transition-colors block">
                                            {content.email}
                                        </a>
                                        {content.secondary_email && (
                                            <a href={`mailto:${content.secondary_email}`} className="text-slate-400 hover:text-purple-400 transition-colors block text-sm">
                                                {content.secondary_email}
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-cyan-600/20 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">Phone</h3>
                                        <a href={`tel:${content.phone}`} className="text-slate-400 hover:text-cyan-400 transition-colors">
                                            {content.phone}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-pink-600/20 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-6 h-6 text-pink-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">Address</h3>
                                        <p className="text-slate-400">{content.address}</p>
                                    </div>
                                </div>

                                {content.website && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center flex-shrink-0">
                                            <MessageCircle className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white mb-1">Website</h3>
                                            <a href={`https://${content.website}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-green-400 transition-colors">
                                                {content.website}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Response Time */}
                        <div className="glass-medium rounded-xl p-6 text-center">
                            <p className="text-slate-400">
                                Average response time: <span className="text-white font-semibold">2-4 hours</span>
                            </p>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <form onSubmit={handleSubmit} className="glass-heavy rounded-2xl p-8">
                            <h2 className="font-outfit text-2xl font-bold text-white mb-6">Send a Message</h2>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Name *</Label>
                                    <Input
                                        placeholder="Your name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-neon"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Email *</Label>
                                    <Input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-neon"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Subject</Label>
                                    <Input
                                        placeholder="What is this about?"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="input-neon"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Message *</Label>
                                    <Textarea
                                        placeholder="Your message..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="input-neon min-h-[150px]"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        "Sending..."
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
