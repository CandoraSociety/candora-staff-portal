import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MinutesFillableOverlay from "@/components/board/MinutesFillableOverlay";
import { SEED_BOARD_MEMBERS, memberEmail } from "@/components/board/MinutesAttendancePanel";

/**
 * Standalone, link-shareable page for the fillable minutes — renders the same
 * interactive in-app form the Minutes Taker opens, so its buttons always work.
 */
export default function BoardMinutesFillable() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState(null);
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Meeting.filter({ id }),
      base44.entities.AgendaItem.filter({ meeting_id: id }),
      base44.entities.BoardMember.filter({ status: "active" }),
    ]).then(async ([meetings, ai, bm]) => {
      setMeeting(meetings[0]);
      setItems(ai.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
      let memberList = bm;
      if (bm.length === 0) {
        memberList = await base44.entities.BoardMember.bulkCreate(
          SEED_BOARD_MEMBERS.map((m) => ({ ...m, email: memberEmail(m.full_name), status: "active" }))
        );
      }
      setMembers(memberList.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")));
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <MinutesFillableOverlay
      meeting={meeting}
      items={items}
      members={members}
      onClose={() => navigate(`/board/meetings/${id}/minutes`)}
    />
  );
}