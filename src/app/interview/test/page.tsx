'use client';
import { getInterviewEvaluation } from "@/api/interview";
import EvaluationModal from "@/components/Evaluation";

export default async function TestPage() {
    //const evaluation = await getInterviewEvaluation(1);
    return <EvaluationModal open={true} onClose={() => {}} />;
}