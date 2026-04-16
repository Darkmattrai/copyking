"use client";

interface InstagramPreviewProps {
  nameField: string;
  bioText: string;
  username?: string;
}

export function InstagramPreview({
  nameField,
  bioText,
  username = "yourusername",
}: InstagramPreviewProps) {
  const bioLines = bioText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="w-full max-w-[320px] mx-auto">
      {/* Phone frame */}
      <div className="rounded-[2rem] border-2 border-border bg-background overflow-hidden shadow-lg">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1">
          <span className="text-[11px] font-semibold text-text-primary">9:41</span>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 18c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6zm0-10c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z" /><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
            <svg className="w-4 h-4 text-text-primary" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="6" width="3" height="12" rx="0.5" /><rect x="7" y="4" width="3" height="14" rx="0.5" /><rect x="12" y="2" width="3" height="16" rx="0.5" /><rect x="17" y="0" width="3" height="18" rx="0.5" /></svg>
            <div className="w-6 h-3 rounded-sm border border-text-primary/50 relative ml-0.5">
              <div className="absolute inset-0.5 rounded-[1px] bg-text-primary/80" style={{ width: "70%" }} />
            </div>
          </div>
        </div>

        {/* Instagram header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            <span className="text-sm font-semibold text-text-primary">{username}</span>
          </div>
          <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
        </div>

        {/* Profile section */}
        <div className="px-4 pt-4 pb-3">
          {/* Avatar + stats row */}
          <div className="flex items-center gap-5 mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
            <div className="flex-1 flex justify-around text-center">
              <div>
                <span className="block text-sm font-bold text-text-primary">128</span>
                <span className="block text-[10px] text-text-tertiary">Posts</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-text-primary">4.2K</span>
                <span className="block text-[10px] text-text-tertiary">Followers</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-text-primary">892</span>
                <span className="block text-[10px] text-text-tertiary">Following</span>
              </div>
            </div>
          </div>

          {/* Name field */}
          <p className="text-[13px] font-semibold text-text-primary leading-snug mb-0.5">
            {nameField || "Your Name | Keyword"}
          </p>

          {/* Bio text */}
          <div className="text-[13px] text-text-secondary leading-snug mb-3 min-h-[3rem]">
            {bioLines.length > 0 ? (
              bioLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))
            ) : (
              <span className="text-text-tertiary italic">Your bio will appear here...</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5 mb-3">
            <button className="flex-1 py-1.5 rounded-lg bg-accent text-white text-[11px] font-semibold text-center">
              Follow
            </button>
            <button className="flex-1 py-1.5 rounded-lg bg-surface-hover border border-border text-text-primary text-[11px] font-semibold text-center">
              Message
            </button>
            <button className="py-1.5 px-2.5 rounded-lg bg-surface-hover border border-border text-text-primary">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* Grid placeholder */}
          <div className="border-t border-border pt-2">
            <div className="grid grid-cols-3 gap-0.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-surface-hover rounded-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
