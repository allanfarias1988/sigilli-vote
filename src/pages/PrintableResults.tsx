// src/pages/PrintableResults.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "@/lib/db";
import { Loader2 } from "lucide-react";

interface VoteResult {
  roleName: string;
  votes: {
    memberId: string;
    memberName: string;
    count: number;
  }[];
}

export default function PrintableResults() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [commission, setCommission] = useState(null);

  useEffect(() => {
    if (id) {
      loadCommissionDetails(id);
      loadResults(id);
    }
  }, [id]);

  const loadCommissionDetails = async (id: string) => {
    try {
      const { data, error } = await db.from("commissions").select("*").eq("id", id).single();
      if (error) throw error;
      setCommission(data);
    } catch (error) {
      console.error("Error loading commission details:", error);
    }
  };

  const loadResults = async (commissionId: string) => {
    setLoading(true);
    try {
      const { data: members, error: membersError } = await db
        .from("members")
        .select("id, nome_completo");
      if (membersError) throw membersError;
      const memberMap = new Map(members?.map((m) => [m.id, m.nome_completo]));

      const { data: roles, error: rolesError } = await db
        .from("commission_roles")
        .select("id, nome_cargo")
        .eq("commission_id", commissionId);
      if (rolesError) throw rolesError;
      const roleMap = new Map(roles?.map((r) => [r.id, r.nome_cargo]));

      const { data: ballots, error: ballotsError } = await db
        .from("ballots")
        .select("id, role_id")
        .eq("commission_id", commissionId);
      if (ballotsError) throw ballotsError;
      if (!ballots || ballots.length === 0) {
        setResults([]);
        return;
      }

      const ballotIds = ballots.map((b) => b.id);
      const allVotes = [];
      for (const ballotId of ballotIds) {
        const { data: votes, error: votesError } = await db
          .from("votes")
          .select("member_id")
          .eq("ballot_id", ballotId);
        if (votesError) throw votesError;
        if (votes) allVotes.push(...votes);
      }

      const voteCounts: { [roleId: string]: { [memberId: string]: number } } =
        {};

      for (const ballot of ballots) {
        if (!voteCounts[ballot.role_id]) {
          voteCounts[ballot.role_id] = {};
        }
        const votesForBallot = allVotes.filter(
          (v) => v.ballot_id === ballot.id,
        );
        for (const vote of votesForBallot) {
          if (!voteCounts[ballot.role_id][vote.member_id]) {
            voteCounts[ballot.role_id][vote.member_id] = 0;
          }
          voteCounts[ballot.role_id][vote.member_id]++;
        }
      }

      const formattedResults = Object.entries(voteCounts).map(
        ([roleId, memberVotes]) => {
          return {
            roleName: (roleMap.get(roleId) || "Cargo Desconhecido") as string,
            votes: Object.entries(memberVotes)
              .map(([memberId, count]) => ({
                memberId,
                memberName: memberMap.get(memberId) || "Membro Desconhecido",
                count,
              }))
              .sort((a, b) => b.count - a.count),
          };
        },
      );

      setResults(formattedResults);
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {commission && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{commission.name}</h1>
          <p className="text-lg text-muted-foreground">
            {commission.description}
          </p>
        </div>
      )}
      <div className="space-y-6">
        {results.map((result) => (
          <div key={result.roleName}>
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">
              {result.roleName}
            </h2>
            <div className="space-y-2">
              {result.votes.map((vote) => (
                <div
                  key={vote.memberId}
                  className="flex justify-between items-center p-2"
                >
                  <span>{vote.memberName}</span>
                  <span className="font-semibold">{vote.count} voto(s)</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
