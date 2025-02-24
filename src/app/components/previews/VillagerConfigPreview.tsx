import { useMemo, useRef, useState } from 'preact/hooks'
import { useLocale, useVersion } from '../../contexts/index.js'
import { useAsync } from '../../hooks/useAsync.js'
import { fetchAllPresets, fetchItemComponents } from '../../services/DataFetcher.js'
import { jsonToNbt, randomSeed, safeJsonParse } from '../../Utils.js'
import { Btn, BtnMenu, NumberInput } from '../index.js'
import { ItemDisplay } from '../ItemDisplay.jsx'
import type { PreviewProps } from './index.js'
import { generateTrades } from './VillagerConfig.js'

export const VillagerConfigPreview = ({ docAndNode }: PreviewProps) => {
	const { locale } = useLocale()
	const { version } = useVersion()
	const [seed, setSeed] = useState(randomSeed())
	const [luck, setLuck] = useState(0)
	const [daytime, setDaytime] = useState(0)
	const [weather, setWeather] = useState('clear')
	const [mixItems, setMixItems] = useState(true)
	const [advancedTooltips, setAdvancedTooltips] = useState(true)
	const overlay = useRef<HTMLDivElement>(null)

	const { value: dependencies, loading } = useAsync(() => {
		return Promise.all([
			fetchAllPresets(version, 'tag/item'),
			fetchAllPresets(version, 'loot_table'),
			fetchItemComponents(version),
			fetchAllPresets(version, 'enchantment'),
			fetchAllPresets(version, 'tag/enchantment'),
		])
	}, [version])

	const text = docAndNode.doc.getText()
	const table = safeJsonParse(text) ?? {}
	const trades = useMemo(() => {
		if (dependencies === undefined || loading) {
			return []
		}
		const [itemTags, lootTables, itemComponents, enchantments, enchantmentTags] = dependencies

		return generateTrades(table, {
			version, seed, luck, daytime, weather,
			stackMixer: mixItems ? 'container' : 'default',
			getItemTag: (id) => (itemTags.get(id.replace(/^minecraft:/, '')) as any)?.values ?? [],
			getLootTable: (id) => lootTables.get(id.replace(/^minecraft:/, '')),
			getPredicate: () => undefined,
			getEnchantments: () => enchantments ?? new Map(),
			getEnchantmentTag: (id) => (enchantmentTags?.get(id.replace(/^minecraft:/, '')) as any)?.values ?? [],
			getItemComponents: (id) => new Map([...(itemComponents?.get(id.toString()) ?? new Map()).entries()].map(([k, v]) => [k, jsonToNbt(v)])),
			numberProvider: new Map<string, number>(),
		})

	}, [version, seed, luck, daytime, weather, mixItems, text, dependencies, loading])

	return <>
		<div ref={overlay} class="preview-overlay">
			{trades.map(({ cost_a, cost_b, result }, index) =>
				<>
					<img src="/images/trade.png" alt="Trade background" class="pixelated" draggable={false} />
					<div style={slotStyle(5, trades.length, index)}>
						<ItemDisplay item={cost_a} slotDecoration={true} advancedTooltip={advancedTooltips} />
					</div>
					{cost_b != undefined && (
						<div style={slotStyle(36, trades.length, index)}>
							<ItemDisplay item={cost_b!} slotDecoration={true} advancedTooltip={advancedTooltips} />
						</div>
					)}
					<div style={slotStyle(68, trades.length, index)}>
						<ItemDisplay item={result} slotDecoration={true} advancedTooltip={advancedTooltips} />
					</div>
				</>
			)}

		</div>
		<div class="controls preview-controls">
			<BtnMenu icon="gear" tooltip={locale('settings')} >
				<div class="btn btn-input" onClick={e => e.stopPropagation()}>
					<span>{locale('preview.luck')}</span>
					<NumberInput value={luck} onChange={setLuck} />
				</div>
				<div class="btn btn-input" onClick={e => e.stopPropagation()}>
					<span>{locale('preview.daytime')}</span>
					<NumberInput value={daytime} onChange={setDaytime} />
				</div>
				<div class="btn btn-input" onClick={e => e.stopPropagation()}>
					<span>{locale('preview.weather')}</span>
					<select value={weather} onChange={e => setWeather((e.target as HTMLSelectElement).value)} >
						{['clear', 'rain', 'thunder'].map(v =>
							<option value={v}>{locale(`preview.weather.${v}`)}</option>)}
					</select>
				</div>
				<Btn icon={mixItems ? 'square_fill' : 'square'} label="Fill container randomly" onClick={e => {setMixItems(!mixItems); e.stopPropagation()}} />
				<Btn icon={advancedTooltips ? 'square_fill' : 'square'} label="Advanced tooltips" onClick={e => {setAdvancedTooltips(!advancedTooltips); e.stopPropagation()}} />
			</BtnMenu>
			<Btn icon="sync" tooltip={locale('generate_new_seed')} onClick={() => setSeed(randomSeed())} />
		</div>
	</>
}

const GUI_WIDTH = 89
const GUI_HEIGHT = 20
const ITEM_SIZE = 18

function slotStyle(x: number, trades: number, index: number) {
	return {
		left: `${x * 100 / GUI_WIDTH}%`,
		top: `${index / trades * 100}%`,
		width: `${ITEM_SIZE * 100 / GUI_WIDTH}%`,
		height: `${ITEM_SIZE * 100 / GUI_HEIGHT / trades}%`,
	}
}
