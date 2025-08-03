
import {
  SidebarInset,
} from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import Image from "next/image";
import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <SidebarInset>
      <PageHeader
        title="Welcome to ClassHub Central"
        description="Your central hub for class activities, resources, and collaboration."
      />
      <main className="relative flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="absolute inset-0 z-0">
            <Image 
                src="https://placehold.co/1200x800.png" 
                alt="Classroom background"
                fill
                className="object-cover"
                data-ai-hint="classroom abstract"
            />
            <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center text-white mb-12 flex flex-col items-center">
          <div className="bg-primary/80 backdrop-blur-sm rounded-full p-4 mb-4 border-4 border-white">
            <GraduationCap className="h-16 w-16 text-primary-foreground" />
          </div>
          <h1 className="font-headline text-5xl font-bold tracking-tight">ClassHub Central</h1>
          <p className="mt-4 text-lg font-medium">Your Slogan Here: The Future of Learning, Today.</p>
        </div>
      </main>
    </SidebarInset>
  );
}
