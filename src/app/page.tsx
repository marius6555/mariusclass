
import {
  SidebarInset,
} from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookCopy, CalendarClock, FolderKanban, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  { title: "Student Profiles", href: "/students", icon: <Users /> },
  { title: "Project Hub", href: "/projects", icon: <FolderKanban /> },
  { title: "Events/Updates", href: "/events", icon: <CalendarClock /> },
  { title: "Resources", href: "/resources", icon: <BookCopy /> },
]

export default function Home() {
  return (
    <SidebarInset>
      <PageHeader
        title="Welcome to ClassHub Central"
        description="Your central hub for class activities, resources, and collaboration."
      />
      <main className="relative flex-1 p-6 lg:p-8">
        <div className="absolute inset-0 z-0">
            <Image 
                src="https://placehold.co/1200x800.png" 
                alt="Classroom background"
                fill
                className="object-cover"
                data-ai-hint="classroom abstract"
            />
            <div className="absolute inset-0 bg-background/80" />
        </div>
        <div className="relative z-10">
          <div className="bg-card/80 backdrop-blur-sm border rounded-lg p-8 mb-8 text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tight">Welcome to ClassHub Central</h1>
            <p className="mt-4 text-lg text-muted-foreground">This is your one-stop-shop for everything related to our class. Explore the sections below to get started.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {sections.map(section => (
                <Card key={section.title} className="bg-card/80 backdrop-blur-sm border hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="font-headline text-2xl">{section.title}</CardTitle>
                        <div className="p-2 bg-primary/20 text-primary rounded-lg">
                            {section.icon}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Link href={section.href}>
                            <Button className="w-full">
                                Go to {section.title} <ArrowRight className="ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ))}
          </div>
        </div>
      </main>
    </SidebarInset>
  );
}
