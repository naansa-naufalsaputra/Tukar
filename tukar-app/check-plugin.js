try {
    const path = require.resolve('react-native-worklets/plugin');
    console.log('Path:', path);
    const plugin = require(path);
    console.log('Plugin loaded successfully');
} catch (e) {
    console.error('Error:', e.message);
    if (e.code === 'MODULE_NOT_FOUND') {
        console.log('Searching for nearby modules...');
        try {
            console.log('Reanimated plugin path:', require.resolve('react-native-reanimated/plugin'));
        } catch (e2) {
            console.log('Reanimated plugin not found either');
        }
    }
}
