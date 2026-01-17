import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type ProcessingStep = "upload" | "extract" | "cleaning" | "chunking" | "processing" | "storing";

interface Document {
  id: string;
  name: string;
  file: File | null;
  status: "pending" | "processing" | "completed" | "error";
  currentStep: ProcessingStep | null;
  completedSteps: ProcessingStep[];
  stepData: {
    upload?: string; // PDF preview or file info
    extract?: string; // Extracted text from Tika
    cleaning?: string; // Cleaned text
    chunking?: string[]; // Array of chunks
    processing?: Array<{ user: string; assistant: string }>; // Processed chunks
    storing?: boolean; // Store result
  };
}

const Ingest = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expandedStep, setExpandedStep] = useState<string>("");

  const processingSteps: ProcessingStep[] = ["upload", "extract", "cleaning", "chunking", "processing", "storing"];

  const addDocument = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      name: `Document ${documents.length + 1}`,
      file: null,
      status: "pending",
      currentStep: null,
      completedSteps: [],
      stepData: {},
    };
    setDocuments((prev) => [...prev, newDoc]);
    toast.success("Document added. Click 'Upload' to start processing.");
  };

  const handleFileUpload = async (docId: string, file: File) => {
    if (!file || file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file");
      return;
    }

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              file,
              name: file.name,
              currentStep: "upload" as const,
              status: "processing" as const,
            }
          : doc
      )
    );

    // Create preview URL for the PDF
    const previewUrl = URL.createObjectURL(file);

    // Store file reference - actual S3 upload will happen during extract
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              completedSteps: ["upload"],
              currentStep: null,
              status: "pending" as const,
              stepData: {
                ...doc.stepData,
                upload: previewUrl,
              },
            }
          : doc
      )
    );
    toast.success("File ready for extraction");
  };

  const executeExtract = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc || !doc.file) {
      toast.error("No file uploaded");
      return;
    }

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, currentStep: "extract" as const, status: "processing" as const } : d))
    );

    try {
      // Upload file as base64 to backend along with ingest request
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          const base64Content = base64Data.split(',')[1]; // Remove data:application/pdf;base64, prefix

          const filename = `uploads/${Date.now()}_${doc.file!.name}`;

          // Call rag/ingest endpoint which will handle S3 upload and Tika extraction
          const response = await fetch('/api/my/rag/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: filename,
              fileContent: base64Content
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          const extractedText = data.output;

          setDocuments((prev) =>
            prev.map((d) =>
              d.id === docId
                ? {
                    ...d,
                    completedSteps: [...d.completedSteps, "extract"],
                    currentStep: null,
                    status: "pending" as const,
                    stepData: { ...d.stepData, extract: extractedText },
                  }
                : d
            )
          );
          toast.success("Text extracted successfully");
        } catch (error) {
          setDocuments((prev) =>
            prev.map((d) => (d.id === docId ? { ...d, currentStep: null, status: "error" as const } : d))
          );
          toast.error(error instanceof Error ? error.message : "Failed to extract text");
        }
      };

      reader.onerror = () => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, currentStep: null, status: "error" as const } : d))
        );
        toast.error("Failed to read file");
      };

      reader.readAsDataURL(doc.file);
    } catch (error) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, currentStep: null, status: "error" as const } : d))
      );
      toast.error(error instanceof Error ? error.message : "Failed to extract text");
    }
  };

  const executeCleaning = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc || !doc.stepData.extract) {
      toast.error("No extracted text available");
      return;
    }

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, currentStep: "cleaning" as const, status: "processing" as const } : d))
    );

    try {
      const response = await fetch('/api/my/rag/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: doc.stepData.extract }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const cleanedText = data.output;

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                completedSteps: [...d.completedSteps, "cleaning"],
                currentStep: null,
                status: "pending" as const,
                stepData: { ...d.stepData, cleaning: cleanedText },
              }
            : d
        )
      );
      toast.success("Document cleaned successfully");
    } catch (error) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, currentStep: null, status: "error" as const } : d))
      );
      toast.error(error instanceof Error ? error.message : "Failed to clean document");
    }
  };

  const executeChunking = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc || !doc.stepData.cleaning) {
      toast.error("No cleaned text available");
      return;
    }

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, currentStep: "chunking" as const, status: "processing" as const } : d))
    );

    try {
      const response = await fetch('/api/my/rag/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: doc.stepData.cleaning }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const chunks = data.output;

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                completedSteps: [...d.completedSteps, "chunking"],
                currentStep: null,
                status: "pending" as const,
                stepData: { ...d.stepData, chunking: chunks },
              }
            : d
        )
      );
      toast.success(`Document chunked into ${chunks.length} chunks`);
    } catch (error) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, currentStep: null, status: "error" as const } : d))
      );
      toast.error(error instanceof Error ? error.message : "Failed to chunk document");
    }
  };

  const executeProcessing = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc || !doc.stepData.chunking || doc.stepData.chunking.length === 0) {
      toast.error("No chunks available");
      return;
    }

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, currentStep: "processing" as const, status: "processing" as const } : d))
    );

    try {
      const processedChunks = [];

      for (const chunk of doc.stepData.chunking) {
        const response = await fetch('/api/my/rag/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: chunk }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        processedChunks.push(data);
      }

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                completedSteps: [...d.completedSteps, "processing"],
                currentStep: null,
                status: "pending" as const,
                stepData: { ...d.stepData, processing: processedChunks },
              }
            : d
        )
      );
      toast.success(`Processed ${processedChunks.length} chunks`);
    } catch (error) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, currentStep: null, status: "error" as const } : d))
      );
      toast.error(error instanceof Error ? error.message : "Failed to process chunks");
    }
  };

  const executeStoring = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc || !doc.stepData.processing) {
      toast.error("No processed chunks available");
      return;
    }

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, currentStep: "storing" as const, status: "processing" as const } : d))
    );

    try {
      const response = await fetch('/api/my/rag/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: doc.stepData.processing }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                completedSteps: [...d.completedSteps, "storing"],
                currentStep: null,
                status: "completed" as const,
                stepData: { ...d.stepData, storing: data.output },
              }
            : d
        )
      );
      toast.success("Document stored successfully");
    } catch (error) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, currentStep: null, status: "error" as const } : d))
      );
      toast.error(error instanceof Error ? error.message : "Failed to store document");
    }
  };

  const resetStepsAfter = (docId: string, clickedStep: ProcessingStep) => {
    const stepIndex = processingSteps.indexOf(clickedStep);
    const stepsToKeep = processingSteps.slice(0, stepIndex + 1);

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              completedSteps: doc.completedSteps.filter((s) => stepsToKeep.includes(s)),
              currentStep: null,
              status: "pending" as const,
            }
          : doc
      )
    );
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-xl font-semibold text-foreground">Document Ingestion</h1>
        <Button variant="outline" size="sm" onClick={() => navigate("/")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back to Chat
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Ingest Documents</h2>
              <p className="text-muted-foreground mt-1">
                Add and process documents through the ingestion pipeline.
              </p>
            </div>
            <Button onClick={addDocument} size="lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Add Document
            </Button>
          </div>

          {documents.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-4 text-muted-foreground"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p className="text-lg font-medium">No documents yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Add Document" to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-6 space-y-4 bg-card">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{doc.name}</h3>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        doc.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : doc.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <Accordion
                    type="single"
                    collapsible
                    value={expandedStep}
                    onValueChange={setExpandedStep}
                  >
                    {processingSteps.map((step) => {
                      const isCompleted = doc.completedSteps.includes(step);
                      const isCurrent = doc.currentStep === step;

                      return (
                        <AccordionItem key={step} value={`${doc.id}-${step}`}>
                          <AccordionTrigger
                            onClick={() => {
                              if (isCompleted) {
                                resetStepsAfter(doc.id, step);
                              }
                            }}
                            className={`px-4 ${
                              isCompleted
                                ? "text-green-600"
                                : isCurrent
                                ? "text-blue-600"
                                : "text-gray-600"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              {isCurrent && (
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              )}
                              <span className="capitalize text-base font-medium">{step}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4">
                            <div className="py-2 space-y-3">
                              {step === "upload" && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-3">Upload a PDF document to begin processing.</p>
                                  {!isCompleted && (
                                    <Input
                                      type="file"
                                      accept=".pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(doc.id, file);
                                      }}
                                      className="mb-2"
                                    />
                                  )}
                                  {isCompleted && doc.stepData.upload && (
                                    <div className="space-y-3">
                                      <div className="p-3 bg-muted rounded text-sm">
                                        <p className="font-semibold">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Size: {doc.file ? (doc.file.size / 1024).toFixed(2) : '0'} KB
                                        </p>
                                      </div>
                                      <div className="border rounded overflow-hidden">
                                        <iframe
                                          src={doc.stepData.upload}
                                          className="w-full h-96"
                                          title={`PDF Preview: ${doc.name}`}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {step === "extract" && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-3">Extract text from PDF using Tika server.</p>
                                  {!isCompleted && doc.completedSteps.includes("upload") && (
                                    <Button size="sm" onClick={() => executeExtract(doc.id)}>
                                      Extract Text
                                    </Button>
                                  )}
                                  {isCompleted && doc.stepData.extract && (
                                    <div className="p-3 bg-muted rounded text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                                      {doc.stepData.extract}
                                    </div>
                                  )}
                                </div>
                              )}
                              {step === "cleaning" && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-3">Clean the extracted text.</p>
                                  {!isCompleted && doc.completedSteps.includes("extract") && (
                                    <Button size="sm" onClick={() => executeCleaning(doc.id)}>
                                      Clean Document
                                    </Button>
                                  )}
                                  {isCompleted && doc.stepData.cleaning && (
                                    <div className="p-3 bg-muted rounded text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                                      {doc.stepData.cleaning}
                                    </div>
                                  )}
                                </div>
                              )}
                              {step === "chunking" && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-3">Split document into chunks with 100-token overlap.</p>
                                  {!isCompleted && doc.completedSteps.includes("cleaning") && (
                                    <Button size="sm" onClick={() => executeChunking(doc.id)}>
                                      Chunk Document
                                    </Button>
                                  )}
                                  {isCompleted && doc.stepData.chunking && (
                                    <div className="space-y-3">
                                      <p className="text-sm font-medium">
                                        {doc.stepData.chunking.length} chunks created (500 tokens each, 100-token overlap)
                                      </p>
                                      <div className="max-h-96 overflow-y-auto space-y-4">
                                        {doc.stepData.chunking.map((chunk, idx) => {
                                          const tokens = chunk.split(' ');
                                          const prevChunk = idx > 0 ? doc.stepData.chunking[idx - 1] : null;

                                          // Calculate overlap for highlighting
                                          let overlapStart = 0;
                                          if (prevChunk) {
                                            const prevTokens = prevChunk.split(' ');
                                            const overlapTokens = Math.min(100, prevTokens.length);
                                            const prevOverlap = prevTokens.slice(-overlapTokens).join(' ');
                                            const currentStart = tokens.slice(0, overlapTokens).join(' ');
                                            if (prevOverlap === currentStart) {
                                              overlapStart = overlapTokens;
                                            }
                                          }

                                          return (
                                            <div key={idx} className="border-l-4 border-blue-500 bg-card rounded-r shadow-sm">
                                              <div className="bg-blue-50 px-4 py-2 border-b">
                                                <div className="flex items-center justify-between">
                                                  <span className="font-semibold text-blue-900">Chunk {idx + 1}</span>
                                                  <span className="text-xs text-blue-700">
                                                    {tokens.length} tokens
                                                    {overlapStart > 0 && ` • ${overlapStart} overlap`}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="p-4 text-sm">
                                                {overlapStart > 0 && (
                                                  <>
                                                    <span className="bg-yellow-200 px-1 rounded">
                                                      {tokens.slice(0, overlapStart).join(' ')}
                                                    </span>
                                                    <span> {tokens.slice(overlapStart).join(' ')}</span>
                                                  </>
                                                )}
                                                {overlapStart === 0 && chunk}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {step === "processing" && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-3">Process chunks for Q&A pairs.</p>
                                  {!isCompleted && doc.completedSteps.includes("chunking") && (
                                    <Button size="sm" onClick={() => executeProcessing(doc.id)}>
                                      Process Chunks
                                    </Button>
                                  )}
                                  {isCompleted && doc.stepData.processing && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium">{doc.stepData.processing.length} chunks processed:</p>
                                      <div className="max-h-64 overflow-y-auto space-y-2">
                                        {doc.stepData.processing.map((item, idx) => (
                                          <div key={idx} className="p-3 bg-muted rounded text-sm">
                                            <p><span className="font-semibold">Q:</span> {item.user}</p>
                                            <p className="mt-1"><span className="font-semibold">A:</span> {item.assistant}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {step === "storing" && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-3">Store processed data in vector database.</p>
                                  {!isCompleted && doc.completedSteps.includes("processing") && (
                                    <Button size="sm" onClick={() => executeStoring(doc.id)}>
                                      Store Document
                                    </Button>
                                  )}
                                  {isCompleted && (
                                    <div className="p-3 bg-green-50 rounded text-sm text-green-800">
                                      ✓ Document successfully stored in vector database
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ingest;
