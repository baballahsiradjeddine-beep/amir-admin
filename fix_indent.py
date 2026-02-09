import re

# Read the file
with open('d:/bossamir/app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix line 937 - remove extra indentation from fragment close
content = content.replace('                            </>', '                        </>')

# Fix line 938 - remove extra indentation from condition close  
content = content.replace('                          )}', '                      )}', 1)

# Write back
with open('d:/bossamir/app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('File fixed successfully!')
