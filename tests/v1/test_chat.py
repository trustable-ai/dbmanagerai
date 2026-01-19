import sys
sys.path.append("packages/v1/chat1")
import llm
import os

def test_llm():
    args = {}
    c = llm.LLM(args)
    c.welcome(args)
    c.ask(args, "hello")
    c.ask(args, "about Wizxenzy")
