import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const students = [
  { name: "Alice Johnson", major: "Computer Science", interests: ["AI", "Web Dev", "UX Design"], avatar: "https://placehold.co/100x100.png", initials: "AJ", hint: "woman face" },
  { name: "Bob Williams", major: "Data Science", interests: ["Machine Learning", "Statistics"], avatar: "https://placehold.co/100x100.png", initials: "BW", hint: "man portrait" },
  { name: "Charlie Brown", major: "Software Engineering", interests: ["Mobile Apps", "Game Dev"], avatar: "https://placehold.co/100x100.png", initials: "CB", hint: "person smiling" },
  { name: "Diana Miller", major: "Cybersecurity", interests: ["Networking", "Ethical Hacking"], avatar: "https://placehold.co/100x100.png", initials: "DM", hint: "woman smiling" },
  { name: "Ethan Davis", major: "Computer Science", interests: ["Cloud Computing", "DevOps"], avatar: "https://placehold.co/100x100.png", initials: "ED", hint: "man face" },
  { name: "Fiona Garcia", major: "Information Systems", interests: ["Project Management", "UI/UX"], avatar: "https://placehold.co/100x100.png", initials: "FG", hint: "person portrait" },
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
            <Card key={student.name} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="items-center">
                <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
                  <AvatarImage src={student.avatar} alt={student.name} data-ai-hint={student.hint} />
                  <AvatarFallback>{student.initials}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline">{student.name}</CardTitle>
                <p className="text-muted-foreground">{student.major}</p>
              </CardHeader>
              <CardContent>
                <p className="font-semibold mb-2 text-sm text-foreground">Interests</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {student.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </SidebarInset>
  );
}
