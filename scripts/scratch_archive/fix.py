import re

with open('scratch_script_3.py', 'r', encoding='utf-8') as f:
    script3 = f.read()

# Extract the modals string safely
modals_part = script3.split('modals = """\n')[1].split('"""\ncontent =')[0]

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(modals_part, '')

# Add the modals part at the very end of SettingsPage
# The file ends with:
#     </div>
#   );
# }

last_part = """    </div>
  );
}
"""

if content.endswith(last_part):
    content = content[:-len(last_part)] + modals_part + last_part
else:
    # try replacing the last occurrence
    content = last_part.join(content.rsplit(last_part, 1))
    content = content.replace(last_part, modals_part + last_part)
    
with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
