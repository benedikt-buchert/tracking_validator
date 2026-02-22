---
name: gtm-template-uploader
description: Uploads a GTM template to a specified container. It can get the container account and workspace name as input, or a URL of the workspace. If IDs are missing, it will use the list commands to find them.
---

# GTM Template Uploader

This skill uploads a GTM custom template file (`.tpl`) to a Google Tag Manager container.

## Workflow

1.  **Identify Target:**
    *   Ask the user for the GTM Account ID, Container ID, and Workspace ID.
    *   Alternatively, the user can provide a GTM URL like `https://tagmanager.google.com/#/container/accounts/4701768861/containers/32205981/workspaces/29`. Parse the Account, Container, and Workspace IDs from this URL.
    *   If the user only provides a name (e.g., "demo analytics pioneers ssgtm account"), use the `gtm accounts list` command to find the Account ID. Then, use `gtm containers list` and `gtm workspaces list` to find the remaining IDs.

2.  **Set Defaults:**
    *   Once all IDs are confirmed, use `gtm config set` to set the `defaultAccountId`, `defaultContainerId`, and `defaultWorkspaceId`. This simplifies subsequent commands.

3.  **Identify Template File:**
    *   Ask the user for the path to the `.tpl` file they want to upload.

4.  **Check for Existing Template:**
    *   Before uploading, check if a template with the same name already exists in the workspace.
    *   The template name is the `displayName` from the `___INFO___` section of the `.tpl` file. Parse the file to get this name.
    *   Run `gtm templates list` and check if any of the existing templates have a matching name.

5.  **Create or Update:**
    *   **If the template exists:** Use the `gtm templates update` command. You will need the `templateId` from the `list` command.
        ```bash
        gtm templates update --template-id <TEMPLATE_ID> --template-data "$(cat <FILE_PATH>)"
        ```
    *   **If the template does not exist:** Use the `gtm templates create` command.
        ```bash
        gtm templates create --name "<TEMPLATE_NAME>" --template-data "$(cat <FILE_PATH>)"
        ```
    *   **Note on `Promise.create`:** The local test environment might require `new Promise` instead of `Promise.create`. Before uploading, ensure the `.tpl` file uses `Promise.create` as this is the correct API for the GTM online environment.

## Session Persistence

Once the Account, Container, and Workspace IDs are set as defaults, you must continue to use them for all subsequent `gtm-cli` commands in the current session. Do not ask for these IDs again unless the user explicitly asks to target a different account or container.
