import { useEffect, useRef, useState } from 'preact/hooks'
import { useLocale, useVersion } from '../../contexts/index.js'
import { randomSeed, safeJsonParse } from '../../Utils.js'
import { Btn, BtnMenu, NumberInput } from '../index.js'
import { ItemDisplay } from '../ItemDisplay.jsx'
import type { PreviewProps } from './index.js'
import type { Trade } from './VillagerConfig.js'
import { generateTrades } from './VillagerConfig.js'

export const VillagerConfigPreview = ({ docAndNode }: PreviewProps) => {
	const { locale } = useLocale()
	const { version } = useVersion()
	const [seed, setSeed] = useState(randomSeed())
	const [luck, setLuck] = useState(0)
	const [daytime, setDaytime] = useState(0)
	const [weather, setWeather] = useState('clear')
	const [advancedTooltips, setAdvancedTooltips] = useState(true)
	const overlay = useRef<HTMLDivElement>(null)

	const [trades, setTrades] = useState<Trade[]>([])

	const text = docAndNode.doc.getText()
	const table = safeJsonParse(text) ?? {}
	useEffect(() => {
		const trades = generateTrades(table, { version, seed, luck, daytime, weather})
		console.log('Generated trades', trades)
		setTrades(trades)
	}, [version, seed, luck, daytime, weather])

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
				<Btn icon={advancedTooltips ? 'square_fill' : 'square'} label="Advanced tooltips" onClick={e => { setAdvancedTooltips(!advancedTooltips); e.stopPropagation() }} />
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
