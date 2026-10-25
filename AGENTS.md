# Project rules
- Keep homepage presentation in the home component and city detection/ranking in reusable geography helpers, so destination changes remain consistent without altering rental filters.
- Use one carousel index for homepage foreground and backdrop, and a shared furnished-suggestion eligibility helper, so image navigation and suggestion scope cannot diverge.
- Route mobile discovery through Resultats with a shared filtered dataset for list and map, retaining the map in the DOM between views so exploration stays synchronized.
- Use a shared compact mobile discovery card for homepage, results, and map previews so thumbnail information stays consistent without changing property detail views.
- Keep the mobile homepage introduction and its scoped styles isolated from the desktop homepage, reusing the shared furnished search suggestions to preserve consistent search eligibility.