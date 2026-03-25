module.exports = function (api) {
    api.cache(true);
    console.log("BABEL CONFIG LOADED: react-native-worklets/plugin resolution:", require.resolve('react-native-worklets/plugin'));
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind", reanimated: false }],
            "nativewind/babel",
        ],
        plugins: [
            [
                "module-resolver",
                {
                    alias: {
                        "@": "./src",
                    },
                },
            ],
            require.resolve("react-native-worklets/plugin"),
        ],
    };
};
