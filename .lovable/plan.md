# Set up GitHub sync for the project

Before Railway can deploy from a GitHub repo, the project needs to be synced to GitHub. This is a one-time setup in the Lovable UI.

## What to do

1. Open the Lovable editor for this project.
2. Click the **Plus (+)** menu at the bottom left of the chat input → **GitHub** → **Connect project**.
3. Authorize the Lovable GitHub App when GitHub asks.
4. Choose the GitHub account/organization where you want the repo.
5. Click **Create Repository** — this will push the current project code to a new GitHub repo (including the `bridge/` folder).

## What happens after

- Any future code changes in Lovable automatically push to GitHub.
- You can also push changes from GitHub back to Lovable (two-way sync).
- Railway can then deploy from that GitHub repo by selecting the repo and setting the root directory to `bridge`.

## Out of scope

- This does not set up the actual Railway deploy or the bridge environment variables — that is the next step after GitHub is connected.
- No project code changes are needed for this step.
