I want the home page to be 
the user interface of a chatbot
with an Ingest
showing an UI for ingesting documents

You click add and it shows a separate ingestion page with an accordion to 

- upload a  document
- extract
- cleaning
- chunking
- processing
- storing

You can expand the accordion to see the document and a button for cleaning, chunking, processing and storing

Clicking upload uploads a pdf document.
Expanding the accordion you see a preview of it.

Clicking on export it will invoke the tika server 
on the uploaded document  available on tika.minipos.me to convert in text, show the exporte text in the accordion.

Clicking on cleaning will clean the document
invoking rag/clean and shows the cleaned document
in the accordion

Clicking on chunking will process the cleaned document
invoking rag/chunk and shows the chunked document
as a sequence of different chunks

Clicking on processing will process the chunks one by one document
invoking rag/process and shows the processed chunks

Clicking on store will store the document invokig
rag/store

You can repeat the steps and if you execute a precedent steip
it will clean all the successive steps



