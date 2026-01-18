import sys
sys.path.append("packages/v1/chat")
import chat
import os

def test_chat_no_input():
    args = {}
    result = chat.chat(args)
    assert result["output"] == "No input provided"
    assert result["streaming"] == False

def test_chat_with_input():
    args = {
        "OPENAI_BASE_URL": os.getenv("OPENAI_BASE_URL", ""),
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY", ""),
        "OPENAI_MODEL": os.getenv("OPENAI_MODEL", "gpt-4"),
        "input": [
            {"role": "user", "content": "Say hello in one word"}
        ]
    }
    if not args["OPENAI_BASE_URL"] or not args["OPENAI_API_KEY"]:
        return
    result = chat.chat(args)
    assert "output" in result
    assert result["streaming"] == True
