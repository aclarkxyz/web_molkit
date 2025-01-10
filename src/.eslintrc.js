module.exports =
{
	'parser': '@typescript-eslint/parser',
	'plugins': ['@typescript-eslint'],
	'parserOptions':
	{
		'ecmaVersion': 2018
	},
	'rules':
	{
		// all functions must return a value; this also includes inline functions, which are not currently enforced
		'@typescript-eslint/explicit-function-return-type': 0,

		'@typescript-eslint/array-type': ['error', {'default': 'array'}],
		//'@typescript-eslint/camelcase': ['error', {'properties': 'always'}],
		//'@typescript-eslint/class-name-casing': ['error'],
		'@typescript-eslint/naming-convention':
		[
			'error',
			{'selector': 'default', 'format': ['camelCase']},
			{'selector': 'variable', 'leadingUnderscore': 'allow', 'format': ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case']},
			{'selector': 'enumMember', 'format': ['PascalCase']},
			{'selector': 'typeLike', 'format': ['PascalCase']},
			{'selector': 'function', 'format': ['camelCase', 'snake_case']},
			/*{'selector': 'property', 'modifiers': ['static'], 'format': ['camelCase', 'UPPER_CASE']},
			{'selector': 'property', 'modifiers': ['public'], 'format': ['camelCase', 'PascalCase']},
			{'selector': 'property', 'modifiers': ['private'], 'format': ['camelCase', 'PascalCase']},
			{'selector': 'property', 'modifiers': ['protected'], 'format': ['camelCase', 'PascalCase']},*/
			{'selector': 'property', 'format': ['camelCase', 'PascalCase', 'UPPER_CASE']},
			{'selector': 'parameter', 'format': ['camelCase', 'PascalCase']}
		],

		// this seems to be broken with regard to constructors
		'@typescript-eslint/explicit-member-accessibility': 0,

		'@typescript-eslint/func-call-spacing': ['error', 'never'],
		'arrow-parens': ['error', 'always'],
		'arrow-body-style': 0,

		//capitalized-comments : may be possible to tweak
		//spaced-comment : ditto

		'new-parens': ['error'],
		//'@typescript-eslint/no-angle-bracket-type-assertion': ['error'],

		'no-multiple-empty-lines': ['error', {'max': 1, "maxEOF": 10}],
		'no-irregular-whitespace': ['error', {'skipStrings': true}],
		'no-trailing-spaces': ['error', {'skipBlankLines': true, 'ignoreComments': true}],
		'no-multi-spaces': ['error'],
		'no-undef-init': ['error'],
		//'quote-props': ['error', 'always'],
		'semi': ['error', 'always'],
		'space-before-function-paren': ['error', {'anonymous': 'never', 'named': 'never', 'asyncArrow': 'always'}],
		'space-in-parens': ['error', 'never'],
		/*'@typescript-eslint/member-delimiter-style':
		[
			'error',
			{
				'multiline': {'delimiter': 'semi', 'requireLast': true}, 
				'singleline': {'delimiter': 'semi', 'requireLast': false}
			},
		],*/
		'no-extra-semi': ['error'],
		'no-self-assign': ['error'],
		'no-self-compare': ['error'],
		'array-bracket-spacing': ['error', 'never'],
		'object-curly-spacing': ['error', 'never'],
		'brace-style': ['error', 'allman', {'allowSingleLine': true}],
		'comma-spacing': ['error'],
		'func-call-spacing': ['error'],
		'key-spacing': ['error'],
		'keyword-spacing': ['error'],
		'linebreak-style': ['error', 'unix'],
	},
};


