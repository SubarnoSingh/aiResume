# Mini-Coding Task: Resume Upload + AI Q&A

**Task**

Build a small Next.js app where users can:

1. Upload their name + a PDF resume.
2. View the uploaded PDF.
3. Ask questions about the PDF via AI (chat interface).

**Design Guideline**

Follow [Jobsuit.ai](https://www.jobsuit.ai/)’s aesthetic for front-end design inspiration (clean, modern, minimal).

**Optional Task**

Implement Supabase authentication and storage for user accounts and resume files.

👉 If Supabase is not implemented, just use **local browser storage/state** (e.g. `useState` or `localStorage`) to manage resumes.

### Detailed guide

Pages/routes

1. **Upload Page (`/resume`)**
    - A form with:
        - `Name` (text input)
        - `Resume Upload` (PDF only)
    - On submit:
        - Save the data (either in Supabase or local browser storage/state).
        - Redirect to the display page.
2. **Resume Display Page (`/resume/[id]`)**
    - Show the uploaded **name**.
    - Render the **PDF resume** in-browser.
    - Below the PDF, include a **chatbox** where users can:
        - Type questions.
        - See AI responses about the resume.
    - Backend route (`/api/ask-resume`) should:
        - Extract PDF text.
        - Send the text + user’s question to AI.
        - Return AI’s answer.
        
        
### UI / Design Guidelines

* **Colors**:

  * Background: `#F9FAFB`
  * Card background: `#FFFFFF`
  * Primary text: `#111827`
  * Secondary text: `#4B5563`
  * Borders: `#E5E7EB`
  * Primary button: `#1F2937` with white text
  * Secondary button: `#E5E7EB` with dark text
  * User chat bubble: `#E5E7EB`
  * AI chat bubble: `#111827` with white text

* **Typography**:

  * Font: `font-sans`
  * Headings: `text-3xl md:text-5xl font-bold`
  * Body: `text-base md:text-lg font-medium`
  * Line height: `leading-relaxed`

* **Layout / Spacing**:

  * Page padding: `px-4 md:px-20 py-8`
  * Card padding: `p-6 md:p-8`
  * Section margins: `my-8` or `space-y-6`
  * Rounded corners: `rounded-xl`
  * Shadow: `shadow-md` (optional, for cards/buttons)

* **Components (shadcn/ui)**:

  * Input: name field, chat input
  * FileUpload: resume PDF upload
  * Button: primary and secondary CTAs
  * Card: feature panels, upload form, PDF/chat containers
  * ScrollArea: scrollable chat window
  * Badge/Tag: optional for landing features
