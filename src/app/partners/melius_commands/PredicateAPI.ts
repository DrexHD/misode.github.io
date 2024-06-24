import { BooleanNode, Case, ChoiceNode, CollectionRegistry, ListNode, NumberNode, ObjectNode, Opt, Reference as RawReference, StringNode as RawStringNode, SchemaRegistry, Switch } from "@mcschema/core"

const ID = 'predicate_api'

export function initPredicates(schemas: SchemaRegistry, collections: CollectionRegistry) {
	const Reference = RawReference.bind(undefined, schemas)
	const StringNode = RawStringNode.bind(undefined, collections)

	schemas.register(`${ID}:choice`,
		ChoiceNode([
			{
				type: 'string',
				node: StringNode(),
			},
			{
				type: 'integer',
				node: NumberNode({ integer: true })
			},
			{
				type: 'object',
				node: Reference(ID)
			}
		])
	)

	const types = [
		'all',
		'any',
		'equal',
		'less_than',
		'less_or_equal',
		'more_than',
		'more_or_equal',
		'negate',
		'operator',
		'statistic',
		'entity',
		'permission',
		'permission_option',
		'placeholder',
		'has_entity',
		'has_player',
		'has_world',
		'has_game_profile',
		'starts_with',
		'ends_with'
	]

	schemas.register(`${ID}`, ObjectNode({
		type: RawStringNode(undefined, { enum: types }),
		[Switch]: [{ push: 'type' }],
		[Case]: {
			'all': {
				values: ListNode(Reference(ID))
			},
			'any': {
				values: ListNode(Reference(ID))
			},
			'equal': {
				value_1: Reference(`${ID}:choice`),
				value_2: Reference(`${ID}:choice`),
			},
			'less_than': {
				value_1: Reference(`${ID}:choice`),
				value_2: Reference(`${ID}:choice`),
			},
			'less_or_equal': {
				value_1: Reference(`${ID}:choice`),
				value_2: Reference(`${ID}:choice`),
			},
			'more_than': {
				value_1: Reference(`${ID}:choice`),
				value_2: Reference(`${ID}:choice`),
			},
			'more_or_equal': {
				value_1: Reference(`${ID}:choice`),
				value_2: Reference(`${ID}:choice`),
			},
			'negate': {
				value: Reference(ID)
			},
			'operator': {
				operator: NumberNode({ integer: true })
			},
			'statistic': {
				stat_type: StringNode({ validator: 'resource', params: { pool: 'stat_type' } }),
				key: StringNode(),

				[Switch]: ['pop', { push: 'stat_type' }],
				[Case]: {
					'minecraft:mined': {
						key: StringNode({ validator: 'resource', params: { pool: 'block' } })
					},
					'minecraft:crafted': {
						key: StringNode({ validator: 'resource', params: { pool: 'item' } })
					},
					'minecraft:used': {
						key: StringNode({ validator: 'resource', params: { pool: 'item' } })
					},
					'minecraft:broken': {
						key: StringNode({ validator: 'resource', params: { pool: 'item' } })
					},
					'minecraft:picked_up': {
						key: StringNode({ validator: 'resource', params: { pool: 'item' } })
					},
					'minecraft:dropped': {
						key: StringNode({ validator: 'resource', params: { pool: 'item' } })
					},
					'minecraft:killed': {
						key: StringNode({ validator: 'resource', params: { pool: 'entity_type' } })
					},
					'minecraft:killed_by': {
						key: StringNode({ validator: 'resource', params: { pool: 'entity_type' } })
					},
					'minecraft:custom': {
						key: StringNode({ validator: 'resource', params: { pool: 'custom_stat' } })
					}
				}
			},
			'entity': {
				value: Reference('entity_predicate')
			},
			'permission': {
				permission: StringNode(),
				operator: Opt(NumberNode({ integer: true }))
			},
			'permission_option': {
				option: StringNode()
			},
			'placeholder': {
				placeholder: StringNode(),
				raw: Opt(BooleanNode())
			},
			'has_entity': {},
			'has_player': {},
			'has_world': {},
			'has_game_profile': {},
			'starts_with': {
				input: Reference(`${ID}:choice`),
				argument: Reference(`${ID}:choice`),
			},
			'ends_with': {
				input: Reference(`${ID}:choice`),
				argument: Reference(`${ID}:choice`),
			}
		}
	}))
}
