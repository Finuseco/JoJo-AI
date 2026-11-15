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
} from "@/components/ui/alert-dialog";
import { useAlertDialog } from '@/hooks/use-alert-dialog';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  error: <XCircle className="h-6 w-6 text-red-500" />,
  warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
  info: <Info className="h-6 w-6 text-blue-500" />,
  destructive: <AlertTriangle className="h-6 w-6 text-red-500" />,
};

export function AlertDialogProvider() {
  const { isOpen, title, description, variant, closeAlert, showCancel, cancelText, confirmText } = useAlertDialog();

  const handleConfirm = () => {
    closeAlert(true);
  };

  const handleCancel = () => {
    closeAlert(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center justify-center sm:justify-start">
             <span className="mr-2">{icons[variant]}</span>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {showCancel && <AlertDialogCancel onClick={handleCancel}>{cancelText}</AlertDialogCancel>}
          <AlertDialogAction onClick={handleConfirm} className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}