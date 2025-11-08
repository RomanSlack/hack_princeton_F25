import BlockPalette from "@/components/palette/BlockPalette";
import WorkspaceCanvas from "@/components/workspace/WorkspaceCanvas";
import { WorkspaceToolbar } from "@/components/workspace/WorkspaceToolbar";

export default function BuilderPage() {
  return (
    <div className="h-screen w-screen flex flex-col">
      <WorkspaceToolbar />
      <div className="flex flex-1">
        <BlockPalette />
        <WorkspaceCanvas />
      </div>
    </div>
  );
}
