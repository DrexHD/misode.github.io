import type { ItemComponentsProvider } from 'deepslate'
import type { Random } from 'deepslate/core'
import { Identifier, ItemStack, LegacyRandom } from 'deepslate/core'
import { ResolvedItem } from '../../services/ResolvedItem.js'
import { checkVersion, type VersionId } from '../../services/Versions.js'
import { composeConditions, computeFloat, computeInt, generateEntry, StackMixer } from '../previews/LootTable.js'
import { generateEntry as generateEntry1204 } from '../previews/LootTable1204.js'

export interface SlottedItem {
	slot: number,
	item: ResolvedItem,
}

export interface Trade {
	cost_a: ItemStack,
	cost_b?: ItemStack,
	result: ItemStack,
	conditions: any
}

interface LootOptions extends ItemComponentsProvider {
	version: VersionId,
	seed: bigint,
	luck: number,
	daytime: number,
	weather: string,
	stackMixer: StackMixer,
	getItemTag(id: string): string[],
	getLootTable(id: string): any,
	getPredicate(id: string): any,
	getEnchantments(): Map<string, any>,
	getEnchantmentTag(id: string): string[],
	numberProvider: Map<string, number>
}

interface LootContext extends LootOptions {
	random: Random,
	luck: number
	weather: string,
	dayTime: number,
}

export function generateTrades(lootTable: any, options: LootOptions) {
	const ctx = createLootContext(options)
	const result: Trade[] = []
	for (const tier of lootTable.tiers ?? []) {
		for (const group of tier.groups ?? []) {
			const pool: Trade[] = []
			for (const trade of group.trades ?? []) {
				pool.push(generateTrade(trade, ctx))
			}
			fillRecipesFromPool(result, pool, computeInt(group.num_to_select, ctx), ctx)
		}
	}
	return result
}

function fillRecipesFromPool(result: Trade[], pool: Trade[], count: number, ctx: LootContext) {
	pool = pool.filter(trade => composeConditions(trade.conditions ?? [])(ctx))
	const set = new Set<number>()

	if (pool.length > count) {
		while (set.size < count) {
			set.add(ctx.random.nextInt(pool.length))
		}
	} else {
		for (let i = 0; i < pool.length; i++) {
			set.add(i)
		}
	}
	for (const i of set.values()) {
		result.push(pool[i])
	}
}

function generateTrade(trade: any, ctx: LootContext): Trade {
	ctx.numberProvider.clear
	if (trade.reference_providers != undefined) {
		for (const [key, value] of Object.entries(trade.reference_providers)) {
			ctx.numberProvider.set(key, computeFloat(value, ctx))
		}
	}
	let cost_a: ItemStack = new ItemStack(Identifier.parse('air'), 0)
	let cost_b = undefined
	let result: ItemStack = new ItemStack(Identifier.parse('air'), 0)
	generateEntry0(trade.result, (item: ItemStack) => result = item, ctx)
	if (trade.cost_b != null) generateEntry0(trade.cost_b, (item: ItemStack) => cost_b = item, ctx)
	generateEntry0(trade.cost_a, (item: ItemStack) => cost_a = item, ctx)
	let conditions = undefined
	if (trade.conditions != null) conditions = trade.conditions
	return { cost_a, cost_b, result, conditions }
}

function generateEntry0(entry: any, consumer: any, ctx: LootContext) {
	if (checkVersion(ctx.version, '1.20.5')) {
		generateEntry(entry, consumer, ctx)
	} else {
		generateEntry1204(entry, consumer, ctx)
	}
}

function createLootContext(options: LootOptions): LootContext {
	return {
		...options,
		random: new LegacyRandom(options.seed),
		luck: options.luck,
		weather: options.weather,
		dayTime: options.daytime,
	}
}
