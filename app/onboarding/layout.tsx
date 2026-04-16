export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {children}
    </div>
  );
}
