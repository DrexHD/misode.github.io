import { ChoiceNode, CollectionRegistry, ListNode, ObjectNode, Opt, Reference as RawReference, StringNode as RawStringNode, SchemaRegistry } from "@mcschema/core"
import { initCommon } from "./Common.js"
import { initPredicates } from "./PredicateAPI.js"

const ID = 'melius_commands'

export function initCommands(schemas: SchemaRegistry, collections: CollectionRegistry) {
    initCommon(schemas, collections)
    initPredicates(schemas, collections)

    const Reference = RawReference.bind(undefined, schemas)
    const StringNode = RawStringNode.bind(undefined, collections)

    schemas.register(`${ID}:commands`, ChoiceNode(
        [
            {
                type: 'object',
                node: Reference(`${ID}:literal`)
            },
            {
                type: 'list',
                node: ListNode(Reference(`${ID}:literal`))
            }
        ]
    ))

    schemas.register(`${ID}:literal`, ObjectNode({
        id: StringNode(),
        literals: Opt(ListNode(Reference(`${ID}:literal`))),
        arguments: Opt(ListNode(Reference(`${ID}:argument`))),
        require: Opt(Reference(`predicate_api`)),
        executes: Opt(ListNode(Reference(`${ID}:action`))),
        redirect: Opt(StringNode())
    }))

    schemas.register(`${ID}:argument`, ObjectNode({
        id: StringNode(),
        type: StringNode({ validator: 'resource', params: { pool: `${ID}:argument_type` as any } }),
        literals: Opt(ListNode(Reference(`${ID}:literal`))),
        arguments: Opt(ListNode(Reference(`${ID}:argument`))),
        require: Opt(Reference(`predicate_api`)),
        executes: Opt(ListNode(Reference(`${ID}:action`))),
        redirect: Opt(StringNode())
    }))

    collections.register(`${ID}:argument_type`, [
        'brigadier:bool',
        'brigadier:double',
        'brigadier:float',
        'brigadier:integer',
        'brigadier:long',
        'brigadier:string',
        'brigadier:string single_word',
        'brigadier:string quotable_phrase',
        'brigadier:string greedy_phrase',
        'minecraft:angle',
        'minecraft:block_pos',
        'minecraft:block_predicate',
        'minecraft:block_state',
        'minecraft:color',
        'minecraft:column_pos',
        'minecraft:component',
        'minecraft:dimension',
        'minecraft:entity',
        'minecraft:entity entity',
        'minecraft:entity entities',
        'minecraft:entity player',
        'minecraft:entity players',
        'minecraft:entity_anchor',
        'minecraft:float_range',
        'minecraft:function',
        'minecraft:game_profile',
        'minecraft:gamemode',
        'minecraft:heightmap',
        'minecraft:int_range',
        'minecraft:item_predicate',
        'minecraft:item_slot',
        'minecraft:item_stack',
        'minecraft:message',
        'minecraft:nbt_compound_tag',
        'minecraft:nbt_path',
        'minecraft:nbt_tag',
        'minecraft:objective',
        'minecraft:objective_criteria',
        'minecraft:operation',
        'minecraft:particle',
        'minecraft:resource',
        'minecraft:resource_key',
        'minecraft:resource_location',
        'minecraft:resource_or_tag',
        'minecraft:resource_or_tag_key',
        'minecraft:rotation',
        'minecraft:score_holder',
        'minecraft:scoreboard_slot',
        'minecraft:style',
        'minecraft:swizzle',
        'minecraft:team',
        'minecraft:template_mirror',
        'minecraft:template_rotation',
        'minecraft:time',
        'minecraft:uuid',
        'minecraft:vec2',
        'minecraft:vec3',
    ])

}
