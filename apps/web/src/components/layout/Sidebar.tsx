"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    Calculator,
    PieChart,
    Home,
    Wallet,
    ShieldCheck,
    ArrowDownToLine,
    Banknote,
    Receipt,
    CandlestickChart,
    Scale
} from "lucide-react";

export const navItems = [
    { name: "Advanced SIP", href: "/sip", icon: Calculator },
    { name: "Financial Planning", href: "/financial-planning", icon: PieChart },
    { name: "Interest Free Home Loan", href: "/interest-free-home-loan", icon: Home },
    { name: "Networth Tracker", href: "/networth", icon: Wallet },
    { name: "Term Insurance", href: "/term-insurance", icon: ShieldCheck },
    { name: "SWP Calculator", href: "/swp", icon: ArrowDownToLine },
    { name: "Loan Against MF", href: "/loan-against-mf", icon: Banknote },
    { name: "Income Tax", href: "/income-tax", icon: Receipt },
    { name: "SIP vs FD", href: "/sip-vs-fd", icon: CandlestickChart },
    { name: "SIP vs Lumpsum", href: "/sip-vs-lumpsum", icon: Scale },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-[260px] bg-brand-darkBg border-r border-brand-surfaceBorder h-full flex-col hidden md:flex shrink-0">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center font-heading font-bold text-brand-darkBg text-lg">
                        W
                    </div>
                    <span className="font-heading font-bold text-xl tracking-wide text-foreground">
                        WealthCraft
                    </span>
                </Link>
            </div>

            <nav className="flex-1 px-4 pb-6 overflow-y-auto mt-4 space-y-1">
                <div className="mb-4 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Calculators
                </div>

                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link key={item.name} href={item.href} className="block relative">
                            {isActive && (
                                <motion.div
                                    layoutId="active-sidebar-indicator"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-brand-gold rounded-r-full"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <div
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? "bg-brand-gold/10 text-brand-gold font-medium"
                                    : "text-muted-foreground hover:bg-brand-surface hover:text-foreground"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? "text-brand-gold" : "text-muted-foreground"}`} />
                                <span className="text-sm">{item.name}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>


        </aside>
    );
}
