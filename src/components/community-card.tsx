"use client";

import { motion } from "framer-motion";
import { Plus, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useNavigation, routes } from "@/lib/navigation";
import Image from "next/image";
import { Community } from "@/context/CommunityContext";
import { toast } from "sonner";

interface CommunityCardProps {
  community: Community;
  onJoinLeave?: (communityId: string, isMember: boolean) => Promise<void>;
  onSelect?: (community: Community) => void;
}

export default function CommunityCard({ community, onJoinLeave, onSelect }: CommunityCardProps) {
  const navigation = useNavigation();
  const handleJoinLeave = async () => {
    if (!onJoinLeave) return;

    const isMember = community.isMember || false;

    try {
      await onJoinLeave(community.id, isMember);
      toast.success(
        isMember ? `Left ${community.name} community` : `Joined ${community.name} community`
      );
    } catch (error) {
      console.error("Error joining/leaving community:", error);
      toast.error("Failed to update membership status");
    }
  };

  return (
    <motion.div
      className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {community.image ? (
            <div className="relative h-12 w-12 rounded-full overflow-hidden">
              <Image src={community.image} alt={community.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#00AEEF] to-[#EC4899] flex items-center justify-center text-white font-bold">
              {community.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{community.name}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                <span>{community.memberCount}</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                <span>{community.postCount}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{community.description}</p>

        <div className="flex justify-between items-center">
          <Link
            href={routes.community(community.slug, community.id)}
            className="text-sm text-[#00AEEF] hover:underline"
            onClick={(e) => {
              if (onSelect) {
                e.preventDefault();
                onSelect(community);
              } else {
                navigation.goToCommunity(community.slug, community.id, e);
              }
            }}
          >
            View Community
          </Link>

          {onJoinLeave && (!community.isCreator || community.isCreator === undefined) && (
            <Button
              variant={community.isMember ? "outline" : "default"}
              size="sm"
              onClick={handleJoinLeave}
              className={community.isMember ? "" : "bg-[#00AEEF] hover:bg-[#00AEEF]/90"}
            >
              {community.isMember ? (
                "Leave"
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Join
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
