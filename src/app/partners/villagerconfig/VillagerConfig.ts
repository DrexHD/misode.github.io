import { BooleanNode, CollectionRegistry, ListNode, MapNode, Mod, NumberNode, ObjectNode, Opt, Reference as RawReference, SchemaRegistry, StringNode as RawStringNode } from '@mcschema/core'
import { initCommonSchemas } from './Common.js'
import { initLootTableSchemas } from './LootTable.js'

const ID = 'villagerconfig'

export function initVillagerConfig(schemas: SchemaRegistry, collections: CollectionRegistry) {

	initCommonSchemas(schemas, collections)
	initLootTableSchemas(schemas, collections)

	const Reference = RawReference.bind(undefined, schemas)
	const StringNode = RawStringNode.bind(undefined, collections)

	schemas.register(`${ID}`, ObjectNode({
		tiers: ListNode(
			Reference(`${ID}:tier`)
		)
	}))

	schemas.register(`${ID}:tier`, Mod(ObjectNode({
		total_exp_required: NumberNode({ integer: true, min: 0 }),
		groups: ListNode(
			Reference(`${ID}:group`)
		)
	}, { category: 'groups', context: `${ID}:tier` }), {
		default: () => ({
			rolls: 1,
			groups: [{
				num_to_select: 2,
			}],
			total_exp_required: 0
		})
	}))

	schemas.register(`${ID}:group`, ObjectNode({
		num_to_select: Reference(`${ID}:number_provider`),
		trades: ListNode(
			Reference(`${ID}:trade`)
		)
	}))

	schemas.register(`${ID}:trade`, ObjectNode({
		cost_a: Reference(`${ID}:loot_entry`),
		cost_b: Opt(Reference(`${ID}:loot_entry`)),
		result: Reference(`${ID}:loot_entry`),
		price_multiplier: Opt(Reference(`${ID}:number_provider`)),
		trader_exp: Opt(Reference(`${ID}:number_provider`)),
		max_uses: Opt(Reference(`${ID}:number_provider`)),
		reference_providers: Opt(MapNode(
			StringNode(),
			Reference(`${ID}:number_provider`)
		)),
		reward_experience: Opt(BooleanNode())
	}))

	collections.register(`${ID}`, [
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
