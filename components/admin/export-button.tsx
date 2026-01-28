
"use client";

import React from 'react';
import { Download } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/export';

interface StatsExportButtonProps {
    data: any[];
    filename: string;
    className?: string;
    label?: string;
}

export function StatsExportButton({ data, filename, className, label }: StatsExportButtonProps) {
    const handleExport = () => {
        exportToCSV(data, filename);
    };

    return (
        <button
            onClick={handleExport}
            className={className || "flex items-center gap-2 px-6 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-sm font-bold transition-all border border-border/50"}
        >
            <Download className="size-4" /> {label || "EXPORT LOGS"}
        </button>
    );
}
