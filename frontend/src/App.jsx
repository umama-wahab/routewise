import React, { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import PlanPage from "./pages/PlanPage.jsx";
import ReviewPage from "./pages/ReviewPage.jsx";
import LogsPage from "./pages/LogsPage.jsx";
import { planTrip } from "./api/client.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("plan");
  const [tripInputs, setTripInputs] = useState(null);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGeneratePlan(formValues) {
    setIsLoading(true);
    setError(null);
    setTripInputs(formValues);
    try {
      const result = await planTrip(formValues);
      setPlan(result);
      setActiveTab("review");
    } catch (err) {
      setError(err);
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} hasPlan={Boolean(plan)} />

      <main className="flex-1 w-full max-w-[1180px] mx-auto px-5 sm:px-8 pb-24">
        {activeTab === "plan" && (
          <PlanPage
            onGenerate={handleGeneratePlan}
            isLoading={isLoading}
            error={error}
            tripInputs={tripInputs}
            plan={plan}
            onViewReview={() => setActiveTab("review")}
          />
        )}
        {activeTab === "review" && (
          <ReviewPage plan={plan} isLoading={isLoading} onGoToPlan={() => setActiveTab("plan")} onGoToLogs={() => setActiveTab("logs")} />
        )}
        {activeTab === "logs" && <LogsPage plan={plan} onGoToPlan={() => setActiveTab("plan")} />}
      </main>

      <Footer />
    </div>
  );
}
