import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
  RetrieveCommandInput,
} from "@aws-sdk/client-bedrock-agent-runtime";
import type { RAGSource } from "@/app/lib/utils";
import fs from "fs";
import path from "path";

// Bedrock is optional. Without AWS keys the bot answers from the
// markdown files in the /knowledge folder instead.
const hasBedrock =
  !!process.env.BAWS_ACCESS_KEY_ID && !!process.env.BAWS_SECRET_ACCESS_KEY;

const bedrockClient = hasBedrock
  ? new BedrockAgentRuntimeClient({
      region: process.env.BAWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.BAWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.BAWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");

function retrieveLocalKnowledge(): {
  context: string;
  isRagWorking: boolean;
  ragSources: RAGSource[];
} {
  try {
    const files = fs
      .readdirSync(KNOWLEDGE_DIR)
      .filter((f) => f.endsWith(".md") || f.endsWith(".txt"));
    const docs = files.map((f) => ({
      fileName: f.replace(/\.(md|txt)$/, "").replace(/[_-]/g, " "),
      text: fs.readFileSync(path.join(KNOWLEDGE_DIR, f), "utf8"),
    }));
    const context = docs.map((d) => d.text).join("\n\n");
    return {
      context,
      isRagWorking: context.trim().length > 0,
      ragSources: docs.slice(0, 1).map((d, i) => ({
        id: `local-${i}`,
        fileName: d.fileName,
        snippet: d.text.slice(0, 300),
        score: 1,
      })),
    };
  } catch (error) {
    console.error("Local knowledge error:", error);
    return { context: "", isRagWorking: false, ragSources: [] };
  }
}

export async function retrieveContext(
  query: string,
  knowledgeBaseId: string,
  n: number = 3,
): Promise<{
  context: string;
  isRagWorking: boolean;
  ragSources: RAGSource[];
}> {
  if (!bedrockClient) {
    return retrieveLocalKnowledge();
  }

  try {
    if (!knowledgeBaseId) {
      console.error("knowledgeBaseId is not provided");
      return {
        context: "",
        isRagWorking: false,
        ragSources: [],
      };
    }

    const input: RetrieveCommandInput = {
      knowledgeBaseId: knowledgeBaseId,
      retrievalQuery: { text: query },
      retrievalConfiguration: {
        vectorSearchConfiguration: { numberOfResults: n },
      },
    };

    const command = new RetrieveCommand(input);
    const response = await bedrockClient.send(command);

    // Parse results
    const rawResults = response?.retrievalResults || [];
    const ragSources: RAGSource[] = rawResults
      .filter((res: any) => res.content && res.content.text)
      .map((result: any, index: number) => {
        const uri = result?.location?.s3Location?.uri || "";
        const fileName = uri.split("/").pop() || `Source-${index}.txt`;

        return {
          id:
            result.metadata?.["x-amz-bedrock-kb-chunk-id"] || `chunk-${index}`,
          fileName: fileName.replace(/_/g, " ").replace(".txt", ""),
          snippet: result.content?.text || "",
          score: result.score || 0,
        };
      })
      .slice(0, 1);

    console.log("🔍 Parsed RAG Sources:", ragSources); // Debug log

    const context = rawResults
      .filter((res: any) => res.content && res.content.text)
      .map((res: any) => res.content.text)
      .join("\n\n");

    return {
      context,
      isRagWorking: true,
      ragSources,
    };
  } catch (error) {
    console.error("RAG Error:", error);
    return { context: "", isRagWorking: false, ragSources: [] };
  }
}
