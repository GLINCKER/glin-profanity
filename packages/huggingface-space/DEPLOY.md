# Deploying to Hugging Face Spaces

## Prerequisites

- Hugging Face account — [huggingface.co](https://huggingface.co)
- `git` and `git-lfs` installed locally

## Steps

1. **Create a new Space** at https://huggingface.co/new-space
   - SDK: **Gradio**
   - Visibility: Public or Private

2. **Clone the empty Space repo**
   ```bash
   git clone https://huggingface.co/spaces/<your-username>/glin-profanity-demo
   cd glin-profanity-demo
   ```

3. **Copy the Space files**
   ```bash
   cp -r /path/to/glin-profanity/packages/huggingface-space/* .
   ```

4. **Push**
   ```bash
   git add .
   git commit -m "feat: initial Space scaffold"
   git push
   ```

5. **Confirm build** — visit your Space URL. The build log appears under the "Logs" tab. Once the status turns green, the demo is live.

> The Space installs dependencies from `requirements.txt` automatically on each push.
