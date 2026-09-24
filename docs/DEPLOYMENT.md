# Host your own BodyOS web demo

This guide is for people deploying their own copy of BodyOS. Use a cloud project, account and domain you control.

The deployment includes the landing page and sample web workspace. Mobile distribution, model training and optional backend integrations have their own setup guides.

## Before deploying

Fork or clone the repository. The helper below updates an existing App Engine default service in a Google Cloud project you control, with billing enabled. For a new application, start with [Google's App Engine setup](https://docs.cloud.google.com/appengine/docs/standard/hosting-a-static-website). Sign in with an account allowed to deploy to your project.

Cloud Build also needs permission to deploy App Engine versions, use the application's runtime service account, and access its build artifacts and logs. Follow [Google's Cloud Build deployment setup](https://docs.cloud.google.com/build/docs/deploying-builds/deploy-appengine) for your project's service account. The script does not grant IAM roles.

Hosting and builds can incur charges. The sample workspace requires no production credentials.

## Build a preview

Run these commands in Google Cloud Shell's Bash terminal. Set PROJECT_ID to your own project ID:

```bash
git clone https://github.com/LaoWater/bodyos-open.git
cd bodyos-open
PROJECT_ID="your-project-id"
bash scripts/deploy-web.sh "$PROJECT_ID"
```

The script requires a clean checkout. It shows the account, project, source commit and existing traffic, enables the deployment APIs, builds the web app in Cloud Build, and deploys a preview version.

The preview receives no live traffic until you promote it.

The build uses Node.js 22. Upload rules exclude local environment files, dependencies and private demo recordings. If the build fails, inspect the first failing step in your project's Cloud Build history.

## Review and publish

Open the preview URL printed by the script. Check the landing page, Try Demo, navigation, mobile layout and refreshing a nested route. Once satisfied, run the complete promotion command printed by the script.

The previous version remains available. To roll back, substitute your own project and a previously reviewed version:

```bash
gcloud app services set-traffic default \
  --splits=YOUR_PREVIOUS_VERSION=1 \
  --project=YOUR_PROJECT_ID
```

For later releases, update your clean checkout and rerun the script.

## Connect your domain

In your project's **App Engine → Settings → Custom Domains**, verify ownership of a domain you control. Google supplies the verification record to add at your DNS provider.

Map the root domain and any desired subdomains, then copy Google's generated A, AAAA and CNAME records into your provider's DNS settings. Preserve verification and mail records. Leave automatic certificate management enabled and wait for DNS and HTTPS to become ready.

Follow [Google's domain mapping instructions](https://docs.cloud.google.com/appengine/docs/standard/mapping-custom-domains) for the current procedure. After checking your domain, update the links and branding in your own copy.
