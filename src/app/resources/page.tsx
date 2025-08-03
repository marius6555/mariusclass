import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download, Link as LinkIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

const resources = {
  "Study Guides": [
    { title: "Midterm Study Guide", type: "file", href: "#" },
    { title: "Final Exam Review Sheet", type: "file", href: "#" },
    { title: "Key Concepts Summary", type: "file", href: "#" },
  ],
  "Lecture Notes": [
    { title: "Week 1-3 Slides", type: "file", href: "#" },
    { title: "Week 4-6 Slides", type: "file", href: "#" },
    { title: "Guest Lecture Notes", type: "file", href: "#" },
  ],
  "Useful Links": [
    { title: "Official Documentation", type: "link", href: "#" },
    { title: "Online Coding Tutorials", type: "link", href: "#" },
    { title: "Design Pattern Examples", type: "link", href: "#" },
  ],
};

export default function ResourcesPage() {
  return (
    <SidebarInset>
      <PageHeader
        title="Resources"
        description="A curated collection of study materials and helpful links."
      />
      <main className="p-6 lg:p-8">
        <Accordion type="single" collapsible defaultValue="Study Guides" className="w-full space-y-4">
          {Object.entries(resources).map(([category, items]) => (
            <AccordionItem value={category} key={category} className="border-none">
              <Card>
                <AccordionTrigger className="p-6 font-headline text-xl hover:no-underline">
                  {category}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-6">
                    <ul className="space-y-4">
                      {items.map((item) => (
                        <li key={item.title} className="flex items-center justify-between p-4 rounded-lg border bg-background">
                          <span className="font-medium">{item.title}</span>
                          <Link href={item.href} passHref legacyBehavior>
                             <Button variant="ghost" size="icon" asChild>
                                <a target="_blank">
                                  {item.type === 'file' ? <Download /> : <LinkIcon />}
                                  <span className="sr-only">{item.type === 'file' ? 'Download' : 'Open link'}</span>
                                </a>
                            </Button>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
    </SidebarInset>
  );
}
