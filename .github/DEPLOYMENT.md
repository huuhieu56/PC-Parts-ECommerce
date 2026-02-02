# CI/CD Deployment Guide

This project uses GitHub Actions to automatically deploy to Azure.

## Required GitHub Secrets & Variables

### For Frontend (Azure Static Web Apps)

Go to **Settings > Secrets and variables > Actions** and add:

| Type   | Name                              | Description                                                             |
| ------ | --------------------------------- | ----------------------------------------------------------------------- |
| Secret | `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token from Azure Static Web Apps                             |
| Secret | `VITE_API_BASE_URL`               | Backend API URL (e.g., `https://your-backend.azurewebsites.net/api/v1`) |
| Secret | `VITE_GEMINI_API_KEY`             | (Optional) Google Gemini API key for AI advisor feature                 |

### For Backend (Azure Web App)

| Type     | Name                           | Description                           |
| -------- | ------------------------------ | ------------------------------------- |
| Variable | `AZURE_WEBAPP_NAME`            | Your Azure Web App name               |
| Secret   | `AZURE_WEBAPP_PUBLISH_PROFILE` | Publish profile XML from Azure Portal |

## How to Get Azure Credentials

### Azure Static Web Apps Token

1. Go to Azure Portal > Your Static Web App
2. Navigate to **Overview** > **Manage deployment token**
3. Copy the token

### Azure Web App Publish Profile

1. Go to Azure Portal > Your Web App
2. Click **Download publish profile**
3. Copy entire XML content

## Deployment Triggers

- **Frontend**: Deploys on push to `main` branch when files in `frontend/` change
- **Backend**: Deploys on push to `main` branch when files in `backend/` change

## Manual Deployment

You can also trigger backend deployment manually via **Actions** tab > **Build and Deploy Backend** > **Run workflow**
