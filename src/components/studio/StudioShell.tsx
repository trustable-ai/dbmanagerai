import { StudioProvider } from "@/hooks/use-studio";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PromptBar } from "./PromptBar";
import { WorkspaceRouter } from "./WorkspaceRouter";

export function StudioShell() {
  return (
    <StudioProvider>
      <div className="flex h-[100dvh] overflow-hidden mesh-bg">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] px-4 pb-48 pt-6 sm:px-6 lg:px-8">
              <WorkspaceRouter />
            </div>
          </main>
        </div>
        <PromptBar />
      </div>
    </StudioProvider>
  );
}
