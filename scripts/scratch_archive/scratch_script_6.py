import re

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicate import
content = content.replace(
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone, ShieldCheck } from "lucide-react";',
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone } from "lucide-react";'
)

with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
