with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('Trash2, Webhook, RefreshCw } from "lucide-react";', 'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal } from "lucide-react";')

with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
