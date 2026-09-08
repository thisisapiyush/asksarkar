import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!_client) {
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
    _client = new Anthropic(
      workspaceId
        ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } }
        : undefined
    );
  }
  return _client;
}
