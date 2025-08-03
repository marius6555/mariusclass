import {
  SidebarInset,
} from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";

export default function Home() {
  return (
    <SidebarInset>
      <PageHeader
        title="Welcome to ClassHub Central"
        description="Your central hub for class activities, resources, and collaboration."
      />
      <main className="p-6 lg:p-8">
        <div className="text-center mb-12">
          <h1 className="font-headline text-5xl font-bold tracking-tight">Welcome to ClassHub Central</h1>
          <p className="text-muted-foreground mt-4 text-lg">Your central hub for class activities, resources, and collaboration.</p>
        </div>
      </main>
    </SidebarInset>
  );
}
