"use client";

import { useEffect, useState } from "react";

import { PillarIcon } from "@/components/brand/pillar-icon";

interface Status {
  connected: boolean;
  username: string | null;
  profilePictureUrl?: string | null;
}

const NOTICE: Record<string, string> = {
  connected: "✅ Instagram connected.",
  denied: "Connection cancelled.",
  "no-account":
    "No Instagram Business/Creator account is linked to that Facebook Page.",
  error: "Couldn't connect Instagram — please try again.",
};

// "Connect Instagram" control. Available to all logged-in users. Connecting
// only succeeds once the Meta app is live/approved (dev mode = testers only).
export function ConnectInstagram() {
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

  const disconnect = async () => {
    await fetch("/api/instagram/status", { method: "DELETE" });
    setStatus({ connected: false, username: null });
  };

  return (
    <div className="ck-card p-4 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          {status?.connected && status.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={status.profilePictureUrl}
              alt={status.username ? `@${status.username}` : "Instagram profile"}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <PillarIcon className="w-4 h-4 text-accent" icon="instagram" />
          )}
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
