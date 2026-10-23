/* eslint-disable @next/next/no-img-element */
import type { Creator } from "@/lib/api";

export default function CreatorBadge({ creator }: { creator?: Creator }) {
  if (!creator) return null;
  const name = creator.full_name || "Unnamed user";
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <span className="creator-badge" title={`Created by ${name}`}>
    {creator.profile_picture
      ? <img src={creator.profile_picture} alt="" width={28} height={28} />
      : <span className="creator-initials" aria-hidden="true">{initials}</span>}
    <span><small>Created by</small><b>{name}</b></span>
  </span>;
}
