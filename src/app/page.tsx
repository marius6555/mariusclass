import {
  SidebarInset,
} from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowRight, BookCopy, CalendarClock, FolderKanban, Mail, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const sections = [
  {
    title: "Student Profiles",
    description: "Meet your classmates and find collaborators.",
    href: "/students",
    icon: <Users className="h-8 w-8 text-primary" />,
  },
  {
    title: "Project Hub",
    description: "Explore projects from students in the class.",
    href: "/projects",
    icon: <FolderKanban className="h-8 w-8 text-primary" />,
  },
  {
    title: "Events & Updates",
    description: "Stay up-to-date with the latest announcements.",
    href: "/events",
    icon: <CalendarClock className="h-8 w-8 text-primary" />,
  },
  {
    title: "Resources",
    description: "Find study guides, notes, and useful links.",
    href: "/resources",
    icon: <BookCopy className="h-8 w-8 text-primary" />,
  },
  {
    title: "Contact & Join Us",
    description: "Get in touch or sign up for more info.",
    href: "/contact",
    icon: <Mail className="h-8 w-8 text-primary" />,
  },
];

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.title} className="flex flex-col transition-transform transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-start gap-4">
                {section.icon}
                <div>
                  <CardTitle className="font-headline">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Link href={section.href} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Section <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </SidebarInset>
  );
}
