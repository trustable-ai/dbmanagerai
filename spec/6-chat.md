Implement the backend code for streaming chat implementing packages/v1/chat

The code should invoke the openai endpoint pointed by the variables 

- OPENAI_BASE_URL
- OPENAN_API_KEY 
- OPENAI_MODEL

in streaming mode, passing as
"input" an array of `{"role":xxx, "content":xxx}` and return the answer in streaming as a sequence of

{"output": <cntent>}



