import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Bell, Calendar, Milestone } from "lucide-react";

const events = [
  { date: "2024-12-10", title: "Final Project Presentations", type: "event", description: "Showcase your hard work to the class." },
  { date: "2024-11-01", title: "Final Project Check-in", type: "deadline", description: "Meet with TAs to discuss your final project progress." },
  { date: "2024-10-10", title: "Hackathon Kick-off", type: "event", description: "Join the annual department hackathon. Prizes to be won!" },
  { date: "2024-10-05", title: "Midterm Exams", type: "deadline", description: "Midterm exams will be held during the class session." },
  { date: "2024-09-20", title: "Guest Lecture: AI in Healthcare", type: "event", description: "Dr. Eva Rostova will be joining us for a special lecture." },
  { date: "2024-09-15", title: "Project Proposals Due", type: "deadline", description: "Submit your project proposals by 11:59 PM." },
  { date: "2024-09-01", title: "First Day of Classes", type: "announcement", description: "Welcome back! Let's have a great semester." },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const eventConfig: { [key: string]: { icon: React.ReactNode; variant: BadgeProps['variant'] } } = {
  event: { icon: <Calendar className="h-4 w-4" />, variant: 'default' },
  deadline: { icon: <Bell className="h-4 w-4" />, variant: 'destructive' },
  announcement: { icon: <Milestone className="h-4 w-4" />, variant: 'secondary' },
};


export default function EventsPage() {
  return (
    <SidebarInset>
      <PageHeader
        title="Events & Updates"
        description="Stay informed about important dates, announcements, and deadlines."
      />
      <main className="p-6 lg:p-8">
        <div className="relative pl-6">
          <div className="absolute left-3 top-0 h-full w-0.5 bg-border -translate-x-1/2" />
          {events.map((event, index) => (
            <div key={index} className="relative mb-8 flex items-start gap-6">
              <div className="absolute left-3 top-1.5 flex -translate-x-1/2 items-center justify-center rounded-full bg-background p-0.5">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${event.type === 'deadline' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {eventConfig[event.type]?.icon || <Calendar className="h-4 w-4" />}
                </div>
              </div>
              <div className="ml-10 w-full">
                <div className="flex items-center gap-4 mb-1">
                  <h3 className="font-headline text-lg font-semibold">{event.title}</h3>
                  <Badge variant={eventConfig[event.type]?.variant || 'default'} className="capitalize">{event.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {new Date(event.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-foreground">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </SidebarInset>
  );
}
