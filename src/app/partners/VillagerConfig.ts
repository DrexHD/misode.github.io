import { BooleanNode, Case, ChoiceNode, CollectionRegistry, ListNode, MapNode, Mod, NestedNodeChildren, NodeChildren, NumberNode, ObjectNode, Opt, Reference as RawReference, ResourceType, SchemaRegistry, StringNode as RawStringNode, Switch } from '@mcschema/core'

const ID = 'villagerconfig'

export function initVillagerConfig(schemas: SchemaRegistry, collections: CollectionRegistry) {
	const Reference = RawReference.bind(undefined, schemas)
	const StringNode = RawStringNode.bind(undefined, collections)
	
	schemas.register(`${ID}`, ObjectNode({
    tiers: ListNode(
      Mod(ObjectNode({
        groups: ListNode(
			Reference(`${ID}:group`)
		),
		total_exp_required: NumberNode({ integer: true, min: 0 })
      }, { category: 'groups', context: 'trade_groups' }), {
        default: () => ({
          rolls: 1,
          groups: [{
            num_to_select: 2,
          }],
		  total_exp_required: 0
        })
      })
    )
  }))

  schemas.register(`${ID}:group`, ObjectNode({
		num_to_select: Reference('number_provider'),
		trades: ListNode(
			Reference(`${ID}:trade`)
		)
  }))


  // TODO reward_experience default true
  schemas.register(`${ID}:trade`, ObjectNode({
	cost_a: Reference('loot_entry'),
	cost_b: Opt(Reference('loot_entry')),
	result: Reference('loot_entry'),
	price_multiplier: Opt(Reference('number_provider')),
	trader_exp: Opt(Reference('number_provider')),
	max_uses: Opt(Reference('number_provider')),
	reference_providers: Opt(MapNode(
		StringNode(),
		Reference('number_provider')
	)),
	reward_experience: Opt(BooleanNode())
  }))

  // TODO rework
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

  schemas.register('number_provider', ObjectWithType(
    'loot_number_provider_type',
    'number', 'value', 'minecraft:constant',
    'minecraft:uniform',
    'number_provider',
    {
      'minecraft:constant': {
        value: NumberNode()
      },
      'minecraft:uniform': {
        min: Reference('number_provider'),
        max: Reference('number_provider')
      },
      'minecraft:binomial': {
        n: Reference('number_provider'),
        p: Reference('number_provider'),
		test: NumberNode()
      },
      'minecraft:score': {
        target: Reference('scoreboard_name_provider'),
        score: StringNode({ validator: 'objective' }),
        scale: Opt(NumberNode())
      },
	  'villagerconfig:add': {
		addends: ListNode(Reference('number_provider'))
	  },
	  'villagerconfig:multiply': {
		factors: ListNode(Reference('number_provider'))
	  },
	  'villagerconfig:reference': {
		id: StringNode()
	  }
    }))

  collections.register('villagerconfig', [
	'minecraft:armorer',
	'minecraft:butcher',
	'minecraft:cartographer',
	'minecraft:cleric',
	'minecraft:farmer',
	'minecraft:fisherman',
	'minecraft:fletcher',
	'minecraft:leatherworker',
	'minecraft:librarian',
	'minecraft:mason',
	'minecraft:nitwit',
	'minecraft:none',
	'minecraft:shepherd',
	'minecraft:toolsmith',
	'minecraft:wanderingtrader',
	'minecraft:weaponsmith',
])
}
