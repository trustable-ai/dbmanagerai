Implementation of the frontend.

Implement the home page as a Chat User Interface.


# input

The user will write the input in the text area

when you press enter or click the arrow

and it will sent a POST request at the endpoint
point by VITE_STREAM + `/web/truchat/v1/chat`
with content type: applition/json

in format:
`
{ 
    "input": <user input>,
    "message": <messages>
}
`

where <messages> is an array of

```
{ "role": <role>, "content": <content>}
```
where <role> is either "user"  or "assistant"

it should send all the history of the request made 

# answer

Expect the result to be a stream ,

- interpret the stream as  markdown 
- use marked with tables enabled.
- render the resul in the result bubbl while it is returned.

While streaming, change the button "send" in a stop sign you can click to sto be streaming

# start

At the start, send a request with an empty input and show the result,
displaying general infos

# buttons
Add to the top bar, aligned to the left, two buttons: Reset and RAG.

The button Reset will clean the chat and restart from the initial message.

The button RAG will send a "@" message,  and display the RAG instructions received.