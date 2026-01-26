const fs = require('fs');
const path = require('path');

const dictionaryPath = path.resolve(__dirname, '../src/dictionary.json');
const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
const context = dictionary.context;

// Use regex to find entries in the entire text
// Pattern: word [optional variation] definition: example_wolio, example_id [;|.]
// We look for a colon and then try to capture what's before it as word/def and after it as examples.
const entries = [];
const blocks = context.split(/;|\n/);

let startParsing = false;

for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    if (block.includes('aadari sala aadari')) {
        startParsing = true;
    }

    if (!startParsing) continue;

    const colonIndex = block.indexOf(':');
    if (colonIndex > 0) {
        const head = block.substring(0, colonIndex).trim();
        const tail = block.substring(colonIndex + 1).trim();

        // Head usually contains "word definition"
        // Tail usually contains "example_wolio, example_id"

        const headParts = head.split(/\s+/);
        if (headParts.length >= 2) {
            const word = headParts[0];
            const definition = headParts.slice(1).join(' ');

            const tailParts = tail.split(/,|\.\s/);
            const example_wolio = tailParts[0] ? tailParts[0].trim() : '';
            const example_id = tailParts[1] ? tailParts[1].trim() : '';

            entries.push({
                word: word,
                definition: definition,
                example_wolio: example_wolio,
                example_id: example_id
            });
        }
    }
}

const structuredDictionary = {
    name: dictionary.name,
    sources: dictionary.sources,
    entries: entries
};

fs.writeFileSync(dictionaryPath, JSON.stringify(structuredDictionary, null, 2));
console.log(`Parsed ${entries.length} entries into structured dictionary.`);
