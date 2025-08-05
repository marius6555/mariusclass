
'use client'

import React, { useState, useEffect } from 'react';
import { SidebarInset } from "@/components/ui/sidebar";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { PageHeader } from '@/components/page-header';
import { Chatbot } from '@/components/chatbot';

export default function Home() {
  const [backgroundUrl, setBackgroundUrl] = useState('https://placehold.co/1200x800.png');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "homePage"));
        if (settingsDoc.exists() && settingsDoc.data().backgroundUrl) {
          setBackgroundUrl(settingsDoc.data().backgroundUrl);
        }
      } catch (error) {
        console.error("Error fetching background image:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBackground();
  }, []);


  return (
    <SidebarInset>
        <PageHeader 
            title="Home"
            description="Welcome to ClassHub Central"
        />
        <main className="flex-1">
            <div className="relative flex flex-col justify-center items-center text-center p-8 h-[calc(100vh-200px)]">
                <div className="absolute inset-0 z-0">
                    {!loading && (
                        <Image 
                            src={backgroundUrl} 
                            alt="Classroom background"
                            fill
                            className="object-cover"
                            data-ai-hint="classroom abstract"
                            priority
                        />
                    )}
                    <div className="absolute inset-0 bg-background/80" />
                </div>
                <div className="relative z-10">
                  <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight">Welcome to</h1>
                  <div className="bg-primary p-4 rounded-lg my-6 inline-block">
                    <GraduationCap className="text-primary-foreground h-16 w-16" />
                  </div>
                  <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tight">ClassHub Central</h2>
                  <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">Your central hub for class activities, resources, and collaboration.</p>
                </div>
            </div>
        </main>
        <Chatbot />
    </SidebarInset>
  );
}
