# Environment Variables Configuration

This document provides instructions on how to set up the environment variables required for the application.

### Required Environment Variables

- **`DISCORD_TOKEN`**: The token for the Discord bot.
  - **Example bash command**:
    ```bash
    export DISCORD_TOKEN="MZ1yGvKTjE0rY0cV8i47CjAa.uRHQPq.Xb1Mk2nEhe-4iUcrGOuegj57zMC"
    ```

- **`DISCORD_BOT_OWNER`**: The Discord user ID of the bot owner.
  - **Example bash command**:
    ```bash
    export DISCORD_BOT_OWNER="123123123123123123"
    ```

- **`accountId`**: The account ID for Fortnite.
  - **Example bash command**:
    ```bash
    export accountId="8a1b2c3d4e5f67890abcdeff01234567"
    ```

- **`deviceId`**: The device ID for Fortnite authentication.
  - **Example bash command**:
    ```bash
    export deviceId="a3f5b6d7e8c90f1b23456789ab0cdeff"
    ```

- **`secret`**: The secret key for Fortnite authentication.
  - **Example bash command**:
    ```bash
    export secret="P9W3R7K2L1V0XJ6YQF8ZB5CGD4HTN0A"
    ```

### Setting Up Environment Variables

To set these environment variables, you can add the export commands to your shell configuration file (e.g., `.bashrc`, `.bash_profile`, `.zshrc`), or you can set them directly in your terminal session.

#### Adding to Shell Configuration File

1. Open your shell configuration file in a text editor. For example:
   ```bash
   nano ~/.bashrc


#### ** these are example tokens