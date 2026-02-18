import { useState } from 'react';
import { useGetAllContactFormSubmissions, useDeleteContactFormSubmission } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ContactRequestsTab() {
  const { data: submissions = [], isLoading } = useGetAllContactFormSubmissions();
  const deleteSubmission = useDeleteContactFormSubmission();
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  // Sort submissions by date (newest first)
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const timeA = Number(a.timestamp);
    const timeB = Number(b.timestamp);
    return timeB - timeA;
  });

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    if (deleteId !== null) {
      await deleteSubmission.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sortedSubmissions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Нет заявок</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Имя</TableHead>
              <TableHead className="w-[150px]">Телефон</TableHead>
              <TableHead>Комментарий</TableHead>
              <TableHead className="w-[180px]">Дата и время</TableHead>
              <TableHead className="w-[80px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSubmissions.map((submission) => (
              <TableRow key={submission.id.toString()}>
                <TableCell className="font-medium">{submission.name}</TableCell>
                <TableCell>{submission.phone}</TableCell>
                <TableCell className="max-w-md truncate">{submission.comment || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(submission.timestamp)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(submission.id)}
                    disabled={deleteSubmission.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile-friendly view for smaller screens */}
      <div className="md:hidden space-y-4 mt-4">
        {sortedSubmissions.map((submission) => (
          <div key={submission.id.toString()} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <p className="font-semibold">{submission.name}</p>
                <p className="text-sm text-muted-foreground">{submission.phone}</p>
                <p className="text-sm">{submission.comment || '—'}</p>
                <p className="text-xs text-muted-foreground">{formatDate(submission.timestamp)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(submission.id)}
                disabled={deleteSubmission.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Заявка будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

