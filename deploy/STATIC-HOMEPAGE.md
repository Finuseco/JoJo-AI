# Plain HTML homepage

Production entry files live at the root of the application:

- index.html
- showcase/style.css
- showcase/main.js (plain browser JavaScript; no bundler, framework or package install)
- showcase/jojo-ai.png
- showcase/cahier-des-charges.txt and showcase/project-brief.txt

The existing ai.cashpay-all.com Nginx server includes /var/www/cashpay-all/jo-ai/deploy/studio-nginx.conf.example. The exact / and /index.html locations and /showcase/ alias read these files directly. The catch-all location continues to proxy /dashboard, /workspace and /api to 127.0.0.1:8095. Keep existing certificates and TLS settings. Adjust only the filesystem roots if the checkout path differs.

To publish homepage edits, pull Git, ensure the root and showcase directories are traversable and the public files readable, run nginx -t and reload Nginx. Do not install npm dependencies, build the homepage or restart the application for content/CSS/animation edits. Never apply public file permissions to .env files. The Next route adapters exist only for local development and do not serve the production homepage under this configuration. Changes to the actual dashboard/API still use the normal Next build process.

The root auth query redirect preserves older portal callbacks by sending them to /dashboard. All authentication, credits and project operations remain backend responsibilities; the HTML illustration never creates a project or executes a command. The diagram represents a workflow, not a live generation. The brief template is an editable text document for pasting into project chat, not a file-upload or automated deployment promise.

The page describes account creation and sign-in, project setup, requirements, source review, GitHub/ZIP, code editing, previews, configured terminal/data/hosting/Android services, publishing steps, credits and the full service footer. FR/EN and navigation work through a small local script; content, links and FAQ remain usable without JavaScript. Motion respects reduced-motion preferences.
