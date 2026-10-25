import type { Creator } from "@/lib/api";
import { Avatar } from "./ui";

export default function CreatorBadge({ creator, size = 28 }: { creator?: Creator; size?: number }) {
  if (!creator) return null;
  const name = creator.full_name || "Unnamed user";
  return (
    <span className="person" title={`Owner: ${name}`}>
      <Avatar name={name} src={creator.profile_picture} size={size} />
      <span>{name}</span>
    </span>
  );
}
