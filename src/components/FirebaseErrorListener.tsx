
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error(
        'Firestore Permission Error:',
        JSON.stringify(error.context, null, 2)
      );

      // In a real app, you might use a toast or other UI to notify the user.
      // For this debugging environment, we will throw to show the Next.js overlay.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        // In production, you might want to show a generic toast.
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'You do not have permission to perform this action.',
        });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component does not render anything
}
