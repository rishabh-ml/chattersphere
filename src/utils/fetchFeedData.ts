export async function fetchFeedData() {
  const res = await fetch("/api/feed/home");
  if (!res.ok) throw new Error("Failed to fetch feed");
  return res.json();
}
