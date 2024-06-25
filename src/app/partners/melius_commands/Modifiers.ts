import { Case, ChoiceNode, CollectionRegistry, ListNode, ObjectNode, Opt, Reference as RawReference, StringNode as RawStringNode, SchemaRegistry, Switch } from "@mcschema/core"

const ID = 'melius_commands'

export function initModifiers(schemas: SchemaRegistry, collections: CollectionRegistry) {
	const Reference = RawReference.bind(undefined, schemas)
	const StringNode = RawStringNode.bind(undefined, collections)

	const matcher_types = [
		'command:strict',
		'command:starts_with',
		'command:regex',
		'node:strict',
		'node:starts_with',
		'node:regex'
	]

	const stringOrStringList = ChoiceNode([
		{
			type: 'string',
			node: StringNode()
		},
		{
			type: 'list',
			node: ListNode(StringNode())
		}
	])

	schemas.register(`${ID}:matcher`, ObjectNode({
		type: RawStringNode(undefined, { enum: matcher_types }),
		[Switch]: [{ push: 'type' }],
		[Case]: {
			'command:strict': {
				commands: stringOrStringList,
				execution_modifiers: ListNode(Reference(`${ID}:execution_modifier`))
			},
			'command:starts_with': {
				commands: stringOrStringList,
				execution_modifiers: ListNode(Reference(`${ID}:execution_modifier`))
			},
			'command:regex': {
				regexes: stringOrStringList,
				execution_modifiers: ListNode(Reference(`${ID}:execution_modifier`))
			},
			'node:strict': {
				paths: stringOrStringList,
				requirement_modifier: Opt(Reference(`${ID}:requirement_modifier`)),
				execution_modifiers: Opt(ListNode(Reference(`${ID}:execution_modifier`)))
			},
			'node:starts_with': {
				paths: stringOrStringList,
				requirement_modifier: Opt(Reference(`${ID}:requirement_modifier`)),
				execution_modifiers: Opt(ListNode(Reference(`${ID}:execution_modifier`)))
			},
			'node:regex': {
				regexes: stringOrStringList,
				requirement_modifier: Opt(Reference(`${ID}:requirement_modifier`)),
				execution_modifiers: Opt(ListNode(Reference(`${ID}:execution_modifier`)))
			},
		}
	}))

	const execution_modifier_types = [
		'predicate:add',
	]
	schemas.register(`${ID}:execution_modifier`, ObjectNode({
		type: RawStringNode(undefined, { enum: execution_modifier_types }),
		[Switch]: [{ push: 'type' }],
		[Case]: {
			'predicate:add': {
				predicate: Reference('predicate_api'),
				failure: Opt(ChoiceNode([
					{
						type: 'object',
						node: Reference(`${ID}:action`)
					},
					{
						type: 'list',
						node: ListNode(Reference(`${ID}:action`))
					}
				]))
			},
		}
	}))

	const requirement_modifier_types = [
		'requirement:and',
		'requirement:or',
		'requirement:replace',
	]
	schemas.register(`${ID}:requirement_modifier`, ObjectNode({
		type: RawStringNode(undefined, { enum: requirement_modifier_types }),
		[Switch]: [{ push: 'type' }],
		[Case]: {
			'requirement:and': {
				predicate: Reference('predicate_api')
			},
			'requirement:or': {
				predicate: Reference('predicate_api')
			},
			'requirement:replace': {
				predicate: Reference('predicate_api')
			},
		}
	}))
}
