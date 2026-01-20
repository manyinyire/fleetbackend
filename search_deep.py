import os

search_terms = ['next/document', '<Html', 'Html ', 'from "next/document"', "from 'next/document'"]
ignore_dirs = ['node_modules', '.next', '.git', '.vscode']
ignore_exts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.map']

print(f"Searching for {search_terms}...")

for root, dirs, files in os.walk('.'):
    # Filter directories
    dirs[:] = [d for d in dirs if d not in ignore_dirs]
    
        # Check extension
        if not file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            continue
            
        path = os.path.join(root, file)
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                for term in search_terms:
                    if term in content:
                        print(f"MATCH: '{term}' in {path}")
                        lines = content.splitlines()
                        for i, line in enumerate(lines):
                            if term in line:
                                print(f"  Line {i+1}: {line.strip()[:100]}")
        except Exception as e:
            print(f"Error reading {path}: {e}")
