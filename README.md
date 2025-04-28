# 🎬 Video Transcriber Frontend

This is the frontend interface for the Video Transcription Application, built with [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com/). It allows users to interact with the [backend service](../video-transcriber-backend-maukkonen/README.md) to upload videos, monitor transcription progress, edit the generated subtitles, and download the results.

## Features

-   **Video Upload**: Interface to select and upload video files (MP4, MOV, etc.).
-   **Language Selection**: Dropdown to select the spoken language in the video (currently supports Auto-Detect, English, Swedish in the UI) or choose the Whisper model size.
-   **Transcription Monitoring**: Displays real-time progress and status messages from the backend during transcription.
-   **Subtitle Editor**: Allows in-browser editing of the transcribed subtitle text and timings (though timing edits are not currently implemented).
-   **SRT Download**: Button to download the final (edited) subtitles in `.srt` format.
-   **System Information**: Displays detected GPU information and the recommended/available Whisper models fetched from the backend.

## Tech Stack

-   [Next.js](https://nextjs.org/) (using Pages Router)
-   [React](https://reactjs.org/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [axios](https://axios-http.com/) (for API requests, though current implementation uses `fetch`)

## Getting Started (Local Development)

While the primary deployment method is Docker (see `video-transcriber-service/README.md`), you can run the frontend locally for development, assuming the backend service is also running (either locally or in Docker).

1.  **Prerequisites**:
    -   Node.js (v18 or later recommended) and npm/yarn/pnpm.

2.  **Clone the repository** (if you haven't already):
    ```bash
    # If you haven't already cloned the parent project
    git clone https://github.com/parland/lecture-transcriber-maukkonen.git
    cd lecture-transcriber-maukkonen/video-transcriber-frontend-maukkonen
    ```

3.  **Install Dependencies**:
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

4.  **Configure Backend API URL**:
    The frontend needs to know where the backend API is running. It attempts to connect to `http://<current_hostname>:8765/api` by default when run in a browser. For local development where the backend might be on `localhost:8765`, you might need to set an environment variable. Create a `.env.local` file in this directory (`video-transcriber-frontend-maukkonen`):
    ```.env.local
    NEXT_PUBLIC_API_URL=http://localhost:8765/api
    ```
    *(Adjust the URL if your backend runs elsewhere)*

5.  **Run the Development Server**:
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```

6.  **Open the Application**:
    Open [http://localhost:3000](http://localhost:3000) (or the port specified by Next.js) in your browser.

## Key Components

-   **`pages/index.js`**: The main page component containing the UI for upload, status display, and subtitle editing.
-   **`pages/_app.js`**: Custom App component, used for global styles.
-   **`styles/globals.css`**: Global CSS styles, including Tailwind directives.
-   **`tailwind.config.js`**: Tailwind CSS configuration.
-   **`public/`**: Static assets.

## Environment Variables

-   `NEXT_PUBLIC_API_URL`: The base URL for the backend API service. If not set, the frontend tries to infer it based on the current hostname and the default backend port (8765).

## Docker Build

The `Dockerfile` in this directory defines how to build the frontend service image. It installs dependencies and runs the Next.js development server (`npm run dev`). This image is typically used within the combined Docker setup managed by the `video-transcriber-service`.
