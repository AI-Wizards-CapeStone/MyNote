"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Cover } from "@/components/shared/cover";
import { Toolbar } from "@/components/shared/toolbox";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@nextui-org/dropdown";
import { useEdgeStore } from "@/lib/edgestore";
import PDFViewer from "@/components/shared/pdf-viewer";

type Props = {
  params: {
    documentId: Id<"documents">;
  };
};
export default function Document({ params: { documentId } }: Props) {
  const [showPDFPopup, setShowPDFPopup] = useState(false);
  const Editor = useMemo(
    () =>
      dynamic(() => import("@/components/shared/editor"), {
        ssr: false,
      }),
    []
  );

  const update = useMutation(api.documents.update);
  const document = useQuery(api.documents.getById, {
    documentId,
  });

  const onChange = (content: string) => {
    update({
      id: documentId,
      content,
    });
  };

  const [newContent, setNewContent] = useState<string | null>(null);

  useEffect(() => {
    if (newContent !== null) {
      const timeout = setTimeout(() => {
        setNewContent(null); // Reset newContent after it's been used
      }, 1000); // Set a timeout to ensure it's cleared after a delay
      return () => clearTimeout(timeout); // Cleanup function
    }
  }, [newContent]);

  const handleAddContent = (generatedText: string) => {
    setNewContent(generatedText); // Example content to add
  };

  const { edgestore } = useEdgeStore();
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null | undefined>(null); // State to hold the URL of the PDF file

  const handlePDFEmbedded = async (event: any) => {
    try {
      const selectedFile = event.target.files[0]; // Get the selected file
      if (!selectedFile) {
        console.error("No file selected");
        return;
      }

      // Assuming you have a function to upload the file to your server
      const url = await uploadPDF(selectedFile); // Function to upload the file
      console.log("PDF uploaded successfully:", url);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      return null;
    }
  };

  const uploadPDF = async (file: any) => {
    try {
      // Assuming you have a function to upload the file to your server
      const response = await edgestore.publicFiles.upload({ file });
      // Assuming server returns the URL of the uploaded PDF
      const url = response.url;
      return url;
    } catch (error: any) {
      throw new Error("Error uploading PDF:", error);
    }
  };

  const hadleAddTestContent = () => {
    setNewContent(pdfUrl ?? null); // Example content to add
  };

  if (document === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) {
    return <div>Not found...</div>;
  }

  const handleAddPDF = () => {
    setShowPDFPopup(true);
  };
  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    // Handle the selected file, e.g., upload or process it
    console.log("Selected file:", file);
    setShowPDFPopup(false); // Close the popup after file selection
  };

  return (
    <div className="pb-40 relative">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <Dropdown backdrop="blur">
          <DropdownTrigger>
            <Button variant="outline">Open Menu</Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Static Actions">
            <DropdownItem key="new" onClick={hadleAddTestContent}>
              Add Content
            </DropdownItem>
            <DropdownItem key="pdf" onClick={handleAddPDF}>
              Add PDF
            </DropdownItem>
            <DropdownItem key="copy">Copy link</DropdownItem>
            <DropdownItem key="edit">Edit file</DropdownItem>
            <DropdownItem key="delete" className="text-danger" color="danger">
              Delete file
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      <Cover url={document.coverImage} />
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <Toolbar initialData={document} onAddContent={handleAddContent} />
        <Editor
          onChange={onChange}
          initialContent={document.content}
          newContent={newContent || undefined}
        />
        {showPDFPopup && (
          <div className="pdf-popup">
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePDFEmbedded}
            />
            <button onClick={() => setShowPDFPopup(false)}>Cancel</button>
          </div>
        )}
        <iframe
          src={pdfUrl}
          title="PDF Viewer"
          width="100%"
          height="500px"
        ></iframe>
      </div>
    </div>
  );
}
