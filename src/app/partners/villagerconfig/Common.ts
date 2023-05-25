import {
  BooleanNode, Case, ChoiceNode, CollectionRegistry, INode, ListNode, MapNode, Mod, NestedNodeChildren, NodeChildren, NumberNode, ObjectNode, Opt, Reference as RawReference, ResourceType, SchemaRegistry, StringNode as RawStringNode, Switch
} from '@mcschema/core'

export let ConditionCases: (entitySourceNode?: INode<any>) => NestedNodeChildren
export let FunctionCases: (conditions: NodeChildren, copySourceNode?: INode<any>, entitySourceNode?: INode<any>) => NestedNodeChildren

const ID = 'villagerconfig' // VillagerConfig

export function initCommonSchemas(schemas: SchemaRegistry, collections: CollectionRegistry) {
  const StringNode = RawStringNode.bind(undefined, collections)
  const Reference = RawReference.bind(undefined, schemas)

  // VillagerConfig - Start
  collections.register(`${ID}:loot_function_type`, [
    'minecraft:apply_bonus',
    'minecraft:copy_name',
    'minecraft:copy_nbt',
    'minecraft:copy_state',
    'minecraft:enchant_randomly',
    'minecraft:enchant_with_levels',
    'minecraft:exploration_map',
    'minecraft:explosion_decay',
    'minecraft:fill_player_head',
    'minecraft:furnace_smelt',
    'minecraft:limit_count',
    'minecraft:looting_enchant',
    'minecraft:set_attributes',
    'minecraft:set_banner_pattern',
    'minecraft:set_contents',
    'minecraft:set_count',
    'minecraft:set_damage',
    'minecraft:set_enchantments',
    'minecraft:set_instrument',
    'minecraft:set_loot_table',
    'minecraft:set_lore',
    'minecraft:set_name',
    'minecraft:set_nbt',
    'minecraft:set_potion',
    'minecraft:set_stew_effect',
    'villagerconfig:enchant_randomly',
    'villagerconfig:set_dye'
  ])
  // VillagerConfig - End

  const ObjectWithType = (pool: ResourceType, directType: string, directPath: string, directDefault: string, objectDefault: string | null, context: string, cases: NestedNodeChildren) => {
    let defaultCase: NodeChildren = {}
    if (objectDefault) {
      Object.keys(cases[objectDefault]).forEach(k => {
        defaultCase[k] = Mod(cases[objectDefault][k], {
          enabled: path => path.push('type').get() === undefined
        })
      })
    }
    const provider = ObjectNode({
      type: Mod(Opt(StringNode({ validator: 'resource', params: { pool } })), {
        hidden: () => true
      }),
      [Switch]: [{ push: 'type' }],
      [Case]: cases,
      ...defaultCase
    }, { context, disableSwitchContext: true })

    const choices: any[] = [{
      type: directType,
      node: cases[directDefault][directPath]
    }]
    if (objectDefault) {
      choices.push({
        type: 'object',
        priority: -1,
        node: provider
      })
    }
    Object.keys(cases).forEach(k => {
      choices.push({
        type: k,
        match: (v: any) => {
          const type = 'minecraft:' + v?.type?.replace(/^minecraft:/, '')
          if (type === k) return true
          const keys = v ? Object.keys(v) : []
          return typeof v === 'object' && (keys?.length === 0 || (keys?.length === 1 && keys?.[0] === 'type'))
        },
        node: provider,
        change: () => ({type: k})
      })
    })
    return ChoiceNode(choices, { context, choiceContext: `${context}.type` })
  }

  schemas.register(`${ID}:number_provider`, ObjectWithType(
    'loot_number_provider_type',
    'number', 'value', 'minecraft:constant',
    'minecraft:uniform',
    `${ID}:number_provider`,
    {
      'minecraft:constant': {
        value: NumberNode()
      },
      'minecraft:uniform': {
        min: Reference(`${ID}:number_provider`),
        max: Reference(`${ID}:number_provider`)
      },
      'minecraft:binomial': {
        n: Reference(`${ID}:number_provider`),
        p: Reference(`${ID}:number_provider`)
      },
      'minecraft:score': {
        target: Reference('scoreboard_name_provider'),
        score: StringNode({ validator: 'objective' }),
        scale: Opt(NumberNode())
      },
      // VillagerConfig - Start
      'villagerconfig:add': {
        addends: ListNode(Reference(`${ID}:number_provider`))
      },
      'villagerconfig:multiply': {
        factors: ListNode(Reference(`${ID}:number_provider`))
      },
      'villagerconfig:reference': {
        id: StringNode()
      }
      // VillagerConfig - End
    }))

  ConditionCases = (entitySourceNode: INode<any> = StringNode({ enum: 'entity_source' })) => ({
    'minecraft:alternative': {
      terms: ListNode(
        Reference('condition')
      )
    },
    'minecraft:block_state_property': {
      block: StringNode({ validator: 'resource', params: { pool: 'block' } }),
      properties: MapNode(
        StringNode(),
        StringNode(),
        { validation: { validator: 'block_state_map', params: { id: ['pop', { push: 'block' }] } } }
      )
    },
    'minecraft:damage_source_properties': {
      predicate: Reference('damage_source_predicate')
    },
    'minecraft:entity_properties': {
      entity: entitySourceNode,
      predicate: Reference('entity_predicate')
    },
    'minecraft:entity_scores': {
      entity: entitySourceNode,
      scores: MapNode(
        StringNode({ validator: 'objective' }),
        Reference('int_range')
      )
    },
    'minecraft:inverted': {
      term: Reference('condition')
    },
    'minecraft:killed_by_player': {
      inverse: Opt(BooleanNode())
    },
    'minecraft:location_check': {
      offsetX: Opt(NumberNode({ integer: true })),
      offsetY: Opt(NumberNode({ integer: true })),
      offsetZ: Opt(NumberNode({ integer: true })),
      predicate: Reference('location_predicate')
    },
    'minecraft:match_tool': {
      predicate: Reference('item_predicate')
    },
    'minecraft:random_chance': {
      chance: NumberNode({ min: 0, max: 1 })
    },
    'minecraft:random_chance_with_looting': {
      chance: NumberNode({ min: 0, max: 1 }),
      looting_multiplier: NumberNode()
    },
    'minecraft:reference': {
      name: StringNode({ validator: 'resource', params: { pool: '$predicate' } })
    },
    'minecraft:table_bonus': {
      enchantment: StringNode({ validator: 'resource', params: { pool: 'enchantment' } }),
      chances: ListNode(
        NumberNode({ min: 0, max: 1 })
      )
    },
    'minecraft:time_check': {
      value: Reference('int_range'),
      period: Opt(NumberNode({ integer: true }))
    },
    'minecraft:value_check': {
      value: Reference(`${ID}:number_provider`),
      range: Reference('int_range')
    },
    'minecraft:weather_check': {
      raining: Opt(BooleanNode()),
      thundering: Opt(BooleanNode())
    }
  })

  FunctionCases = (conditions: NodeChildren, copySourceNode: INode<any> = StringNode({ enum: 'copy_source' }), entitySourceNode: INode<any> = StringNode({ enum: 'entity_source' })) => {
    const cases: NestedNodeChildren = {
      'minecraft:apply_bonus': {
        enchantment: StringNode({ validator: 'resource', params: { pool: 'enchantment' } }),
        formula: StringNode({ validator: 'resource', params: { pool: collections.get('loot_table_apply_bonus_formula') } }),
        parameters: Mod(ObjectNode({
          bonusMultiplier: Mod(NumberNode(), {
            enabled: path => path.pop().push('formula').get() === 'minecraft:uniform_bonus_count'
          }),
          extra: Mod(NumberNode(), {
            enabled: path => path.pop().push('formula').get() === 'minecraft:binomial_with_bonus_count'
          }),
          probability: Mod(NumberNode(), {
            enabled: path => path.pop().push('formula').get() === 'minecraft:binomial_with_bonus_count'
          })
        }), {
          enabled: path => path.push('formula').get() !== 'minecraft:ore_drops'
        })
      },
      'minecraft:copy_name': {
        source: copySourceNode
      },
      'minecraft:copy_nbt': {
        source: Reference('nbt_provider'),
        ops: ListNode(
          ObjectNode({
            source: StringNode({ validator: 'nbt_path', params: { category: { getter: 'copy_source', path: ['pop', 'pop', 'pop', { push: 'source' }] } } }),
            target: StringNode({ validator: 'nbt_path', params: { category: 'minecraft:item' } }),
            op: StringNode({ enum: ['replace', 'append', 'merge'] })
          }, { context: 'nbt_operation' })
        )
      },
      'minecraft:copy_state': {
        block: StringNode({ validator: 'resource', params: { pool: 'block' } }),
        properties: ListNode(
          StringNode({ validator: 'block_state_key', params: { id: ['pop', 'pop', { push: 'block' }] } })
        )
      },
      'minecraft:enchant_randomly': {
        enchantments: Opt(ListNode(
          StringNode({ validator: 'resource', params: { pool: 'enchantment' } })
        ))
      },
      'minecraft:enchant_with_levels': {
        levels: Reference(`${ID}:number_provider`),
        treasure: Opt(BooleanNode())
      },
      'minecraft:exploration_map': {
        destination: Opt(StringNode({ validator: 'resource', params: { pool: '$tag/worldgen/structure' } })),
        decoration: Opt(StringNode({ enum: 'map_decoration' })),
        zoom: Opt(NumberNode({ integer: true })),
        search_radius: Opt(NumberNode({ integer: true })),
        skip_existing_chunks: Opt(BooleanNode())
      },
      'minecraft:fill_player_head': {
        entity: entitySourceNode
      },
      'minecraft:limit_count': {
        limit: Reference('int_range')
      },
      'minecraft:looting_enchant': {
        count: Reference(`${ID}:number_provider`),
        limit: Opt(NumberNode({ integer: true }))
      },
      'minecraft:set_attributes': {
        modifiers: ListNode(
          Reference('attribute_modifier')
        )
      },
      'minecraft:set_banner_pattern': {
        patterns: ListNode(
          ObjectNode({
            pattern: StringNode({ enum: 'banner_pattern' }),
            color: StringNode({ enum: 'dye_color' })
          })
        ),
        append: Opt(BooleanNode())
      },
      'minecraft:set_contents': {
        type: StringNode({ validator: 'resource', params: { pool: 'block_entity_type' } }),
        entries: ListNode(
          Reference(`${ID}:loot_entry`)
        )
      },
      'minecraft:set_count': {
        count: Reference(`${ID}:number_provider`),
        add: Opt(BooleanNode())
      },
      'minecraft:set_damage': {
        damage: Reference(`${ID}:number_provider`),
        add: Opt(BooleanNode())
      },
      'minecraft:set_enchantments': {
        enchantments: MapNode(
          StringNode({ validator: 'resource', params: { pool: 'enchantment' } }),
          Reference(`${ID}:number_provider`)
        ),
        add: Opt(BooleanNode())
      },
      'minecraft:set_instrument': {
        options: StringNode({ validator: 'resource', params: { pool: 'instrument', requireTag: true } })
      },
      'minecraft:set_loot_table': {
        type: StringNode({ validator: 'resource', params: { pool: 'block_entity_type' } }),
        name: StringNode({ validator: 'resource', params: { pool: '$loot_table' } }),
        seed: Opt(NumberNode({ integer: true }))
      },
      'minecraft:set_lore': {
        entity: Opt(entitySourceNode),
        lore: ListNode(
          Reference('text_component')
        ),
        replace: Opt(BooleanNode())
      },
      'minecraft:set_name': {
        entity: Opt(entitySourceNode),
        name: Opt(Reference('text_component'))
      },
      'minecraft:set_nbt': {
        tag: StringNode({ validator: 'nbt', params: { registry: { category: 'minecraft:item' } } })
      },
      'minecraft:set_potion': {
        id: StringNode({ validator: 'resource', params: { pool: 'potion' } })
      },
      'minecraft:set_stew_effect': {
        effects: Opt(ListNode(
          ObjectNode({
            type: StringNode({ validator: 'resource', params: { pool: 'mob_effect' } }),
            duration: Reference(`${ID}:number_provider`)
          })
        ))
      },
      'villagerconfig:enchant_randomly': {
        include: Opt(ListNode(
          StringNode({ validator: 'resource', params: { pool: 'enchantment' } })
        )),
        exclude: Opt(ListNode(
          StringNode({ validator: 'resource', params: { pool: 'enchantment' } })
        )),
        trade_enchantments: Opt(BooleanNode())
      },
      'villagerconfig:set_dye': {
        dye_colors: Opt(ListNode(
          StringNode()
        )),
        add: Opt(BooleanNode())
      },
    }
    const res: NestedNodeChildren = {}
    collections.get(`${ID}:loot_function_type`).forEach(f => {
      res[f] = {...cases[f], ...conditions }
    })
    return res
  }
}
