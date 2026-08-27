import { useState } from "react";
import "./index.css";
import "./App.css";

import AttributionConceptWorkspace from "./components/AttributionConceptWorkspace";
import DetectionReviewWorkspace from "./components/DetectionReviewWorkspace";
import ErrorBoundary from "./components/ErrorBoundary";

type WorkspaceMode = "detection" | "attribution";

function App() {
  const [mode, setMode] = useState<WorkspaceMode>("detection");

  return (
    <ErrorBoundary>
      {mode === "detection" ? (
        <DetectionReviewWorkspace mode={mode} onModeChange={setMode} />
      ) : (
        <AttributionConceptWorkspace mode={mode} onModeChange={setMode} />
      )}
    </ErrorBoundary>
  );
}

export default App;
