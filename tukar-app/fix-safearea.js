const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = dir + '/' + file;
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(walkDir(file));
            } else {
                if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
            }
        });
    } catch (e) { }
    return results;
}

const files = walkDir('D:/Coding/tukar/tukar-app/src');
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Simple check
    if (content.includes('SafeAreaView') && content.includes('react-native') && !content.includes('react-native-safe-area-context')) {
        // replace
        content = 'import { SafeAreaView } from "react-native-safe-area-context";\n' + content;
        // simple remove 'SafeAreaView,' or ', SafeAreaView' or 'SafeAreaView'
        content = content.replace(/,\s*SafeAreaView/, '');
        content = content.replace(/SafeAreaView\s*,/, '');
        content = content.replace(/\{\s*SafeAreaView\s*\}/, '{}');

        // cleanup empty exports
        content = content.replace(/import\s*\{\s*\}\s*from\s*['"]react-native['"];?\n?/, '');

        fs.writeFileSync(file, content);
        console.log('Fixed', file);
        count++;
    } else if (content.includes('SafeAreaView') && content.includes('react-native-safe-area-context')) {
        // Check if it's ALSO in react-native
        if (content.match(/import\s+\{[^}]*SafeAreaView[^}]*\}\s+from\s+['"]react-native['"]/)) {
            content = content.replace(/,\s*SafeAreaView/, '');
            content = content.replace(/SafeAreaView\s*,/, '');
            content = content.replace(/import\s*\{\s*SafeAreaView\s*\}\s*from\s*['"]react-native['"];?\n?/, '');
            fs.writeFileSync(file, content);
            console.log('Fixed Double Import', file);
            count++;
        }
    }
});

console.log('Total fixed:', count);
