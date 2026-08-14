# Smart Inbox Pro

Project: AI Email Reply Assistant (Shared Inbox)

Goal: Build a modern, web-based shared inbox for a small team. The app will read emails, generate AI drafts, and allow the team to review and send them.

Tech Stack Preferences: React, Tailwind CSS, shadcn/ui, and Supabase for the backend/database.

1. UI/UX Layout (The Dashboard):

Create a classic 3-pane email client layout (similar to Superhuman or Front).

Left Sidebar: Navigation links (Inbox, Pending AI Drafts, Sent, Settings, Knowledge Base).

Middle Pane: A scrollable list of incoming emails. Each item should show the sender, subject, a snippet, and a status badge (e.g., "AI Draft Ready", "Needs Review", "Sent").

Right Pane (Detail View): When an email is selected, display the full email thread on top. Below it, show a distinct card titled "AI Draft Response".

Draft Editor: The AI Draft section needs a rich-text editor so the human user can edit the text. Include buttons for "Approve & Send", "Discard", and a "Quick Actions" dropdown (e.g., "Make shorter", "Make more professional").

2. Database Schema (Supabase):

Assume we will use Supabase. We will need a table for emails (id, sender, subject, body, status, thread_id) and a table for knowledge_base (id, content_text) where the team can save FAQs for the AI to use.

3. Core App Functionality to Mock Up:

Build the frontend state so I can click between emails in the middle pane and see the right pane update.

Create a functional "Settings" page where the user can input an OpenAI API Key and connect a Gmail account.

Create a "Knowledge Base" page with a simple text area to add business rules (like return policies) that the AI should know.

Instructions for the AI: Please generate the complete frontend UI for this dashboard first using mock data so I can see how it looks and feels. Make it look clean, minimalistic, and professional.

🛠️ Next Steps with Lovable

When building with Lovable, it’s best to tackle it in these phases:

Generate the UI: Use the prompt above to get the layout, sidebars, and mock data looking exactly how you want. Project: AI Email Reply Assistant (Shared Inbox)

Goal: Build a modern, web-based shared inbox for a small team. The app will read emails, generate AI drafts, and allow the team to review and send them.

Tech Stack Preferences: React, Tailwind CSS, shadcn/ui, and Supabase for the backend/database.

1. UI/UX Layout (The Dashboard):

Create a classic 3-pane email client layout (similar to Superhuman or Front).

Left Sidebar: Navigation links (Inbox, Pending AI Drafts, Sent, Settings, Knowledge Base).

Middle Pane: A scrollable list of incoming emails. Each item should show the sender, subject, a snippet, and a status badge (e.g., "AI Draft Ready", "Needs Review", "Sent").

Right Pane (Detail View): When an email is selected, display the full email thread on top. Below it, show a distinct card titled "AI Draft Response".

Draft Editor: The AI Draft section needs a rich-text editor so the human user can edit the text. Include buttons for "Approve & Send", "Discard", and a "Quick Actions" dropdown (e.g., "Make shorter", "Make more professional").

2. Database Schema (Supabase):

Assume we will use Supabase. We will need a table for emails (id, sender, subject, body, status, thread_id) and a table for knowledge_base (id, content_text) where the team can save FAQs for the AI to use.

3. Core App Functionality to Mock Up:

Build the frontend state so I can click between emails in the middle pane and see the right pane update.

Create a functional "Settings" page where the user can input an OpenAI API Key and connect a Gmail account.

Create a "Knowledge Base" page with a simple text area to add business rules (like return policies) that the AI should know.

Instructions for the AI: Please generate the complete frontend UI for this dashboard first using mock data so I can see how it looks and feels. Make it look clean, minimalistic, and professional.

🛠️ Next Steps with Lovable

When building with Lovable, it’s best to tackle it in these phases:

Generate the UI: Use the prompt above to get the layout, sidebars, and mock data looking exactly how you want.

