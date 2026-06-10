"use client";

import { useEffect, useState } from "react";

import { useRole } from "@/lib/auth/use-role";
import { PillarIcon } from "@/components/brand/pillar-icon";

interface Status {
  connected: boolean;
  username: string | null;
}

const NOTICE: Record<string, string> = {
  connected: "✅ Instagram connected.",
  denied: "Connection cancelled.",
  "no-account":
    "No Instagram Business/Creator account is linked to that Facebook Page.",
  error: "Couldn't connect Instagram — please try again.",
};

// "Connect Instagram" control. Gated to admins for now — clients can't connect
// until the Meta app passes review (only testers work in dev mode).
export function ConnectInstagram() {
  const role = useRole();
  const [status, setStatus] = useState<Status | null>(null);
  const [igNotice, setIgNotice] = useState<string | null>(null);
  const [igDetail, setIgDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/instagram/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false, username: null }));
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      setIgNotice(sp.get("ig"));
      setIgDetail(sp.get("ig_detail"));
    }
  }, []);

  if (role !== "admin") return null;

  const disconnect = async () => {
    await fetch("/api/instagram/status", { method: "DELETE" });
    setStatus({ connected: false, username: null });
  };

  return (
    <div className="ck-card p-4 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <PillarIcon className="w-4 h-4 text-accent" icon="instagram" />
          {status?.connected ? (
            <span className="text-text-secondary">
              Connected as{" "}
              <strong className="text-text-primary">@{status.username}</strong>
            </span>
          ) : (
            <span className="text-text-secondary">
              Connect your Instagram to audit the live profile.
            </span>
          )}
        </div>
        {status?.connected ? (
          <button
            type="button"
            onClick={disconnect}
            className="text-xs font-medium text-text-tertiary hover:text-danger transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <a href="/api/instagram/connect" className="ck-btn-primary !py-1.5 !px-3 text-sm">
            Connect Instagram
          </a>
        )}
      </div>
      {igNotice && NOTICE[igNotice] && (
        <p className="mt-2 text-xs text-text-tertiary">{NOTICE[igNotice]}</p>
      )}
      {igDetail && (
        <p className="mt-1 text-xs text-text-tertiary font-mono break-words">
          Debug: {igDetail}
        </p>
      )}
    </div>
  );
}
