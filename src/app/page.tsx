export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 ">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            <span style={{ color: "hsl(var(--primary))" }}>Health</span>
            <span>Sphere</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your personal health and nutrition companion.
          </p>
        </div>
      </div>
    </main>
  );
}
