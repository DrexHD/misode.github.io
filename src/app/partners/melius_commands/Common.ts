import { BooleanNode, ChoiceNode, CollectionRegistry, NumberNode, ObjectNode, Opt, StringNode as RawStringNode, SchemaRegistry } from "@mcschema/core"

const ID = "melius_commands"

export function initCommon(schemas: SchemaRegistry, collections: CollectionRegistry) {
	const StringNode = RawStringNode.bind(undefined, collections)

	schemas.register(`${ID}:action`, ChoiceNode(
		[
			{
				type: 'string',
				node: StringNode()
			},
			{
				type: 'object',
				node: ObjectNode({
					command: StringNode(),
					as_console: Opt(BooleanNode()),
					silent: Opt(BooleanNode()),
					op_level: Opt(NumberNode({ integer: true}))
				})
			}
		]
	))

}
