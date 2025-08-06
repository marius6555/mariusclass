
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Link as ScrollLink } from "react-scroll";
import { GraduationCap, Home, Users, FolderKanban, CalendarClock, BookCopy, Mail, LogIn, Shield, Menu } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import type { Student } from '@/types';

const baseLinks = [
  { to: "home", label: "Home", icon: Home },
  { href: "/auth", label: "Login/Sign Up", icon: LogIn, isExternal: true },
  { to: "students", label: "Student Profiles", icon: Users },
  { to: "projects", label: "Project Hub", icon: FolderKanban },
  { to: "events", label: "Events/Updates", icon: CalendarClock },
  { to: "resources", label: "Resources", icon: BookCopy },
  { to: "contact", label: "Contact", icon: Mail },
];

const adminLink = { href: "/admin", label: "Admin", icon: Shield, isExternal: true };

const ADMIN_EMAIL = "tingiya730@gmail.com";

export function AppHeader() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, [pathname]); // Rerun on route change to update login status

  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  
  const navLinks = [...baseLinks];
  if(isAdmin) {
    const contactIndex = navLinks.findIndex(link => link.to === 'contact');
    if (contactIndex !== -1) {
        navLinks.splice(contactIndex + 1, 0, adminLink);
    } else {
        navLinks.push(adminLink);
    }
  }

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };
  
  const NavLink = ({ link }: { link: typeof baseLinks[0] | typeof adminLink }) => {
    if (link.isExternal) {
      return (
        <Link href={link.href!} passHref>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLinkClick}>
            <link.icon className="h-4 w-4" />
            {link.label}
          </Button>
        </Link>
      );
    }
    
    return (
      <ScrollLink
        to={link.to!}
        smooth={true}
        duration={500}
        spy={true}
        offset={-60} // Adjust for header height
        onClick={handleLinkClick}
        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
      >
        <link.icon className="h-4 w-4" />
        {link.label}
      </ScrollLink>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 bg-background/80 backdrop-blur-sm border-b">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-primary p-2 rounded-lg">
          <GraduationCap className="text-primary-foreground h-5 w-5" />
        </div>
        <h1 className="font-headline text-xl font-semibold hidden sm:block">ClassHub</h1>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="p-4">
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <NavLink key={link.to || link.href} link={link} />
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
