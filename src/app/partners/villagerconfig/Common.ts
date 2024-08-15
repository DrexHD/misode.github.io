import {
  BooleanNode,
  Case,
  ChoiceNode,
  CollectionRegistry,
  INode,
  ListNode,
  MapNode,
  Mod,
  NestedNodeChildren,
  NodeChildren,
  NumberNode,
  ObjectNode,
  Opt,
  Reference as RawReference,
  StringNode as RawStringNode,
  ResourceType,
  SchemaRegistry,
  Switch,
} from '@mcschema/core'

const ID = 'villagerconfig' // VillagerConfig

export let ConditionCases: (entitySourceNode?: INode<any>) => NestedNodeChildren
export let FunctionCases: (conditions: NodeChildren, copySourceNode?: INode<any>, entitySourceNode?: INode<any>) => NestedNodeChildren

type NonTagResources = Exclude<ResourceType, `$tag/${string}`>

type TagConfig = {
  resource: NonTagResources,
  inlineSchema?: string,
}
export let Tag: (config: TagConfig) => INode

export let Filterable: (node: INode) => INode

type SizeLimitedStringConfig = {
  minLength?: number,
  maxLength?: number,
}
export let SizeLimitedString: (config: SizeLimitedStringConfig) => INode

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
      'minecraft:storage': {
        storage: StringNode({ validator: 'resource', params: { pool: '$storage' } }),
        path: StringNode({ validator: 'nbt_path' }),
      },
      'minecraft:enchantment_level': {
        amount: Reference('level_based_value'),
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

  Tag = (config: TagConfig) => ChoiceNode([
    {
      type: 'string',
      node: StringNode({ validator: 'resource', params: { pool: config.resource, allowTag: true } }),
      change: (v: unknown) => {
        if (Array.isArray(v) && typeof v[0] === 'string' && !v[0].startsWith('#')) {
          return v[0]
        }
        return undefined
      }
    },
    {
      type: 'list',
      node: ListNode(
        config.inlineSchema
          ? ChoiceNode([
            {
              type: 'string',
              node: StringNode({ validator: 'resource', params: { pool: config.resource } })
            },
            {
              type: 'object',
              node: Reference(config.inlineSchema)
            }
          ], { choiceContext: 'tag.list' })
          : StringNode({ validator: 'resource', params: { pool: config.resource } })
      ),
      change: (v: unknown) => {
        if (typeof v === 'string' && !v.startsWith('#')) {
          return [v]
        }
        return []
      }
    },
  ], { choiceContext: 'tag' })

  Filterable = (node: INode) => ChoiceNode([
    {
      type: 'simple',
      match: () => true,
      change: v => typeof v === 'object' && v?.raw ? v.raw : undefined,
      node: node,
    },
    {
      type: 'filtered',
      match: v => typeof v === 'object' && v !== null && v.raw !== undefined,
      change: v => ({ raw: v }),
      priority: 1,
      node: ObjectNode({
        raw: node,
        filtered: Opt(node),
      }),
    },
  ], { context: 'filterable' })

  SizeLimitedString = ({ minLength, maxLength }: SizeLimitedStringConfig) => Mod(StringNode(), node => ({
    validate: (path, value, errors, options) => {
      value = node.validate(path, value, errors, options)
      if (minLength !== undefined && typeof value === 'string' && value.length < minLength) {
        errors.add(path, 'error.invalid_string_range.smaller', value.length, minLength)
      }
      if (maxLength !== undefined && typeof value === 'string' && value.length > maxLength) {
        errors.add(path, 'error.invalid_string_range.larger', value.length, maxLength)
      }
      return value
    }
  }))

  const ListOperationFields = ({ maxLength }: { maxLength: number }) => ({
    mode: StringNode({ enum: 'list_operation' }),
    offset: Opt(Mod(NumberNode({ integer: true, min: 0 }), {
      enabled: (path) => ['insert', 'replace_section'].includes(path.push("mode").get())
    })),
    size: Opt(Mod(NumberNode({ integer: true, min: 0, max: maxLength }), {
      enabled: (path) => ['replace_section'].includes(path.push("mode").get())
    })),
  })

  const ListOperation = ({ node, maxLength }: { node: INode, maxLength: number }) => ObjectNode({
    values: ListNode(node),
    ...ListOperationFields({ maxLength })
  }, { context: 'list_operation'})

  ConditionCases = (entitySourceNode: INode<any> = StringNode({ enum: 'entity_source' })) => ({
    'minecraft:all_of': {
      terms: ListNode(
        Reference('condition')
      )
    },
    'minecraft:any_of': {
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
    'minecraft:enchantment_active_check': {
      active: BooleanNode(),
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
      chance: Reference(`${ID}:number_provider`),
    },
    'minecraft:random_chance_with_enchanted_bonus': {
      enchantment: StringNode({ validator: 'resource', params: { pool: 'enchantment' } }),
      unenchanted_chance: NumberNode({ min: 0, max: 1}),
      enchanted_chance: Reference('level_based_value'),
    },
    'minecraft:reference': {
      name: StringNode({ validator: 'resource', params: { pool: '$predicate' } })
    },
    'minecraft:table_bonus': {
      enchantment: StringNode({ validator: 'resource', params: { pool: 'enchantment' } }),
      chances: ListNode(
        NumberNode({ min: 0, max: 1 }),
        { minLength: 1 },
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
      'minecraft:copy_components': {
        source: StringNode({ enum: ['block_entity'] }),
        include: Opt(ListNode(
          StringNode({ validator: 'resource', params: { pool: 'data_component_type' } }),
        )),
        exclude: Opt(ListNode(
          StringNode({ validator: 'resource', params: { pool: 'data_component_type' } }),
        )),
      },
      'minecraft:copy_custom_data': {
        source: Reference('nbt_provider'),
        ops: ListNode(
          ObjectNode({
            source: StringNode({ validator: 'nbt_path', params: { category: { getter: 'copy_source', path: ['pop', 'pop', 'pop', { push: 'source' }] } } }),
            target: StringNode({ validator: 'nbt_path', params: { category: 'minecraft:item' } }),
            op: StringNode({ enum: ['replace', 'append', 'merge'] })
          }, { context: 'nbt_operation' })
        )
      },
      'minecraft:copy_name': {
        source: copySourceNode
      },
      'minecraft:copy_state': {
        block: StringNode({ validator: 'resource', params: { pool: 'block' } }),
        properties: ListNode(
          StringNode({ validator: 'block_state_key', params: { id: ['pop', 'pop', { push: 'block' }] } })
        )
      },
      'minecraft:enchant_randomly': {
        options: Opt(Tag({ resource: 'enchantment' })),
        only_compatible: Opt(BooleanNode()),
      },
      'minecraft:enchant_with_levels': {
        levels: Reference(`${ID}:number_provider`),
        options: Opt(Tag({ resource: 'enchantment' })),
      },
      'minecraft:enchanted_count_increase': {
        enchantment: StringNode({ validator: 'resource', params: { pool: 'enchantment' }}),
        count: Reference(`${ID}:number_provider`),
        limit: Opt(NumberNode({ integer: true }))
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
      'minecraft:filtered': {
        item_filter: Reference('item_predicate'),
        modifier: Reference('item_modifier'),
      },
      'minecraft:limit_count': {
        limit: Reference('int_range')
      },
      'minecraft:modify_contents': {
        component: StringNode({ validator: 'resource', params: { pool: collections.get('container_component_manipulators') } }),
        modifier: Reference('item_modifier'),
      },
      'minecraft:reference': {
        name: StringNode({ validator: 'resource', params: { pool: '$item_modifier' } })
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
      'minecraft:set_book_cover': {
        title: Opt(Filterable(SizeLimitedString({ maxLength: 32 }))),
        author: Opt(StringNode()),
        generation: Opt(NumberNode({ integer: true, min: 0, max: 3 })),
      },
      'minecraft:set_components': {
        components: Reference('data_component_patch'),
      },
      'minecraft:set_contents': {
        component: StringNode({ validator: 'resource', params: { pool: collections.get('container_component_manipulators') } }),
        entries: ListNode(
          Reference('loot_entry')
        )
      },
      'minecraft:set_count': {
        count: Reference(`${ID}:number_provider`),
        add: Opt(BooleanNode())
      },
      'minecraft:set_custom_data': {
        tag: Reference('custom_data_component'),
      },
      'minecraft:set_custom_model_data': {
        value: Reference(`${ID}:number_provider`),
      },
      'minecraft:set_damage': {
        damage: Reference(`${ID}:number_provider`),
        add: Opt(BooleanNode())
      },
      'minecraft:set_enchantments': {
        enchantments: MapNode(
          StringNode({ validator: 'resource', params: { pool: 'enchantment' } }),
          Reference(`${ID}:number_provider`),
        ),
        add: Opt(BooleanNode())
      },
      'minecraft:set_fireworks': {
        explosions: Opt(ListOperation({
          node: Reference('firework_explosion'),
          maxLength: 256,
        })),
        flight_duration: Opt(NumberNode({ integer: true, min: 0, max: 255 })),
      },
      'minecraft:set_firework_explosion': {
        shape: Opt(StringNode({ enum: 'firework_explosion_shape' })),
        colors: Opt(ListNode(
          NumberNode({ color: true }),
        )),
        fade_colors: Opt(ListNode(
          NumberNode({ color: true }),
        )),
        trail: Opt(BooleanNode()),
        twinkle: Opt(BooleanNode()),
      },
      'minecraft:set_instrument': {
        options: StringNode({ validator: 'resource', params: { pool: 'instrument', requireTag: true } })
      },
      'minecraft:set_item': {
        item: StringNode({ validator: 'resource', params: { pool: 'item' } }),
      },
      'minecraft:set_loot_table': {
        type: StringNode({ validator: 'resource', params: { pool: 'block_entity_type' } }),
        name: StringNode({ validator: 'resource', params: { pool: '$loot_table' } }),
        seed: Opt(NumberNode({ integer: true }))
      },
      'minecraft:set_lore': {
        entity: Opt(entitySourceNode),
        lore: ListNode(
          Reference('text_component'),
          { maxLength: 256 },
        ),
        ...ListOperationFields({ maxLength: 256 }),
      },
      'minecraft:set_name': {
        entity: Opt(entitySourceNode),
        target: Opt(StringNode({ enum: ['custom_name', 'item_name'] })),
        name: Opt(Reference('text_component'))
      },
      'minecraft:set_ominous_bottle_amplifier': {
        amplifier: Reference(`${ID}:number_provider`),
      },
      'minecraft:set_potion': {
        id: StringNode({ validator: 'resource', params: { pool: 'potion' } })
      },
      'minecraft:ominous_bottle_amplifier': {
        amplifier: Reference(`${ID}:number_provider`),
      },
      'minecraft:set_stew_effect': {
        effects: Opt(ListNode(
          ObjectNode({
            type: StringNode({ validator: 'resource', params: { pool: 'mob_effect' } }),
            duration: Reference(`${ID}:number_provider`),
          })
        ))
      },
      'minecraft:set_writable_book_pages': {
        pages: ListNode(
          Filterable(SizeLimitedString({ maxLength: 1024 })),
          { maxLength: 100 },
        ),
        ...ListOperationFields({ maxLength: 100 }),
      },
      'minecraft:set_written_book_pages': {
        pages: ListNode(
          Filterable(Reference('text_component')),
          { maxLength: 100 },
        ),
        ...ListOperationFields({ maxLength: 100 }),
      },
      'minecraft:toggle_tooltips': {
        toggles: MapNode(
          StringNode({ validator: 'resource', params: { pool: collections.get('toggleable_data_component_type') }}),
          BooleanNode(),
        ),
      },
      'villagerconfig:enchant_randomly': {
        include: Opt(Tag({ resource: 'enchantment' })),
        exclude: Opt(Tag({ resource: 'enchantment' })),
        min_level: Opt(NumberNode({ integer: true })),
        max_level: Opt(NumberNode({ integer: true }))
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
