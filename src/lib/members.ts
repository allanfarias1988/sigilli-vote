import { z } from "zod";

const memberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  // Add other member fields as needed
});

export type Member = z.infer<typeof memberSchema>;

const MEMBERS_STORAGE_KEY = "sigilli-vote-members";

export function getMembers(): Member[] {
  const membersJson = localStorage.getItem(MEMBERS_STORAGE_KEY);
  if (!membersJson) {
    return [];
  }
  try {
    const members = JSON.parse(membersJson);
    return z.array(memberSchema).parse(members);
  } catch (error) {
    console.error("Error parsing members from local storage:", error);
    return [];
  }
}

export function saveMembers(members: Member[]) {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
}

export function addMember(member: Omit<Member, "id">): Member {
  const members = getMembers();
  const newMember = { ...member, id: crypto.randomUUID() };
  const updatedMembers = [...members, newMember];
  saveMembers(updatedMembers);
  return newMember;
}
