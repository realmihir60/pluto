

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
    ErrorCode,
    McpError
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { sanitizeAndAnalyze, RuleEngine, MEDICAL_RULES } from "@pluto/core";

// 1. Initialize Server
const server = new Server(
    {
        name: "pluto-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

// 2. Define Resources
// medical://protocols/catalog
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "medical://protocols/catalog",
                name: "Medical Rule Catalog",
                mimeType: "application/json",
                description:
                    "A catalog of deterministic medical protocols checked by Pluto. Use this to understand what conditions are explicitly detected.",
            },
        ],
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri === "medical://protocols/catalog") {
        // Return sanitized rule metadata (exclude implementation details if needed, 
        // but here we just map our rules to a clean format)
        const catalog = MEDICAL_RULES.map((rule: any) => ({
            id: rule.id,
            category: rule.triage_level, // Using triage level as category for now
            severity: rule.triage_level,
            description: rule.message,
            required_symptoms: rule.conditions.all,
        }));

        return {
            contents: [
                {
                    uri: "medical://protocols/catalog",
                    mimeType: "application/json",
                    text: JSON.stringify(catalog, null, 2),
                },
            ],
        };
    }
    throw new McpError(ErrorCode.InvalidRequest, "Resource not found");
});

// 3. Define Tools
// assess_symptom_severity
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "assess_symptom_severity",
                description:
                    "Deterministcally assess medical symptoms against valid clinical protocols. Returns triage guidance if a specific pattern is matched. returns 'info' if no pattern is matched. NEVER guesses. Strictly deterministic.",
                inputSchema: {
                    type: "object",
                    properties: {
                        input: {
                            type: "string",
                            description:
                                "The user's raw symptom description (e.g., 'I have a headache and stiff neck').",
                        },
                    },
                    required: ["input"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "assess_symptom_severity") {
        const args = request.params.arguments as { input: string };

        if (!args.input) {
            throw new McpError(ErrorCode.InvalidParams, "input is required");
        }

        // A. Sanitize
        const { safeInput, hasCrisisKeywords, detectedCrisisKeywords } = sanitizeAndAnalyze(args.input);

        if (hasCrisisKeywords) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            status: "success",
                            triage_level: "crisis",
                            matched_rules: ["CRITICAL_KEYWORD_MATCH"],
                            risk_factors: detectedCrisisKeywords,
                            guidance: "CRITICAL: Input indicates a potential medical emergency. Seek immediate care.",
                        }, null, 2),
                    },
                ],
            };
        }

        // B. Run Rule Engine
        const result = RuleEngine.assess([safeInput]);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    throw new McpError(ErrorCode.MethodNotFound, "Tool not found");
});

// 4. Start Transport
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // console.error("Pluto MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
