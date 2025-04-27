// src/app/community/[communityId]/page.tsx
"use client";

import React from "react";
import {UnderDevelopment} from "@/components/under-development"; // Assuming you have this already

export default function CommunityPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <UnderDevelopment
                title="Community Feature Coming Soon!"
            />
        </div>
    );
}
