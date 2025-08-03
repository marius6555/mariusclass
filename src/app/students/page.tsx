
'use client'

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

type Student = {
  id: string;
  name: string;
  major: string;
  interests: string[];
  avatar: string;
  initials: string;
  hint: string;
};

const students: Student[] = [
    { id: "1", name: "Alice Johnson", major: "Computer Science", interests: ["AI", "Web Dev", "UX Design"], avatar: "https://placehold.co/100x100.png", initials: "AJ", hint: "woman face" },
    { id: "2", name: "Bob Williams", major: "Data Science", interests: ["Machine Learning", "Statistics"], avatar: "https://placehold.co/100x100.png", initials: "BW", hint: "man portrait" },
    { id: "3", name: "Charlie Brown", major: "Software Engineering", interests: ["Mobile Apps", "Game Dev"], avatar: "https://placehold.co/100x100.png", initials: "CB", hint: "person smiling" },
];

export default function StudentsPage() {
  return (
    <SidebarInset>
      <PageHeader
        title="Student Profiles"
        description="Get to know your fellow classmates and their interests."
      />
      <main className="p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {students.map((student) => (
            <Card key={student.id} className="flex flex-col text-center hover:shadow-lg transition-shadow">
            <CardHeader className="items-center">
                <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
                <AvatarImage src={student.avatar} alt={student.name} data-ai-hint={student.hint} />
                <AvatarFallback>{student.initials}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline">{student.name}</CardTitle>
                <p className="text-muted-foreground">{student.major}</p>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="font-semibold mb-2 text-sm text-foreground">Interests</p>
                <div className="flex flex-wrap justify-center gap-2">
                {student.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                ))}
                </div>
            </CardContent>
            <CardFooter className="justify-center">
                <Button variant="outline" size="sm" disabled>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
            </CardFooter>
            </Card>
        ))}
        </div>
      </main>
    </SidebarInset>
  );
}
