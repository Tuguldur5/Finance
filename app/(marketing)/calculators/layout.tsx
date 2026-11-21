export default function CalculatorsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10 pt-20">
      {children}
    </main>
  );
}
