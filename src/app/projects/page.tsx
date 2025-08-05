
'use client'

import React, { useState, useEffect } from 'react';
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExternalLink, PlusCircle, Edit } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, doc, updateDoc, query } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types';

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  category: z.string().min(2, "Category must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  link: z.string().url("Please enter a valid URL."),
  image: z.string().url("Please enter a valid image URL.").optional().or(z.literal('')),
  tags: z.string().min(2, "Please list at least one tag."),
});

type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  link: string;
  image: string;
  tags: string[];
  hint: string;
  author: string;
};

const categories = ["All", "AI", "Web Dev", "Mobile", "Data Science", "Cybersecurity"];

function ProjectForm({ project, onSave, onOpenChange, author }: { project?: Project | null, onSave: (data: any, projectId?: string) => void, onOpenChange: (open: boolean) => void, author: string }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project?.title || "",
      category: project?.category || "",
      description: project?.description || "",
      link: project?.link || "",
      image: project?.image || "",
      tags: project?.tags?.join(", ") || "",
    },
  });

  useEffect(() => {
    form.reset({
      title: project?.title || "",
      category: project?.category || "",
      description: project?.description || "",
      link: project?.link || "",
      image: project?.image || "",
      tags: project?.tags?.join(", ") || "",
    });
  }, [project, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Validate if the image URL is a valid URL, otherwise use a placeholder.
      let imageUrl = "https://placehold.co/600x400.png";
      try {
        if (values.image) {
          new URL(values.image);
          imageUrl = values.image;
        }
      } catch (e) {
        // Keep placeholder if URL is invalid
        console.warn("Invalid image URL provided, using placeholder.");
      }

      const projectData = {
        title: values.title,
        category: values.category,
        description: values.description,
        link: values.link,
        image: imageUrl,
        tags: values.tags.split(",").map(t => t.trim()),
        hint: 'abstract',
        author: project?.author || author,
      };
      onSave(projectData, project?.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving project: ", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Project Title</FormLabel><FormControl><Input placeholder="AI-Powered Chatbot" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="AI" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A chatbot using NLP..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="link" render={({ field }) => (
          <FormItem><FormLabel>Project URL</FormLabel><FormControl><Input placeholder="https://github.com/user/project" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="image" render={({ field }) => (
          <FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input placeholder="https://placehold.co/600x400.png" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="tags" render={({ field }) => (
          <FormItem><FormLabel>Tags (comma-separated)</FormLabel><FormControl><Input placeholder="Python, NLTK, Flask" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full">{project ? "Save Changes" : "Add Project"}</Button>
      </form>
    </Form>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(query(collection(db, "projects")));
      const projectsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsList);
    } catch (e) {
      console.error("Error fetching projects: ", e);
    }
  };

  useEffect(() => {
    fetchProjects();
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  const onSave = async (data: any, projectId?: string) => {
    try {
      if (projectId) {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, data);
        toast({ title: "Project Updated!", description: "Your project has been successfully updated." });
      } else {
        await addDoc(collection(db, "projects"), data);
        toast({ title: "Project Added!", description: "Your project has been added to the hub." });
      }
      fetchProjects();
      setIsDialogOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Error saving project:", error);
      toast({ variant: "destructive", title: "Save failed", description: "There was an issue saving your project."});
    }
  };
  
  const handleAddClick = () => {
      setEditingProject(null);
      setIsDialogOpen(true);
  };
  
  const handleEditClick = (project: Project) => {
      setEditingProject(project);
      setIsDialogOpen(true);
  };

  return (
    <SidebarInset>
      <PageHeader
        title="Project Hub"
        description="Discover innovative projects by students."
      />
      <main className="p-6 lg:p-8">
        <div className="flex justify-end mb-6">
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingProject(null); }}>
              <DialogTrigger asChild>
                 <Button onClick={handleAddClick} disabled={!currentUser}>
                    <PlusCircle className="mr-2"/> Add Project
                 </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProject ? "Edit Your Project" : "Add Your Project"}</DialogTitle>
                </DialogHeader>
                {currentUser ? (
                    <ProjectForm 
                        project={editingProject} 
                        onSave={onSave} 
                        onOpenChange={setIsDialogOpen} 
                        author={currentUser.name} 
                    />
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                        <p>Please log in to add a project.</p>
                        <Link href="/auth" className="mt-2 inline-block">
                            <Button>Login</Button>
                        </Link>
                    </div>
                )}
              </DialogContent>
            </Dialog>
        </div>
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
                    <Card key={project.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="aspect-video relative">
                        <Image src={project.image || 'https://placehold.co/600x400.png'} alt={project.title} fill className="object-cover" data-ai-hint={project.hint} />
                      </div>
                      <CardHeader>
                        <CardTitle className="font-headline">{project.title}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                         <p className="text-xs text-muted-foreground mt-4">By: {project.author}</p>
                      </CardContent>
                      <CardFooter className="flex items-center gap-2">
                        <Link href={project.link} target="_blank" className="w-full">
                          <Button className="w-full bg-primary hover:bg-primary/90">
                            View Project <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        {currentUser?.name === project.author && (
                            <Button variant="outline" size="icon" onClick={() => handleEditClick(project)}>
                                <Edit className="h-4 w-4"/>
                                <span className="sr-only">Edit Project</span>
                            </Button>
                        )}
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
