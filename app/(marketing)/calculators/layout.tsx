export default function CalculatorsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-20 pb-16 sm:px-6">
      {children}
    </main>
  );
}
