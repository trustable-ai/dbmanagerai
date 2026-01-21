Implementation of the frontend.

Implement the home page as a Chat User Interface.


The user will write the input in the text area
and it will sent a request at the endpoint
point by VITE_STREAM + `v1/chat`

sending as input a sequence of 

```
{ "role": <role>, "content": <content>}
```
where <role> is either "user"  or "assistant"

it should send all the history of the request made
and add as a last mesage the "user" request.

Retun the result as a streaming answer, interpret it in markdown and render in the result bubble as it is returned.

At the beginning, send a request with an empty input and show the result.