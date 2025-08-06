import { GraduationCap } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-4 p-4 lg:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-4">
        <div className="bg-primary p-3 rounded-lg hidden md:block">
            <GraduationCap className="text-primary-foreground h-6 w-6" />
        </div>
        <div>
            <h1 className="font-headline text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </header>
  );
}
