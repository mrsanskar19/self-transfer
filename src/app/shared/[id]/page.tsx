
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileIcon, Download, AlertCircle, ShieldX } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/lib/types';

export default function SharedFilePage() {
  const { id: fileId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [fileData, setFileData] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setError("No file ID provided.");
      setIsLoading(false);
      return;
    }
    
    const fetchFile = async () => {
      try {
        const response = await fetch(`/api/messages/${fileId}`);
        if(response.status === 404) {
          setError("File not found. It may have been deleted or the link is incorrect.");
        } else if (response.ok) {
          const file: Message = await response.json();
           const oneHour = 60 * 60 * 1000;
          if (Date.now() - new Date(file.uploadedAt).getTime() > oneHour) {
            setError("This file has expired and is no longer available.");
            // Proactively delete if expired
            await fetch(`/api/messages/${fileId}`, { method: 'DELETE' });
          } else {
            setFileData(file);
          }
        } else {
           throw new Error("Failed to fetch file");
        }
      } catch (e) {
        setError("Invalid share link or error fetching file.");
        console.error("Error decoding or finding file:", e);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFile();

  }, [fileId]);

  const handleDownload = async () => {
    if (!fileData || !fileData.url || !fileData.name) return;

    const link = document.createElement('a');
    link.href = fileData.url;
    link.setAttribute('download', fileData.name);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    
    toast({ title: "Downloaded", description: "File downloaded. It has now been deleted from the vault." });

    // Delete the file from backend
    try {
      await fetch(`/api/messages/${fileId}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Failed to delete file from backend", e);
    }
    
    // Show a message and then redirect
    setError("This link is now invalid. You will be redirected.");
    setTimeout(() => {
      router.push('/');
    }, 3000);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Ephemeral Vault</CardTitle>
          <CardDescription className="text-center">You have received a temporary file.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <ShieldX className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : fileData ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg flex items-center gap-4">
                <FileIcon className="h-8 w-8 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{fileData.name}</p>
                  <p className="text-xs text-muted-foreground">
                     Expires: {new Date(new Date(fileData.uploadedAt).getTime() + 60 * 60 * 1000).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  This file will be permanently deleted from the vault after you download it.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={handleDownload}>
                <Download className="mr-2" />
                Download and Invalidate Link
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
