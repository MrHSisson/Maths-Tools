import { Pin } from "lucide-react";
import { MAX_KEPT, type QuestionKeeperMenu } from "../questionKeeper";

/** Pin / unpin the question on screen (toolbar). Filled while it is pinned; disabled once five others are. */
export function PinButton({ keeper, size = "bar" }: { keeper?: QuestionKeeperMenu; size?: "bar" | "phone" }) {
  if (!keeper) return null;
  const { isPinned, canPin } = keeper;
  const title = isPinned ? "Unpin this question" : canPin ? "Pin this question to come back to it" : `${MAX_KEPT} questions pinned: unpin one first`;
  const tone = isPinned ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-200 text-blue-900 active:bg-slate-50";
  return (
    <button onClick={keeper.onPin} disabled={!canPin} aria-label={title} aria-pressed={isPinned} title={title}
      className={`shrink-0 border rounded-xl flex items-center justify-center disabled:opacity-40 ${tone} ${size === "phone" ? "w-14 h-12" : "w-10 xl:w-11 h-10"}`}>
      <Pin size={size === "phone" ? 20 : 18} fill={isPinned ? "currentColor" : "none"} />
    </button>
  );
}
