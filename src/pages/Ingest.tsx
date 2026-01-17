import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type ProcessingStep = "upload" | "cleaning" | "chunking" | "processing" | "storing";

interface Document {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed";
  currentStep: ProcessingStep | null;
  completedSteps: ProcessingStep[];
}

const Ingest = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expandedStep, setExpandedStep] = useState<string>("");

  const processingSteps: ProcessingStep[] = ["upload", "cleaning", "chunking", "processing", "storing"];

  const addDocument = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      name: `Document ${documents.length + 1}`,
      status: "pending",
      currentStep: null,
      completedSteps: [],
    };
    setDocuments((prev) => [...prev, newDoc]);
    toast.success("Document added. Click 'Upload' to start processing.");
  };

  const simulateStepProcessing = async (docId: string, step: ProcessingStep) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === docId
              ? {
                  ...doc,
                  completedSteps: [...doc.completedSteps, step],
                  currentStep: null,
                }
              : doc
          )
        );
        resolve();
      }, 1000);
    });
  };

  const startProcessing = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "processing" as const } : d))
    );

    for (const step of processingSteps) {
      if (!doc.completedSteps.includes(step)) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, currentStep: step } : d))
        );
        await simulateStepProcessing(docId, step);
      }
    }

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "completed" as const } : d))
    );
    toast.success("Document processing completed!");
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
                            <div className="text-sm text-muted-foreground py-2">
                              {step === "upload" && (
                                <div>
                                  <p className="mb-3">Upload your document to begin processing.</p>
                                  {!isCompleted && doc.status === "pending" && (
                                    <Button
                                      size="sm"
                                      onClick={() => startProcessing(doc.id)}
                                    >
                                      Start Upload
                                    </Button>
                                  )}
                                </div>
                              )}
                              {step === "cleaning" && (
                                <p>Removing unnecessary characters and formatting from the document.</p>
                              )}
                              {step === "chunking" && (
                                <p>Splitting document into manageable chunks for better processing.</p>
                              )}
                              {step === "processing" && (
                                <p>Analyzing and extracting meaningful information from chunks.</p>
                              )}
                              {step === "storing" && (
                                <p>Storing processed data in the vector database for retrieval.</p>
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
