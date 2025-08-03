import { SidebarTrigger } from "@/components/ui/sidebar";

type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-4 p-4 lg:p-6 border-b bg-card">
      <SidebarTrigger className="md:hidden" />
      <div>
        <h1 className="font-headline text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}
