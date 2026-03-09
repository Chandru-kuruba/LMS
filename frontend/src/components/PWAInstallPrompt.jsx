import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Check if user dismissed before
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) return; // Don't show for 7 days after dismissal
        }

        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after a delay
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('PWA installed');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
        setShowPrompt(false);
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
                >
                    <div className="glass-heavy rounded-2xl p-4 border border-purple-500/30 shadow-xl shadow-purple-500/10">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                <Smartphone className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white mb-1">
                                    Install LUMINA App
                                </h3>
                                <p className="text-sm text-slate-400 mb-3">
                                    Get quick access & offline support. Learn anywhere, anytime!
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="btn-primary"
                                        onClick={handleInstall}
                                    >
                                        <Download className="w-4 h-4 mr-1" />
                                        Install
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-slate-400"
                                        onClick={handleDismiss}
                                    >
                                        Not now
                                    </Button>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default PWAInstallPrompt;
