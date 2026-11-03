import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MinutesFillableOverlay from "@/components/board/MinutesFillableOverlay";

/**
 * Public (no-login) fillable minutes page — the link from the overlay's
 * "Copy link" button opens here, so recipients don't need portal access.
 */
export default function FillableMinutesPublic() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    base44.functions.invoke("getPublicFillableMinutes", { meeting_id: id })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-slate-300 border-t-[#1e2f4d] rounded-full animate-spin" /></div>;
  }

  if (closed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-center px-6">
        <p className="text-lg font-semibold text-[#1e2f4d]">Thanks — the fillable minutes are closed.</p>
        <p className="text-sm text-slate-500 mt-1">You can close this tab.</p>
      </div>
    );
  }

  if (!data?.meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-center px-6">
        <p className="text-lg font-semibold text-[#1e2f4d]">This link is invalid or no longer available.</p>
        <p className="text-sm text-slate-500 mt-1">Please ask Candora staff for an updated link.</p>
      </div>
    );
  }

  return (
    <MinutesFillableOverlay
      meeting={data.meeting}
      items={data.items || []}
      members={data.members || []}
      onClose={() => setClosed(true)}
    />
  );
}