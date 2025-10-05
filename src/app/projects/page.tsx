
'use client'

import React, { useState, useEffect } from 'react';
import { ExternalLink, PlusCircle, Trash2, Edit } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { doc, collection, getDocs, query, updateDoc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

// Common types
export type Project = {
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

const ADMIN_EMAIL = "tingiya730@gmail.com";

// Projects Section
const projectFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  category: z.string().min(2, "Category must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  link: z.string().url("Please enter a valid URL."),
  image: z.any().optional(),
  tags: z.string().min(2, "Please list at least one tag."),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const projectCategories = ["All", "AI", "Web Dev", "Mobile", "Data Science", "Cybersecurity"];

function ProjectForm({ project, onSave, onOpenChange, author }: { project: Project | null, onSave: (data: any, projectId?: string) => void, onOpenChange: (open: boolean) => void, author: string }) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project?.title || "",
      category: project?.category || "",
      description: project?.description || "",
      link: project?.link || "",
      image: null,
      tags: project?.tags?.join(', ') || "",
    },
  });
  const [imageName, setImageName] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageName(file.name);
        form.setValue("image", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (values: ProjectFormValues) => {
    const projectData = {
      title: values.title,
      category: values.category,
      description: values.description,
      link: values.link,
      tags: values.tags.split(",").map(t => t.trim()),
      hint: 'abstract',
      author: project?.author || author,
      image: form.getValues("image"),
    };

    onSave(projectData, project?.id);
    onOpenChange(false);
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
          <FormItem><FormLabel>Project URL</FormLabel><FormControl><Input placeholder="https://github.com/user/project" {...field} /></FormControl><FormMessage /></FormMessage /></FormItem>
        )} />
        <FormItem>
            <FormLabel>Project Image</FormLabel>
            <FormControl>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
            </FormControl>
            {imageName && <p className="text-sm text-muted-foreground mt-2">{imageName}</p>}
            <FormMessage />
        </FormItem>
        <FormField control={form.control} name="tags" render={({ field }) => (
          <FormItem><FormLabel>Tags (comma-separated)</FormLabel><FormControl><Input placeholder="Python, NLTK, Flask" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full">{project ? 'Save Changes' : 'Add Project'}</Button>
      </form>
    </Form>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(query(collection(db, "projects")));
      const projectsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsList);
    } catch (e) {
        const permissionError = new FirestorePermissionError({ path: 'projects', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
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
        const isEditing = !!projectId;
        let imageUrl = data.image;
        let projectDocRef;

        if (isEditing) {
            projectDocRef = doc(db, "projects", projectId!);
        } else {
            projectDocRef = doc(collection(db, "projects"));
        }

        if (data.image && data.image.startsWith('data:image')) {
            const storageRef = ref(storage, `projects/${projectDocRef.id}`);
            await uploadString(storageRef, data.image, 'data_url');
            imageUrl = await getDownloadURL(storageRef);
        } else if (isEditing) {
            const existingProject = projects.find(p => p.id === projectId);
            imageUrl = existingProject?.image;
        }

        const finalProjectData = { ...data, image: imageUrl || "https://placehold.co/600x400.png" };

        if (isEditing) {
            await updateDoc(projectDocRef, finalProjectData).catch(serverError => {
                const permissionError = new FirestorePermissionError({ path: projectDocRef.path, operation: 'update', requestResourceData: finalProjectData });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            toast({ title: "Project Updated!", description: "Your project has been successfully updated." });
        } else {
             await setDoc(projectDocRef, finalProjectData).catch(serverError => {
                const permissionError = new FirestorePermissionError({ path: projectDocRef.path, operation: 'create', requestResourceData: finalProjectData });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });

            const notificationData = {
                message: `New project added: "${data.title}" by ${data.author}`,
                type: 'new_project',
                link: `/projects#${projectDocRef.id}`,
                createdAt: serverTimestamp(),
                read: false,
            };
            addDoc(collection(db, "notifications"), notificationData).catch(serverError => {
                const permissionError = new FirestorePermissionError({ path: 'notifications', operation: 'create', requestResourceData: notificationData });
                errorEmitter.emit('permission-error', permissionError);
            });
            toast({ title: "Project Added!", description: "Your project has been added to the hub." });
        }

        fetchProjects();
        handleCloseDialog();
    } catch (error) {
        if (!(error instanceof FirestorePermissionError)) {
            toast({ variant: "destructive", title: "Save failed", description: "There was an issue saving your project." });
        }
    }
};
  
  const handleDeleteProject = async (projectId: string) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        await deleteDoc(projectRef).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: projectRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
        toast({ title: "Project Deleted", description: "The project has been removed." });
        fetchProjects();
    } catch(error) {
        if (!(error instanceof FirestorePermissionError)) {
            toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the project." });
        }
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
  
  const handleCloseDialog = () => {
    setEditingProject(null);
    setIsDialogOpen(false);
  };

  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  
  return (
      <main className="container mx-auto p-6 lg:p-8 pt-24">
        <PageHeader
          title="Project Hub"
          description="Discover innovative projects by students."
        />
        <div className="flex justify-end my-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                 <Button onClick={handleAddClick} disabled={!currentUser}>
                    <PlusCircle className="mr-2"/> Add Project
                 </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Edit Project' : 'Add Your Project'}</DialogTitle>
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
            {projectCategories.map((category) => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          {projectCategories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects
                  .filter((p) => category === "All" || p.category === category)
                  .map((project) => (
                    <Card key={project.id} id={project.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="aspect-video relative">
                        <img 
                          src={project.image || 'https://placehold.co/600x400.png'} 
                          alt={project.title} 
                          className="object-cover w-full h-full" 
                          data-ai-hint={project.hint} 
                        />
                         {(isAdmin || currentUser?.name === project.author) && (
                            <div className="absolute top-2 right-2 flex gap-2">
                                <Button size="icon" variant="secondary" onClick={() => handleEditClick(project)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the project. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
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
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
  );
}
