
'use client'

import React, { useState, useEffect } from 'react';
import { Bell, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp, limit } from 'firebase/firestore';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

type Notification = {
  id: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
  link: string;
  type: string;
};

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const notifs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }, 
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: 'notifications',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [isLoggedIn]);

  const handleMarkAsRead = async (id: string) => {
    if (!isLoggedIn) return;
    const notifRef = doc(db, "notifications", id);
    updateDoc(notifRef, { read: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: notifRef.path,
            operation: 'update',
            requestResourceData: { read: true }
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const handleMarkAllAsRead = async () => {
    if (!isLoggedIn) return;
    notifications.forEach(async (n) => {
      if (!n.read) {
        await handleMarkAsRead(n.id);
      }
    })
  }

  if (!isLoggedIn) {
      return (
         <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Open notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="text-center text-muted-foreground p-8">
                    <Zap className="mx-auto h-8 w-8 mb-2"/>
                    <p>Please log in to see notifications.</p>
                </div>
            </PopoverContent>
         </Popover>
      );
  }


  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
                <Button variant="link" size="sm" onClick={handleMarkAllAsRead} className="p-0 h-auto">Mark all as read</Button>
            )}
        </div>
        <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
                notifications.map((n) => (
                    <div key={n.id} className={`p-4 border-b last:border-b-0 ${!n.read ? 'bg-accent/50' : ''}`}>
                        <Link href={n.link || '#'} passHref>
                            <a className="block hover:bg-muted/50 -m-4 p-4" onClick={() => handleMarkAsRead(n.id)}>
                                <p className="text-sm mb-1">{n.message}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true })}
                                </p>
                            </a>
                        </Link>
                    </div>
                ))
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    <Zap className="mx-auto h-8 w-8 mb-2"/>
                    <p>No new notifications.</p>
                </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
