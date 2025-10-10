import {
  createLLM,
  resumePromptTemplate,
  feedbackSchema,
} from "../config/langchain.js";

function extractJSONFromMarkdown(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1];
  }
  return text;
}

export const analyzeResume = async (data: {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
}) => {
  const startTime = Date.now();

  const llm = createLLM("gemini").withStructuredOutput(feedbackSchema, {
    name: "resume_feedback",
    method: "json_schema",
  });
  const chain = resumePromptTemplate.pipe(llm);

  try {
    const input = {
      job_title: data.jobTitle,
      job_description: data.jobDescription,
      resume_text: data.resumeText,
    };

    const response = await chain.invoke(input);

    console.log("Raw LLM response:", response);

    const feedback =
      typeof response === "string"
        ? JSON.parse(extractJSONFromMarkdown(response))
        : response;

    const processingTime = Date.now() - startTime;
    const tokensUsed = estimateTokens(data.resumeText);

    return {
      feedback,
      metadata: {
        processingTime,
        tokensUsed,
        processingCost: calculateCost(tokensUsed),
        modelUsed: "gemini-1.5-pro",
      },
    };
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw new Error("AI Analysis failed");
  }
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function calculateCost(tokens: number): number {
  return 0; // Gemini free tier
}
