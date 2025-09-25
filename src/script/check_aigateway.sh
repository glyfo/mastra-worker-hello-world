#!/usr/bin/env bash
set -euo pipefail

# --------- INLINE CONFIG (edit these) ----------
CLOUDFLARE_ACCOUNT_ID="4888f8b4a6a1138de7d4dd06dbd05cd3"
CLOUDFLARE_GATEWAY_ID="cloudflare"
CLOUDFLARE_API_TOKEN="Y5iFadLM1CdigyqhH3mRJgb8n7cnfXqhgpw9XBEA"          # Cloudflare API Token with Workers AI invoke permission
MODEL_ID="@cf/meta/llama-3.1-8b-instruct"
PROMPT="Say hello from my gateway"
# ----------------------------------------------
#!/usr/bin/env bash
set -euo pipefail

############################################
# Inline config (EDIT THESE)
############################################
CLOUDFLARE_ACCOUNT_ID="YOUR_ACCOUNT_ID"
CLOUDFLARE_GATEWAY_ID="YOUR_GATEWAY_NAME"
CLOUDFLARE_API_TOKEN="YOUR_API_TOKEN"     # Do NOT commit this
MODEL_ID="@cf/meta/llama-3.1-8b-instruct"
PROMPT="Say hello from my gateway"
############################################

# --- Validation ---
[[ -n "${CLOUDFLARE_ACCOUNT_ID}" ]] || { echo "❌ Missing CLOUDFLARE_ACCOUNT_ID"; exit 1; }
[[ -n "${CLOUDFLARE_GATEWAY_ID}" ]] || { echo "❌ Missing CLOUDFLARE_GATEWAY_ID"; exit 1; }
[[ -n "${CLOUDFLARE_API_TOKEN}" ]] || { echo "❌ Missing CLOUDFLARE_API_TOKEN"; exit 1; }

# --- Build URL (vendor is 'workers-ai') ---
BASE_URL="https://gateway.ai.cloudflare.com/v1/${CLOUDFLARE_ACCOUNT_ID}/${CLOUDFLARE_GATEWAY_ID}/workers-ai/v1"
ENDPOINT="${BASE_URL}/chat/completions"

# --- Mask token for logs ---
MASKED_TOKEN="${CLOUDFLARE_API_TOKEN:0:4}********${CLOUDFLARE_API_TOKEN: -4}"

echo ">> Endpoint: ${ENDPOINT}"
echo ">> Model:    ${MODEL_ID}"
echo ">> Prompt:   ${PROMPT}"
echo ">> Token:    ${MASKED_TOKEN}"
echo


# --- Request body ---
read -r -d '' BODY <<JSON
{
  "model": "${MODEL_ID}",
  "messages": [
    { "role": "user", "content": "${ESCAPED_PROMPT}" }
  ],
  "stream": false
}
JSON

# --- Temp files for response & headers ---
RESP_FILE="$(mktemp)"
HDRS_FILE="$(mktemp)"

# --- cURL call (capture HTTP status, headers, body) ---
HTTP_CODE="$(
  curl --silent --show-error \
       --write-out "%{http_code}" \
       --dump-header "${HDRS_FILE}" \
       "${ENDPOINT}" \
       -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
       -H "Content-Type: application/json" \
       -d "${BODY}" \
       -o "${RESP_FILE}"
)"

# --- Pretty printers ---
print_json () {
  if command -v jq >/dev/null 2>&1; then jq . < "${RESP_FILE}"; else cat "${RESP_FILE}"; fi
}

extract_message () {
  # Try OpenAI-style completion: choices[0].message.content
  if command -v jq >/dev/null 2>&1; then
    jq -r 'try .choices[0].message.content // empty' < "${RESP_FILE}"
  else
    # Naive fallback without jq
    grep -o '"content":[^}]*' "${RESP_FILE}" | head -n1 | sed 's/.*"content":"\([^"]*\)".*/\1/' || true
  fi
}

extract_error () {
  if command -v jq >/dev/null 2>&1; then
    # Cloudflare Gateway error shape OR OpenAI error shape
    jq -r 'try .errors // .error // empty' < "${RESP_FILE}"
  else
    grep -E '"errors"|"error"' -n "${RESP_FILE}" || true
  fi
}

# --- Outcome ---
echo ">> HTTP: ${HTTP_CODE}"
if [[ "${HTTP_CODE}" =~ ^2[0-9]{2}$ ]]; then
  echo "✅ SUCCESS"
  MSG="$(extract_message)"
  if [[ -n "${MSG}" ]]; then
    echo
    echo "------ Model Reply ------"
    echo "${MSG}"
    echo "-------------------------"
  else
    echo
    echo "ℹ️ Full JSON response:"
    print_json
  fi
  EXIT_CODE=0
else
  echo "❌ FAILURE"
  echo
  echo "------ Response Headers ------"
  cat "${HDRS_FILE}"
  echo "------------------------------"
  echo
  echo "------ Error Payload ------"
  print_json
  echo "---------------------------"
  ERR="$(extract_error)"
  if [[ -n "${ERR}" ]]; then
    echo
    echo "Parsed error:"
    echo "${ERR}"
  fi
  EXIT_CODE=1
fi

# --- Cleanup ---
rm -f "${RESP_FILE}" "${HDRS_FILE}"
exit "${EXIT_CODE}"