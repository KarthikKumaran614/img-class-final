import React, { useState, useEffect, useRef } from 'react';
import { InteractiveHoverButton } from './components/ui/interactive-hover-button';
import { AnimatedTestimonials } from './components/ui/animated-testimonials';
import { EvervaultCard } from './components/ui/evervault-card';
import Orb from './components/Orb';
import Dock from './components/Dock';
import {
    Plus,
    Search,
    RotateCcw,
    Info,
    Image as ImageIcon,
    Box,
    Layers,
    Activity,
    ArrowRight,
    Home,
    Archive,
    Settings
} from 'lucide-react';
import { cn } from './lib/utils';

const API_BASE_URL = 'http://localhost:5000/api';

interface Prediction {
    class: string;
    confidence: number;
}

interface ClassificationResult {
    predicted_class: string;
    confidence: number;
    top5: Prediction[];
    original_image: string;
    gradcam_image: string;
    model_used: string;
}

interface ComparisonResult {
    baseline: ClassificationResult | null;
    refined: ClassificationResult | null;
}

interface Sample {
    id: number;
    baseline?: string;
    refined?: string;
}

const App: React.FC = () => {
    const [view, setView] = useState<'landing' | 'app' | 'learn-more'>('landing');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<'baseline' | 'refined' | 'compare'>('baseline');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ClassificationResult | ComparisonResult | null>(null);
    const [serverStatus, setServerStatus] = useState({ status: 'connecting', text: 'Connecting...' });
    const [samples, setSamples] = useState<Sample[]>([]);
    const [showAbout, setShowAbout] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        checkServerHealth();
        loadSampleGallery();
        const interval = setInterval(checkServerHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkServerHealth = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            const data = await response.json();
            if (data.status === 'healthy') {
                setServerStatus({ status: 'connected', text: `Connected • ${data.model_type}` });
            } else {
                setServerStatus({ status: 'error', text: 'Server Error' });
            }
        } catch (error) {
            setServerStatus({ status: 'error', text: 'Server Offline' });
        }
    };

    const loadSampleGallery = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sample-results`);
            const data = await response.json();
            if (data.samples) setSamples(data.samples);
        } catch (error) {
            console.error('Failed to load gallery:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleClassify = async () => {
        if (!selectedFile) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', selectedFile);

            if (selectedModel === 'compare') {
                const response = await fetch(`${API_BASE_URL}/compare`, { method: 'POST', body: formData });
                setResult(await response.json());
            } else {
                formData.append('model', selectedModel);
                const response = await fetch(`${API_BASE_URL}/classify`, { method: 'POST', body: formData });
                setResult(await response.json());
            }
        } catch (error) {
            console.error('Classification error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Prepare testimonials from samples
    const testimonialItems = samples.map((s, i) => ({
        name: `Sample Result ${i + 1}`,
        designation: s.refined ? "Refined Model Visualization" : "Baseline Model Visualization",
        quote: "Experience the power of Grad-CAM. This heatmap shows the areas where our neural network focused to make its prediction.",
        src: s.refined || s.baseline || ""
    })).filter(t => t.src !== "");

    // Fallback testimonials if samples are empty
    const defaultTestimonials = [
        {
            quote: "The Grad-CAM visualizations are incredibly clear. I can finally see why my model misclassifies cats as dogs!",
            name: "Dr. Jane Smith",
            designation: "AI Researcher at Stanford",
            src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3540&auto=format&fit=crop",
        },
        {
            quote: "This intersection of explainability and classification is exactly what we need for safety-critical AI.",
            name: "Marcus Chen",
            designation: "CTO at SecureVision",
            src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=3540&auto=format&fit=crop",
        }
    ];

    const finalTestimonials = testimonialItems.length > 0 ? testimonialItems : defaultTestimonials;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <div className="bg-gradient" />
            {showGrid && <div className="bg-grid" />}

            {view === 'landing' ? (
                <div className="h-screen relative flex items-center justify-center overflow-hidden">
                    <Orb
                        className="absolute inset-0 w-full h-full"
                        hue={0}
                        hoverIntensity={0.5}
                        rotateOnHover={true}
                    />
                    <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <Activity className="w-4 h-4 text-primary" />
                            <span>CIFAR-10 XAI</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            SEE WHAT<br />AI SEES
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
                            Advanced image classification with Grad-CAM explainability.<br />
                            Visualize exactly where the model focuses its attention.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
                            <InteractiveHoverButton
                                text="Get Started"
                                className="w-48 h-12"
                                onClick={() => setView('app')}
                            />
                            <button
                                onClick={() => setView('learn-more')}
                                className="px-8 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-semibold flex items-center gap-2"
                            >
                                Learn More <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : view === 'learn-more' ? (
                <div className="min-h-screen relative flex flex-col justify-center px-4 py-20 animate-in fade-in duration-700">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

                    <div className="max-w-4xl mx-auto w-full space-y-12 relative z-10">
                        <button
                            onClick={() => setView('landing')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
                        </button>

                        <div className="space-y-6">
                            <h2 className="text-5xl md:text-7xl font-black tracking-tight tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                Decoding the Black Box
                            </h2>
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                                Traditional Neural Networks are opaque. Explainable AI (XAI) bridges the gap between raw accuracy and human understanding.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-card border rounded-[2rem] p-8 space-y-4 shadow-xl border-primary/10">
                                <Activity className="w-10 h-10 text-primary mb-6" />
                                <h3 className="text-2xl font-bold">The Problem</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    When an image classifier makes a mistake, developers usually just apply a generic sweep of data augmentation across the whole dataset and retrain. This "blind approach" is inefficient and can actually degrade the accuracy of sensitive classes like birds or frogs.
                                </p>
                            </div>

                            <div className="bg-card border rounded-[2rem] p-8 space-y-4 shadow-xl border-accent/10">
                                <Info className="w-10 h-10 text-accent mb-6" />
                                <h3 className="text-2xl font-bold">The Solution: Grad-CAM</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    By using Gradient-weighted Class Activation Mapping (Grad-CAM), we can peer inside the final convolutional layers of a ResNet-18 model. It acts as a visual heat map, telling us exactly which cluster of pixels the AI focused on to make its decision.
                                </p>
                            </div>

                            <div className="bg-card border rounded-[2rem] p-8 space-y-4 shadow-xl border-primary/10 md:col-span-2">
                                <Layers className="w-10 h-10 text-primary mb-6" />
                                <h3 className="text-2xl font-bold">Targeted Refinement Pipeline</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Instead of guessing, our architecture takes over 5,000 specific misclassified "attention-deficient" images, applies targeted transformations (like rotation and color jittering) strictly to those flawed samples, and explicitly retrains the baseline. The result is a model that actively learns from its own visual mistakes.
                                </p>
                            </div>
                        </div>

                        <div className="pt-8 flex justify-center">
                            <InteractiveHoverButton
                                text="Try It Now"
                                className="w-64 h-14 text-lg"
                                onClick={() => setView('app')}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="container mx-auto px-4 py-12 pb-32 space-y-24">
                    {/* Header */}
                    <header className="flex items-center justify-between animate-in fade-in duration-500">
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('landing')}>
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <Layers className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold tracking-tight">CIFAR-10 XAI</h2>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Explainable AI Classifier</p>
                            </div>
                        </div>
                        <div className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-full border bg-card/50 backdrop-blur-sm transition-all",
                            serverStatus.status === 'connected' ? "border-primary/20" : "border-destructive/20"
                        )}>
                            <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                serverStatus.status === 'connected' ? "bg-primary" : "bg-destructive"
                            )} />
                            <span className="text-sm font-medium text-muted-foreground">{serverStatus.text}</span>
                        </div>
                    </header>

                    {/* Hero Section */}
                    <section className="text-center space-y-6 max-w-3xl mx-auto relative pt-12">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary tracking-wide relative z-10">
                            <Box className="w-3 h-3" />
                            XAI Analysis Protocol
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tight text-foreground relative z-10">
                            See What <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">AI Sees</span>
                        </h2>
                        <div className="text-muted-foreground font-mono text-sm max-w-2xl mx-auto leading-relaxed border-l-2 border-primary/50 pl-4 text-left relative z-10">
                            <span className="text-primary font-bold">System Online.</span><br />
                            Upload an image to extract high-resolution attention heatmaps based on ResNet-18 classifications.
                        </div>
                    </section>

                    {/* Upload Section */}
                    <section id="upload-section" className="max-w-4xl mx-auto relative group mt-16 z-20">
                        {/* Decorative background blocks behind the section */}
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-[2.5rem] blur-xl opacity-50 -z-10 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="bg-card border rounded-[2rem] p-2 relative shadow-2xl overflow-hidden backdrop-blur-sm">
                            <div className="bg-background/80 rounded-[1.5rem] p-8 md:p-12 relative group/dropzone overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                                {/* Decorative Tech overlays */}
                                <div className="absolute top-6 left-6 text-primary/40 font-mono text-[10px] uppercase tracking-widest pointer-events-none">Module v1.2</div>
                                <div className="absolute bottom-6 right-6 text-muted-foreground/40 font-mono text-[10px] uppercase tracking-widest pointer-events-none">Status: <span className="text-primary/60">Ready</span></div>

                                <div className="space-y-12 relative z-10 transition-all text-center">
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} onClick={(e) => { e.currentTarget.value = ''; }} hidden accept="image/*" />
                                    {previewUrl ? (
                                        <div className="space-y-6 relative z-10">
                                            <div className="p-1.5 rounded-2xl bg-gradient-to-br from-primary/50 to-accent/50 inline-block shadow-lg group-hover/dropzone:shadow-primary/20 transition-all">
                                                <img src={previewUrl} alt="Preview" className="mx-auto max-h-64 object-contain rounded-xl bg-black" />
                                            </div>
                                            <div className="space-y-2 relative">
                                                <h3 className="font-bold text-xl text-foreground">Image Loaded</h3>
                                                <div className="flex justify-center items-center gap-3">
                                                    <span className="w-8 h-px bg-primary/30"></span>
                                                    <p className="text-sm text-muted-foreground truncate max-w-sm">{selectedFile?.name}</p>
                                                    <span className="w-8 h-px bg-primary/30"></span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 relative z-10 py-10">
                                            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                                                <div className="absolute inset-0 border-2 border-primary/20 rounded-2xl group-hover/dropzone:border-primary/50 group-hover/dropzone:rotate-12 transition-all duration-500"></div>
                                                <div className="absolute inset-2 border border-accent/20 rounded-xl group-hover/dropzone:border-accent/50 group-hover/dropzone:-rotate-12 transition-all duration-500 delay-75"></div>
                                                <Plus className="w-8 h-8 text-muted-foreground group-hover/dropzone:scale-110 transition-transform duration-300 relative z-10 group-hover/dropzone:text-primary" strokeWidth={2} />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold tracking-tight text-foreground">Upload Image</h3>
                                                <p className="text-sm font-medium text-muted-foreground">Click or drop file here</p>
                                            </div>
                                            <div className="flex items-center justify-center gap-3">
                                                {['PNG', 'JPG', 'WEBP'].map(f => (
                                                    <span key={f} className="text-[10px] tracking-wider font-mono bg-muted text-muted-foreground px-3 py-1 rounded-md uppercase font-semibold">{f}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-8 pt-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 w-full mt-10 p-6 md:p-8 border-t border-border">
                                    {(['baseline', 'refined', 'compare'] as const).map(m => (
                                        <label key={m} className="cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="model"
                                                checked={selectedModel === m}
                                                onChange={() => setSelectedModel(m)}
                                                className="sr-only"
                                            />
                                            <div className={cn(
                                                "border-2 rounded-2xl transition-all h-full bg-card relative overflow-hidden flex flex-col group",
                                                selectedModel === m ? "border-primary shadow-lg shadow-primary/10" : "border-transparent hover:border-primary/30 bg-muted/30"
                                            )}>
                                                {/* Card Background using Evervault effect */}
                                                <div className="absolute inset-x-0 top-0 h-40 overflow-hidden pointer-events-none opacity-30 group-hover:opacity-100 transition-opacity">
                                                    <EvervaultCard className="!aspect-auto h-full scale-150 origin-top opacity-70" text="" />
                                                </div>

                                                {/* Content Overlay */}
                                                <div className="p-6 pt-24 relative z-10 flex flex-col justify-end h-full mt-auto">
                                                    <div className="flex items-center gap-3 mb-3 w-fit bg-background/80 p-2 rounded-xl backdrop-blur border border-border/50 shadow-sm">
                                                        {m === 'baseline' && <Box className={cn("w-4 h-4", selectedModel === m ? "text-primary" : "text-muted-foreground")} />}
                                                        {m === 'refined' && <Layers className={cn("w-4 h-4", selectedModel === m ? "text-primary" : "text-muted-foreground")} />}
                                                        {m === 'compare' && <Activity className={cn("w-4 h-4", selectedModel === m ? "text-primary" : "text-muted-foreground")} />}
                                                        <span className="font-semibold capitalize tracking-wide text-sm">{m} Model</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed bg-background/80 p-3 rounded-xl backdrop-blur border border-border/50 shadow-sm">
                                                        {m === 'baseline' && "Original neural net without extra guidance."}
                                                        {m === 'refined' && "Fine-tuned net with attention-guided reinforcement."}
                                                        {m === 'compare' && "Run both models side-by-side to compare output."}
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 p-8 w-full justify-center border-t border-border">
                                    {selectedFile && (
                                        <button
                                            onClick={handleReset}
                                            className="px-6 py-3 rounded-xl bg-muted hover:bg-muted-hover border border-border transition-all font-semibold flex items-center justify-center gap-2 group text-muted-foreground hover:text-foreground"
                                        >
                                            <RotateCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform" />
                                            <span>Clear</span>
                                        </button>
                                    )}
                                    <button
                                        className={cn(
                                            "flex-1 sm:max-w-xs h-12 rounded-xl text-md font-bold transition-all border flex items-center justify-center gap-2 shadow-sm",
                                            !selectedFile || loading
                                                ? "bg-muted text-muted-foreground cursor-not-allowed border-transparent"
                                                : "bg-primary text-primary-foreground hover:opacity-90 hover:shadow-primary/25 hover:shadow-lg border-transparent"
                                        )}
                                        disabled={!selectedFile || loading}
                                        onClick={handleClassify}
                                    >
                                        {loading ? <><RotateCcw size={18} className="animate-spin" /> Processing...</> : 'Analyze Image'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Results Section */}
                    {result && (
                        <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                    <Search className="w-8 h-8 text-primary" />
                                    Classification Results
                                </h3>
                                <InteractiveHoverButton text="New Image" className="w-40" onClick={handleReset} />
                            </div>

                            {selectedModel === 'compare' ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                    {['baseline', 'refined'].map(m => {
                                        const r = (result as ComparisonResult)[m as keyof ComparisonResult];
                                        return r ? <ResultCard key={m} r={r} /> : <div key={m} className="p-12 text-center text-muted-foreground border rounded-3xl">{m === 'baseline' ? 'Baseline' : 'Refined'} model not available</div>
                                    })}
                                </div>
                            ) : (
                                <ResultCard r={result as ClassificationResult} />
                            )}
                        </section>
                    )}

                    {/* Gallery Section - Using AnimatedTestimonials for "Sample Photos" */}
                    <section id="gallery-section" className="space-y-12 pt-24 border-t">
                        <div className="text-center space-y-4">
                            <h3 className="text-4xl font-black tracking-tight">Explainability Gallery</h3>
                            <p className="text-muted-foreground text-lg">Explore how our models interpret classic CIFAR-10 objects</p>
                        </div>
                        <div className="bg-muted/10 rounded-[3rem] border p-8">
                            <AnimatedTestimonials testimonials={finalTestimonials} autoplay={true} />
                        </div>
                    </section>

                    {/* Info Section */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <InfoCard
                            icon={<RotateCcw />}
                            title="10 Object Classes"
                            desc="Airplane, Automobile, Bird, Cat, Deer, Dog, Frog, Horse, Ship, and Truck"
                        />
                        <InfoCard
                            icon={<ImageIcon />}
                            title="Grad-CAM Visualization"
                            desc="See exactly which parts of the image the neural network focuses on during classification"
                        />
                        <InfoCard
                            icon={<Search />}
                            title="Model Refinement"
                            desc="Compare baseline and attention-guided refined models to see performance improvements"
                        />
                    </section>

                    {/* Footer */}
                    <footer className="text-center pt-24 border-t border-border opacity-50">
                        <p className="text-sm font-medium tracking-tight">Built with PyTorch, ResNet-18, and Grad-CAM • Explainability-Guided Image Classification</p>
                    </footer>

                    {/* Dock */}
                    <Dock
                        items={[
                            { icon: <Home className="w-full h-full" />, label: 'Home', onClick: () => setView('landing') },
                            { icon: <Plus className="w-full h-full" />, label: 'Upload Image', onClick: () => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' }) },
                            { icon: <ImageIcon className="w-full h-full" />, label: 'Explainability Gallery', onClick: () => document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' }) },
                            { icon: <Info className="w-full h-full" />, label: 'About Project', onClick: () => setShowAbout(true) },
                            { icon: <Layers className="w-full h-full" />, label: 'Toggle Grid', onClick: () => setShowGrid(!showGrid) },
                        ]}
                    />

                    {/* About Modal */}
                    {showAbout && (
                        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAbout(false)}>
                            <div className="bg-card w-full max-w-md rounded-3xl p-8 border border-primary/20 shadow-2xl relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3"><Info className="text-primary" /> About CIFAR-10 XAI</h3>
                                <p className="text-muted-foreground mb-6 leading-relaxed">
                                    This interactive dashboard demonstrates Explainable AI (XAI) using Grad-CAM on the CIFAR-10 dataset.
                                    Upload an image to see the neural network's classification along with an attention heatmap revealing exactly where the model is looking.
                                </p>
                                <div className="space-y-3 text-sm mb-8 bg-muted/40 p-4 rounded-xl border">
                                    <p className="flex justify-between"><strong className="text-foreground">Models</strong> <span className="text-muted-foreground">ResNet-18 (Enhanced)</span></p>
                                    <p className="flex justify-between"><strong className="text-foreground">Frontend</strong> <span className="text-muted-foreground">React, Tailwind, Framer</span></p>
                                    <p className="flex justify-between"><strong className="text-foreground">Backend</strong> <span className="text-muted-foreground">PyTorch, Flask API</span></p>
                                </div>
                                <InteractiveHoverButton
                                    text="Close Menu"
                                    className="w-full h-12"
                                    onClick={() => setShowAbout(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ResultCard = ({ r }: { r: ClassificationResult }) => (
    <div className="bg-card border rounded-3xl p-6 space-y-6 shadow-xl border-primary/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md border border-primary/20">
                    {r.model_used} model
                </div>
                <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-0.5">Predicted Class</h4>
                    <span className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent capitalize">{r.predicted_class}</span>
                </div>
            </div>
            <div className="text-right">
                <span className="text-4xl font-black text-primary leading-none">{(r.confidence).toFixed(1)}%</span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Confidence Score</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
                <h5 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Original Input (32x32)</h5>
                <div className="aspect-square bg-muted rounded-2xl overflow-hidden border">
                    <img src={r.original_image} alt="Original" className="w-full h-full object-cover pixel-perfect h-large" style={{ imageRendering: 'pixelated' }} />
                </div>
            </div>
            <div className="space-y-3">
                <h5 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Attention Map (Grad-CAM)</h5>
                <div className="aspect-square bg-muted rounded-2xl overflow-hidden border border-primary/20 shadow-inner">
                    <img src={r.gradcam_image} alt="Grad-CAM" className="w-full h-full object-cover" />
                </div>
            </div>
            <div className="space-y-3">
                <h5 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Prediction Analysis</h5>
                <div className="space-y-3 flex flex-col justify-center h-[calc(100%-24px)]">
                    {r.top5.map((p, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                <div className="flex gap-2">
                                    <span className="text-muted-foreground opacity-50">#{i + 1}</span>
                                    <span className={i === 0 ? "text-primary" : ""}>{p.class}</span>
                                </div>
                                <span>{p.confidence.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden border">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        i === 0 ? "bg-primary" : "bg-primary/20"
                                    )}
                                    style={{ width: `${p.confidence}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const InfoCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="bg-card border rounded-3xl p-8 space-y-4 hover:border-primary/50 transition-all group">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" }) : icon}
        </div>
        <h4 className="text-xl font-bold">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
);

export default App;
