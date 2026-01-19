#!/bin/bash

# Test the chat endpoints

# Parse arguments
TEST_TYPE="${1:-all}"
BASE_URL="${2}"

# Determine which environment to use
if [ -z "$BASE_URL" ]; then
    # No base URL provided, use production
    if [ -f .env ]; then
        source .env
    fi
    BASE_URL="http://truchat.miniops.me"
else
    # Base URL provided, use production env
    if [ -f .env.production ]; then
        source .env.production
    fi
fi

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TruChat API Tests ===${NC}"
echo -e "Base URL: ${GREEN}${BASE_URL}${NC}"
echo -e "Test Type: ${GREEN}${TEST_TYPE}${NC}"
echo ""

# Test LLM endpoint
test_llm() {
    echo -e "${YELLOW}--- Testing LLM Endpoint ---${NC}"
    echo "POST ${BASE_URL}/api/my/hello/llm"
    echo ""

    curl -s -X POST "${BASE_URL}/api/my/hello/llm" \
        -H "Content-Type: application/json" \
        -d '{"input":"capital of italy"}' | jq '.'

    echo -e "\n"
}

# Test streaming LLM endpoint
test_sllm() {
    echo -e "${YELLOW}--- Testing Streaming LLM Endpoint ---${NC}"

    # Get streaming URL from environment
    STREAM_URL="${VITE_STREAM:-${BASE_URL}}"

    echo "POST ${STREAM_URL}/web/hello/sllm"
    echo ""

    curl -s -X POST "${STREAM_URL}/web/hello/sllm" \
        -H "Content-Type: application/json" \
        -d '{"input":"capital of italy"}'

    echo -e "\n"
}

# Test chat endpoint
test_chat() {
    echo -e "${YELLOW}--- Testing Chat Endpoint ---${NC}"

    # Get streaming URL from environment
    STREAM_URL="${VITE_STREAM:-${BASE_URL}}"

    echo "POST ${STREAM_URL}/web/hello/chat"
    echo ""

    curl -s -X POST "${STREAM_URL}/web/hello/chat" \
        -H "Content-Type: application/json" \
        -d '{"input":[{"role":"system","content":"use italian language"},{"role":"user","content":"capitale d'\''Italia"}]}'

    echo -e "\n"
}

# Run tests based on argument
case "$TEST_TYPE" in
    llm)
        test_llm
        ;;
    sllm)
        test_sllm
        ;;
    chat)
        test_chat
        ;;
    all)
        test_llm
        test_sllm
        test_chat
        ;;
    *)
        echo "Invalid test type: $TEST_TYPE"
        echo "Valid options: all, llm, sllm, chat"
        exit 1
        ;;
esac

echo -e "${GREEN}=== Tests Complete ===${NC}"
