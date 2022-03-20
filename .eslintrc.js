module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "prettier",
        "eslint:recommended",
        'airbnb-base',
        'airbnb-typescript/base',
        "plugin:@typescript-eslint/recommended",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "project": './tsconfig.json'
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "object-curly-newline": ["off"],
        "no-constant-condition": 0,
        "max-len": ["error", { "code": 200 }],
        "no-plusplus": 0,
        "no-continue": 0,
        "@typescript-eslint/no-shadow": 0,
        "class-methods-use-this": 0,
        "import/prefer-default-export": 0,
        "no-underscore-dangle": 0,
        "prefer-destructuring": 0,
    }
}
