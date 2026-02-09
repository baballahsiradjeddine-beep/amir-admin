'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isDeleting: boolean;
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    isDeleting,
}: DeleteConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-right flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-right">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse sm:justify-start gap-2">
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="gap-2"
                    >
                        {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isDeleting ? 'جاري الحذف...' : 'حذف نهائي'}
                    </Button>
                    <AlertDialogCancel disabled={isDeleting} className="mt-0">
                        إلغاء
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
