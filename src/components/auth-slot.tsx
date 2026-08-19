import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import { useI18n } from "@/lib/i18n";

export function AuthSlot({ compact = false }: { compact?: boolean }) {
  const { user, isPending } = useCurrentUserState();
  const { t } = useI18n();
  if (isPending) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-surface-2" />;
  }
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  return (
    <div className="flex items-center gap-2">
      {user.profileImageUrl ? (
        <img src={user.profileImageUrl} alt="" className="size-8 rounded-full object-cover" />
      ) : (
        <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-xs font-medium">
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      {compact ? null : <span className="hidden max-w-32 truncate text-sm sm:inline">{label}</span>}
      <button
        type="button"
        onClick={() => void signOut("/")}
        className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
      >
        {t.signOut}
      </button>
    </div>
  );
}
