import { toPng } from 'html-to-image'
import { useMemo, useRef, useState } from 'preact/hooks'
import { useLocale, useVersion } from '../../contexts/index.js'
import { useAsync } from '../../hooks/useAsync.js'
import { fetchAllPresets, fetchItemComponents } from '../../services/DataFetcher.js'
import { jsonToNbt, randomSeed, safeJsonParse } from '../../Utils.js'
import { Btn, BtnMenu } from '../index.js'
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
				<Btn icon="download" label="Export as PNG" onClick={async e => {
					e.stopPropagation();
					if (!overlay.current) return;

					// Clone the overlay to ensure all content is rendered
					const clonedOverlay = overlay.current.cloneNode(true) as HTMLDivElement;
					clonedOverlay.style.overflow = 'visible';
					clonedOverlay.style.height = 'auto';
					clonedOverlay.style.maxHeight = 'none';

					// Ensure pixelated class is applied to all images
					clonedOverlay.querySelectorAll('img').forEach(img => {
						img.style.imageRendering = 'pixelated';
					});

					document.body.appendChild(clonedOverlay);

					try {
						const dataUrl = await toPng(clonedOverlay);
						
						const link = document.createElement('a');
						link.download = 'preview.png';
						link.href = dataUrl;
						link.click();
					} catch (error) {
						console.error('Failed to export as PNG:', error);
					} finally {
						// Clean up the cloned overlay
						document.body.removeChild(clonedOverlay);
					}
				}} />
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