Connect Supabase: Once the UI looks good, ask Lovable to connect to your Supabase project to make the mock data real.

Edge Functions (The Magic): The final step will be writing the actual logic (fetching emails via Gmail API and asking OpenAI for drafts). Lovable can help you write Supabase Edge Functions for this part. To make sure your app actually has these specific capabilities out of the gate, we need to explicitly build them into the logic.

The current architecture (Supabase + OpenAI) is perfectly set up to handle this, but the previous prompts didn't explicitly instruct the AI to build the "tag scanning" or the "historical learning" loop.

Here is exactly how we incorporate those two features into the flow and how to instruct Lovable to build them.

1. Scanning Tags & Codes (Command Routing)

To do this, the Supabase Edge Function that scans incoming emails needs a parsing engine.

The Flow: When an email hits the inbox, the function scans the subject line and body using Regex (regular expressions) to identify specific syntax (e.g., #URGENT, [REFUND], !DISCOUNT).

The Execution: Based on the detected tag, the code runs a switch statement to trigger a specific workflow. For example, if it sees [REFUND], it bypasses standard AI generation, pulls the exact refund template, processes it, and either drafts it for review or auto-sends it based on your rules.

2. The "Brain" (Learning from Past Emails via RAG)

To give the AI the capacity to actually "learn" your tone and past decisions, we need to move beyond a simple static Knowledge Base and implement a Retrieval-Augmented Generation (RAG) architecture.

The Flow: Since you are using Supabase, we will leverage its native pgvector extension. Every time you send a finalized email, an Edge Function will take that email, break it into manageable chunks, pass it through an embedding model (like OpenAI's text-embedding-3-small), and store those vector embeddings in a dedicated Supabase table.

The Execution: When a new email arrives, the system converts the incoming email into an embedding, performs a similarity search against your vector database of past emails, and retrieves the 3 or 4 most relevant past threads. It feeds those past threads into the OpenAI prompt as context, instructing the AI: "Here is how we successfully answered similar inquiries in the past. Mimic this tone and factual approach."

📋 The Updated Prompt for Lovable

To ensure Lovable builds the database schema and Edge Functions for these advanced features, paste this update into your Lovable chat:

Feature Update: Advanced Tag Routing & Historical Learning (RAG)

Please update our architecture and UI to support two core features:

1. Tag & Command Parsing (Routing):

Update the incoming email Edge Function so that it scans the subject line and body for specific tags (e.g., #URGENT, [PAYMENT], !ESCALATE).

Update the Database Schema: Add a tags array column to the emails table.

Update the UI: In the middle pane email list, visually display these detected tags as colored pill badges. Allow users to filter the inbox by these tags.

2. Continuous Learning (pgvector RAG Architecture):

Update the Database Schema: Enable the pgvector extension in Supabase. Create a new table called historical_emails that includes an embedding column (vector type) to store the vectorized context of previously sent emails.

Update the Edge Function (Sending): When a user clicks "Approve & Send", the function should chunk the finalized email, generate an embedding via OpenAI, and store it in the historical_emails table.

Update the Edge Function (Drafting): When a new email arrives, perform a vector similarity search against historical_emails. Retrieve the top 3 most relevant past emails and inject them into the OpenAI prompt so the AI can mimic our past tone and factual responses.

By adding the vector database chunking and embedding flow, your assistant will actually get smarter and sound more like you every time you hit send.

Should we configure the tag system to trigger completely automated replies for certain codes, or do you still want everything to sit in a "Pending Review" queue for human eyes first?

Connect Supabase: Once the UI looks good, ask Lovable to connect to your Supabase project to make the mock data real.

Edge Functions (The Magic): The final step will be writing the actual logic (fetching emails via Gmail API and asking OpenAI for drafts). Lovable can help you write Supabase Edge Functions for this part.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bc50b4d2-13be-4db9-a6fe-5bb12f35edac).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
