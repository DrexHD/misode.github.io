import {
  BooleanNode,
  Case, CollectionRegistry, INode, ListNode,
  Mod, ModelPath, NodeChildren, NumberNode,
  ObjectNode, Opt, Path, Reference as RawReference, SchemaRegistry, StringNode as RawStringNode, Switch,
  SwitchNode
} from '@mcschema/core'
import { FunctionCases } from './Common.js'
import { LootContext, LootCopySources, LootEntitySources, LootFunctions, LootTableTypes } from './LootContext.js'

const ID = 'villagerconfig'

export function initLootTableSchemas(schemas: SchemaRegistry, collections: CollectionRegistry) {
  const Reference = RawReference.bind(undefined, schemas)
  const StringNode = RawStringNode.bind(undefined, collections)

  const conditions: NodeChildren = {
    conditions: Opt(ListNode(
      Reference('loot_condition')
    ))
  }

  const functionsAndConditions: NodeChildren = {
    functions: Opt(ListNode(
      Reference(`${ID}:loot_function`)
    )),
    ...conditions
  }

  function compileSwitchNode(contextMap: Map<string, LootContext[]>, collectionID: string, getNode: (type: string | string[]) => INode): INode {
    const cases: { match: (path: ModelPath) => boolean, node: INode }[] = []
    const getAvailableOptions = (providedContext: LootContext[]) => collections
      .get(collectionID)
      .filter(t => {
        const requiredContext = contextMap.get(t) ?? []
        return requiredContext.every(c => providedContext.includes(c))
      })
    for (const [tableType, { allows, requires }] of LootTableTypes) {
      const providedContext = [...allows, ...requires]
      cases.push({
        match: path => path.getModel().get(new Path(['type'])) === tableType,
        node: getNode(getAvailableOptions(providedContext))
      })
    }
    cases.push({ match: _ => true, node: getNode(collectionID) })
    return SwitchNode(cases)
  }

  const functionIDSwtichNode = compileSwitchNode(LootFunctions, `${ID}:loot_function_type`, type => StringNode({ enum: type }))
  const entitySourceSwtichNode = compileSwitchNode(LootEntitySources, 'entity_source', type => StringNode({ enum: type }))
  const copySourceSwtichNode = compileSwitchNode(LootCopySources, 'copy_source', type => StringNode({ enum: type}))

  schemas.register(`${ID}:loot_table`, Mod(ObjectNode({
    type: Opt(StringNode({ validator: "resource", params: { pool: collections.get('loot_context_type') } })),
    pools: Opt(ListNode(
      Mod(ObjectNode({
        rolls: Reference(`${ID}:number_provider`),
        bonus_rolls: Opt(Reference(`${ID}:number_provider`)),
        entries: ListNode(
          Reference(`${ID}:loot_entry`)
        ),
        ...functionsAndConditions
      }, { category: 'pool', context: 'loot_pool' }), {
        default: () => ({
          rolls: 1,
          entries: [{
            type: 'minecraft:item',
            name: 'minecraft:stone'
          }]
        })
      })
    )),
    functions: Opt(ListNode(
      Reference(`${ID}:loot_function`)
    ))
  }, { context: 'loot_table' }), {
    default: () => ({
      pools: [{
        rolls: 1,
        entries: [{
          type: 'minecraft:item',
          name: 'minecraft:stone'
        }]
      }]
    })
  }))

  const weightMod: Partial<INode> = {
    enabled: path => path.pop().get()?.length > 1
      && !['minecraft:alternatives', 'minecraft:group', 'minecraft:sequence'].includes(path.push('type').get())
  }

  schemas.register(`${ID}:loot_entry`, Mod(ObjectNode({
    type: StringNode({ validator: 'resource', params: { pool: 'loot_pool_entry_type' } }),
    weight: Opt(Mod(NumberNode({ integer: true, min: 1 }), weightMod)),
    quality: Opt(Mod(NumberNode({ integer: true }), weightMod)),
    [Switch]: [{ push: 'type' }],
    [Case]: {
      'minecraft:alternatives': {
        children: ListNode(
          Reference(`${ID}:loot_entry`)
        ),
        ...functionsAndConditions
      },
      'minecraft:dynamic': {
        name: StringNode(),
        ...functionsAndConditions
      },
      'minecraft:group': {
        children: ListNode(
          Reference(`${ID}:loot_entry`)
        ),
        ...functionsAndConditions
      },
      'minecraft:item': {
        name: StringNode({ validator: 'resource', params: { pool: 'item' } }),
        ...functionsAndConditions
      },
      'minecraft:loot_table': {
        name: StringNode({ validator: 'resource', params: { pool: '$loot_table' } }),
        ...functionsAndConditions
      },
      'minecraft:sequence': {
        children: ListNode(
          Reference(`${ID}:loot_entry`)
        ),
        ...functionsAndConditions
      },
      'minecraft:tag': {
        name: StringNode({ validator: 'resource', params: { pool: '$tag/item' } }),
        expand: Opt(BooleanNode()),
        ...functionsAndConditions
      }
    }
  }, { context: 'loot_entry' }), {
    default: () => ({
      type: 'minecraft:item',
      name: 'minecraft:stone'
    })
  }))

  schemas.register(`${ID}:loot_function`, Mod(ObjectNode({
    function: functionIDSwtichNode,
    [Switch]: [{ push: 'function' }],
    [Case]: FunctionCases(conditions, copySourceSwtichNode, entitySourceSwtichNode)
  }, { category: 'function', context: 'function' }), {
    default: () => ({
      function: 'minecraft:set_count',
      count: 1
    })
  }))
}
