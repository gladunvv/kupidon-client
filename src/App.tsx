import { Button } from '@/components/ui/button';

function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Kupidon client</h1>
      <p className="text-muted-foreground">Tailwind + shadcn/ui baseline</p>
      <Button>It works</Button>
    </main>
  );
}

export default App;
