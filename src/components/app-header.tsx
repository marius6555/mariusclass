
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Link as ScrollLink } from "react-scroll";
import { GraduationCap, Home, Users, FolderKanban, CalendarClock, BookCopy, Mail, LogIn, LogOut, Shield, Menu } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import type { Student } from '@/types';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Notifications } from './notifications';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const baseLinks = [
  { to: "home", label: "Home", icon: Home },
  { to: "students", label: "Student Profiles", icon: Users },
  { to: "projects", label: "Project Hub", icon: FolderKanban },
  { to: "events", label: "Events/Updates", icon: CalendarClock },
  { to: "resources", label: "Resources", icon: BookCopy },
  { to: "contact", label: "Contact", icon: Mail },
];

const authLink = { href: "/auth", label: "Login/Sign Up", icon: LogIn, isExternal: true };
const adminLink = { href: "/admin", label: "Admin", icon: Shield, isExternal: true };

const ADMIN_EMAIL = "tingiya730@gmail.com";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setCurrentUser(null);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("currentUser");
      setCurrentUser(null);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      handleLinkClick();
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    }
  };

  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  
  const getNavLinks = () => {
    let links: (typeof baseLinks[0] | typeof adminLink | { onClick: () => void, label: string, icon: any })[] = [...baseLinks];
    
    if (currentUser) {
      if (isAdmin) {
        const contactIndex = links.findIndex(link => 'to' in link && link.to === 'contact');
        if (contactIndex !== -1) {
            links.splice(contactIndex + 1, 0, adminLink);
        } else {
            links.push(adminLink);
        }
      }
      links.push({ onClick: handleLogout, label: 'Logout', icon: LogOut });
    } else {
      links.splice(1, 0, authLink);
    }
    
    return links;
  };
  
  const navLinks = getNavLinks();

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };
  
  const NavLink = ({ link }: { link: any }) => {
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
    
    if (link.onClick) {
        return (
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={link.onClick}>
              <link.icon className="h-4 w-4" />
              {link.label}
            </Button>
        )
    }

    return (
      <ScrollLink
        to={link.to!}
        smooth={true}
        duration={500}
        spy={true}
        offset={-60}
        onClick={handleLinkClick}
        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
        activeClass="bg-accent"
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
      <div className="flex items-center gap-4">
        {currentUser && (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    {currentUser.avatar && <AvatarImage src={currentUser.avatar} alt={currentUser.name} />}
                    <AvatarFallback>{currentUser.initials || currentUser.name?.substring(0,2)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:inline">{currentUser.name}</span>
            </div>
        )}
        <div className="flex items-center gap-2">
            <Notifications />
            <ThemeToggle />
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                    <NavLink key={link.to || link.href || link.label} link={link} />
                    ))}
                </nav>
                </div>
            </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
