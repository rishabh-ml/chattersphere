import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

interface CommunityRedirectPageProps {
  params: {
    slug: string;
  };
}

export default function CommunityRedirectPage({ params }: CommunityRedirectPageProps) {
  const { slug } = params;

  if (!slug) {
    notFound();
  }

  // Server-side redirect to the new community path
  redirect(`/communities/${slug}`);
}
