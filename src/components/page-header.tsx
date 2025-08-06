
import { GraduationCap } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-center text-center gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div className="bg-primary p-3 rounded-lg hidden md:block">
            <GraduationCap className="text-primary-foreground h-6 w-6" />
        </div>
        <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
        </div>
      </div>
    </header>
  );
}
