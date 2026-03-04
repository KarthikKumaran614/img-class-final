import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface DockItem {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

interface DockProps {
    items: DockItem[];
}

const Dock: React.FC<DockProps> = ({ items }) => {
    const [mouseX, setMouseX] = useState<number>(Infinity);
    const [isHovering, setIsHovering] = useState(false);
    const baseSize = 50;
    const magnification = 70;
    const distanceLimit = 200;

    return (
        <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto pb-6 pt-24 px-24 group flex justify-center"
            onMouseMove={(e) => {
                setIsHovering(true);
                setMouseX(e.clientX);
            }}
            onMouseLeave={() => {
                setIsHovering(false);
                setMouseX(Infinity);
            }}
        >
            <div className="flex items-end gap-2 p-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_40px_80px_-10px_rgba(0,0,0,0.8)] transform translate-y-10 scale-90 opacity-20 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 will-change-transform ease-[cubic-bezier(0.16,1,0.3,1)] group/dock">
                {items.map((item, index) => (
                    <DockIcon
                        key={index}
                        mouseX={mouseX}
                        isHovering={isHovering}
                        item={item}
                        baseSize={baseSize}
                        magnification={magnification}
                        distanceLimit={distanceLimit}
                    />
                ))}
            </div>
        </div>
    );
};

const DockIcon = ({ mouseX, isHovering, item, baseSize, magnification, distanceLimit }: {
    mouseX: number;
    isHovering: boolean;
    item: DockItem;
    baseSize: number;
    magnification: number;
    distanceLimit: number;
}) => {
    const ref = useRef<HTMLButtonElement>(null);
    const [size, setSize] = useState(baseSize);

    useEffect(() => {
        let targetSize = baseSize;
        if (isHovering && mouseX !== Infinity && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            // Calculate center using standard rect
            const centerX = rect.x + rect.width / 2;
            const dist = Math.abs(mouseX - centerX);

            if (dist < distanceLimit) {
                // macOS dock bell curve formula
                const extra = (magnification - baseSize) * Math.cos((dist / distanceLimit) * (Math.PI / 2));
                targetSize = baseSize + Math.max(0, extra);
            }
        }

        setSize(targetSize);
    }, [mouseX, isHovering, baseSize, magnification, distanceLimit]);

    return (
        <button
            ref={ref}
            onClick={item.onClick}
            className="group/icon relative flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 transition-all duration-300 ease-out z-10 
                       group-hover/dock:opacity-50 group-hover/dock:blur-[2px] group-hover/dock:scale-95
                       hover:!opacity-100 hover:!blur-none hover:!scale-110 hover:!bg-white/20 hover:!border-white/40 hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:z-50"
            style={{ width: size, height: size }}
            aria-label={item.label}
        >
            <div className="w-1/2 h-1/2 text-neutral-400 group-hover/icon:text-white transition-colors duration-300">
                {item.icon}
            </div>

            {/* Minimalist label that only shows when this specific icon is hovered */}
            <div className="absolute -top-12 opacity-0 group-hover/icon:opacity-100 group-hover/icon:-translate-y-1 transition-all duration-300 ease-out bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
                {item.label}
            </div>
        </button>
    );
};

export default Dock;
