import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

export const planToolDefinition = {
    name: 'plan',
    description: 'Generate a detailed plan for a given task or problem using Grok-4 AI',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'The task or problem to create a plan for'
            }
        },
        required: ['prompt'],
    },
};

export async function handlePlanTool(
    args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { prompt } = args as { prompt: string };

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid prompt: must be a non-empty string'
        );
    }

    try {
        const result = await generateText({
            model: xai('grok-4-fast-non-reasoning'),
            system: 'You are an expert strategic planner. When given a task or problem, you create detailed, actionable plans with clear steps and considerations.',
            prompt: prompt,
        });

        return {
            content: [
                {
                    type: 'text',
                    text: result.text,
                },
            ],
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error generating plan: ${error.message}`,
                    },
                ],
                isError: true,
            } as any;
        }
        throw error;
    }
}
