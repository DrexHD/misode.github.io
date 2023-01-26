import { CollectionRegistry, ListNode, Mod, NumberNode, ObjectNode, Opt, Reference as RawReference, SchemaRegistry, StringNode as RawStringNode } from '@mcschema/core'

const ID = 'villagerconfig'

export function initVillagerConfig(schemas: SchemaRegistry, collections: CollectionRegistry) {
	const Reference = RawReference.bind(undefined, schemas)
	const StringNode = RawStringNode.bind(undefined, collections)
	
	schemas.register(`${ID}`, ObjectNode({
    tiers: ListNode(
      Mod(ObjectNode({
        groups: ListNode(
			Reference(`${ID}:group`)
		)
      }, { category: 'groups', context: 'trade_groups' }), {
        default: () => ({
          rolls: 1,
          groups: [{
            num_to_select: 2,
            trades: [
				{
					wants: [
						{
							item: 'minecraft:emerald'
						}
					],
					gives: [
						{
							item: 'minecraft:diamond'
						}
					]
				}
			],
			total_exp_required: 0
          }]
        })
      })
    )
  }))

  schemas.register(`${ID}:group`, ObjectNode({
		num_to_select: Reference('number_provider'),
		trades: ListNode(
			Reference(`${ID}:trade`)
		),
		total_exp_required: NumberNode({ integer: true, min: 0 })
  }))


  schemas.register(`${ID}:trade`, ObjectNode({
	wants: ListNode(
		Reference(`${ID}:want_item`)
	),
	gives: ListNode(
		Reference(`${ID}:trade_item`)
	),
	trader_exp: Reference('number_provider'),
	max_uses: Reference('number_provider'),
  }))

  schemas.register(`${ID}:trade_item`, ObjectNode({
	item: StringNode({ validator: 'resource', params: { pool: 'item' } }),
	choice: Opt(ListNode(
		Reference(`${ID}:choice_item`)
	)),
	quantity: Opt(Reference('number_provider')),
	functions: Opt(ListNode(
		Reference('loot_function')
	))
  }))

  schemas.register(`${ID}:choice_item`, ObjectNode({
	item: StringNode({ validator: 'resource', params: { pool: 'item' } }),
	choice: Opt(ListNode(
		Reference(`${ID}:choice_item`)
	)),
	quantity: Opt(Reference('number_provider')),
	functions: Opt(ListNode(
		Reference('loot_function')
	)),
    conditions: Opt(ListNode(
		Reference('loot_condition')
	  ))
	}))

  schemas.register(`${ID}:want_item`, ObjectNode({
	item: StringNode({ validator: 'resource', params: { pool: 'item' } }),
	choice: Opt(ListNode(
		Reference(`${ID}:choice_item`)
	)),
	quantity: Opt(Reference('number_provider')),
	price_multiplier: Opt(Reference('number_provider')),
	functions: Opt(ListNode(
		Reference('loot_function')
	))
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
