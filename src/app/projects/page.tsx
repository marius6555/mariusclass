'use client'

import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const projects = [
  { title: "AI-Powered Chatbot", category: "AI", description: "A chatbot using NLP to answer student queries about the course.", link: "#", image: "https://placehold.co/600x400.png", hint: "robot abstract", tags: ["Python", "NLTK", "Flask"] },
  { title: "E-commerce Website", category: "Web Dev", description: "A full-stack e-commerce platform for selling course merchandise.", link: "#", image: "https://placehold.co/600x400.png", hint: "shopping cart", tags: ["React", "Node.js", "MongoDB"] },
  { title: "Mobile Fitness Tracker", category: "Mobile", description: "An iOS/Android app to track workouts and nutrition.", link: "#", image: "https://placehold.co/600x400.png", hint: "mobile phone", tags: ["React Native", "Firebase"] },
  { title: "Data Visualization Dashboard", category: "Data Science", description: "An interactive dashboard visualizing student performance data.", link: "#", image: "https://placehold.co/600x400.png", hint: "charts graphs", tags: ["D3.js", "Tableau"] },
  { title: "Secure File Sharing System", category: "Cybersecurity", description: "A system for encrypted file sharing and storage.", link: "#", image: "https://placehold.co/600x400.png", hint: "lock security", tags: ["Cryptography", "Go"] },
  { title: "Campus Navigation App", category: "Mobile", description: "A mobile app providing indoor navigation for the university campus.", link: "#", image: "https://placehold.co/600x400.png", hint: "map navigation", tags: ["Swift", "ARKit"] },
];

const categories = ["All", "AI", "Web Dev", "Mobile", "Data Science", "Cybersecurity"];

export default function ProjectsPage() {
  return (
    <SidebarInset>
      <PageHeader
        title="Project Hub"
        description="Discover innovative projects by students."
      />
      <main className="p-6 lg:p-8">
        <Tabs defaultValue="All" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects
                  .filter((p) => category === "All" || p.category === category)
                  .map((project) => (
                    <Card key={project.title} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="aspect-video relative">
                        <Image src={project.image} alt={project.title} fill className="object-cover" data-ai-hint={project.hint} />
                      </div>
                      <CardHeader>
                        <CardTitle className="font-headline">{project.title}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Link href={project.link} target="_blank" className="w-full">
                          <Button className="w-full bg-primary hover:bg-primary/90">
                            View Project <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </SidebarInset>
  );
}
