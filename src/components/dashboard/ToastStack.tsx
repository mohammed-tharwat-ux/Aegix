import { useAppContext } from "../../context/AppContext";

const tones = {
  info: "border-cyan-300/20 bg-cyan-400/12 text-cyan-50",
  warning: "border-amber-300/20 bg-amber-400/12 text-amber-50",
  danger: "border-rose-300/20 bg-rose-400/12 text-rose-50",
  success: "border-emerald-300/20 bg-emerald-400/12 text-emerald-50",
} as const;

export function ToastStack() {
  const { notifications } = useAppContext();
  const unread = notifications.filter((item) => !item.read).slice(0, 3);

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 space-y-3 sm:bottom-6 sm:right-6">
      {unread.map((notification) => (
        <div className={`pointer-events-auto w-[320px] rounded-2xl border px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl ${tones[notification.severity]}`} key={notification.id}>
          <p className="text-sm font-semibold">{notification.title}</p>
          <p className="mt-1 text-sm opacity-90">{notification.message}</p>
        </div>
      ))}
    </div>
  );
}
