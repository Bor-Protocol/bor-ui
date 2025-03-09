#!/bin/bash

# File name for the structure output
STRUCTURE_FILE="structure.mdc"

# Function to generate the tree structure
generate_tree() {
    echo "# Project Structure" > "$STRUCTURE_FILE"
    echo "" >> "$STRUCTURE_FILE"
    echo "\`\`\`" >> "$STRUCTURE_FILE"
    
    # Using tree command with specific formatting and ignores
    tree -I 'node_modules|.git|.idea|venv|__pycache__|*.pyc' \
         --dirsfirst \
         -F \
         --noreport \
         >> "$STRUCTURE_FILE"
    
    echo "\`\`\`" >> "$STRUCTURE_FILE"
    
    echo "Structure updated in $STRUCTURE_FILE"
}

# Check if tree command is installed
if ! command -v tree &> /dev/null; then
    echo "The 'tree' command is not installed. Installing..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install tree
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install tree
    else
        echo "Please install 'tree' command manually for your system"
        exit 1
    fi
fi

# Initial generation
generate_tree

# Watch for changes and update
if command -v fswatch &> /dev/null; then
    echo "Watching for changes (Press Ctrl+C to stop)..."
    fswatch -o . | while read f; do
        generate_tree
    done
else
    echo "Note: Install 'fswatch' for automatic updates on file changes"
    echo "For macOS: brew install fswatch"
    echo "For Linux: sudo apt-get install fswatch"
    echo "Structure has been generated once. Run script again to update."
fi