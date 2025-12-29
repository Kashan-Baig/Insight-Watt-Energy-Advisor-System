# Project Setup Guide (Windows)

This guide provides the step-by-step instructions to set up and run this project using `uv` on a Windows machine.

## 1\. Install `uv`

First, you need to install `uv` on your system.

1.  Open **Windows PowerShell**.

2.  Run the following command to download and run the installer:

    ```powershell
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```

3.  **Important:** Close and re-open your PowerShell window to ensure `uv` is added to your system's `PATH`.

4.  Verify the installation by running:

    ```powershell
    uv --version
    ```

## 2\. Clone the Repository

Clone the project repository from GitHub (or your Git provider) and navigate into the project folder.

```powershell
# Replace with your actual repository URL
git clone https://github.com/your-username/your-repo-name.git

# Navigate into the newly cloned folder
cd your-repo-name
```

## 3\. Initialize the Project

Create a `pyproject.toml` file to manage your project's dependencies. `uv` will use this file.

```powershell
uv init
```

*(You can press Enter to accept the default settings.)*

## 4\. Create & Activate Virtual Environment

Next, create a virtual environment (`.venv`) for this project and activate it.

1.  **Create the environment:**

    ```powershell
    uv venv
    ```

2.  **Activate the environment:**

    ```powershell
    .\.venv\Scripts\Activate.ps1
    ```

    *(Your terminal prompt should now show `(.venv)` at the beginning.)*

## 5\. Install All Dependencies

This project uses a `requirements.txt` file. The following command will read that file, install all the packages, and add them as dependencies to your `pyproject.toml` file.

```powershell
uv add (Get-Content requirements.txt)
```
