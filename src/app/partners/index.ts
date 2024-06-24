import type { CollectionRegistry, SchemaRegistry } from '@mcschema/core'
import type { VersionId } from '../services/Schemas.js'
import { initImmersiveWeathering } from './ImmersiveWeathering.js'
import { initLithostitched } from './Lithostitched.js'
import { initObsidian } from './Obsidian.js'
import { initOhTheTreesYoullGrow } from './OhTheTreesYoullGrow.js'
import { initCommands } from './melius_commands/Commands.js'
import { initModifiers } from './melius_commands/Modifiers.js'
import { initVillagerConfig } from './villagerconfig/VillagerConfig.js'

export * from './ImmersiveWeathering.js'
export * from './Lithostitched.js'
export * from './villagerconfig/VillagerConfig.js'

export function initPartners(schemas: SchemaRegistry, collections: CollectionRegistry, version: VersionId) {
	initImmersiveWeathering(schemas, collections)
	initLithostitched(schemas, collections, version)
	initObsidian(schemas, collections)
	initOhTheTreesYoullGrow(schemas, collections)
	initVillagerConfig(schemas, collections)
	initCommands(schemas, collections)
	initModifiers(schemas, collections)
}
