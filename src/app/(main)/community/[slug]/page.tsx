"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useNavigation } from "@/lib/navigation";
import { Loader2 } from "lucide-react";

export default function CommunityRedirectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigation = useNavigation();

  useEffect(() => {
    // Redirect to the new community path
    if (slug) {
      navigation.goToCommunity(slug as string);
    }
  }, [slug, navigation]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00AEEF]" />
        <p className="text-gray-500">Redirecting to updated community page...</p>
      </div>
    </div>
  );
}
