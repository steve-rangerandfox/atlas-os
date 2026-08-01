# Secure MCP Tunnel Runbook

```bash
cd ~/tools/atlas-orchestrator
npm test

read -rsp "Tunnel runtime API key: " CONTROL_PLANE_API_KEY
echo
export CONTROL_PLANE_API_KEY

tunnel-client init \
  --sample sample_mcp_stdio_local \
  --profile claude-orchestrator \
  --tunnel-id tunnel_REPLACE_ME \
  --mcp-command "node /home/codespace/tools/atlas-orchestrator/src/mcp-server.mjs"

tunnel-client doctor --profile claude-orchestrator --explain
tunnel-client run --profile claude-orchestrator
```

Keep the last command running while ChatGPT uses the connection. Never commit the runtime key or paste it into a model conversation.
