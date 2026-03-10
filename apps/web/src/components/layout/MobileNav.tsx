"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, PieChart, Wallet, Scale } from "lucide-react";
export function MobileNav() {
    const pathname = usePathname();

    // Show a subset on bottom bar, or a menu
    const bottomNavItems = [
        { name: "SIP", href: "/sip", icon: Calculator },
        { name: "Plan", href: "/financial-planning", icon: PieChart },
        { name: "Networth", href: "/networth", icon: Wallet },
        { name: "Compare", href: "/sip-vs-lumpsum", icon: Scale },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-surface border-t border-brand-surfaceBorder z-50 px-4 pb-safe flex items-center justify-between backdrop-blur-lg bg-opacity-90">
            {bottomNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center justify-center w-full h-full gap-1"
                    >
                        <item.icon className={`w-5 h-5 ${isActive ? "text-brand-gold" : "text-muted-foreground"}`} />
                        <span className={`text-[10px] font-medium ${isActive ? "text-brand-gold" : "text-muted-foreground"}`}>
                            {item.name}
                        </span>
                        {isActive && (
                            <div className="absolute top-0 w-8 h-0.5 bg-brand-gold rounded-b-full shadow-[0_2px_8px_rgba(245,166,35,0.5)]" />
                        )}
                    </Link>
                );
            })}

            {/* Full menu trigger could go here if needed, but keeping it simple with 4 tabs for now */}
        </div>
    );
}
