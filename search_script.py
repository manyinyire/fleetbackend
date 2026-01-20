import os

def search_files(directory, term):
    matches = []
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.next' in dirs:
            dirs.remove('.next')
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if term in content:
                            matches.append(path)
                except Exception as e:
                    print(f"Could not read {path}: {e}")
    return matches

print("Searching for 'next/document'...")
results = search_files('.', 'next/document')
for r in results:
    print(f"Found in: {r}")

print("\nSearching for '<Html'...")
results_html = search_files('.', '<Html')
for r in results_html:
    print(f"Found in: {r}")
