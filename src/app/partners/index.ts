import type { CollectionRegistry, SchemaRegistry } from '@mcschema/core'
import { initImmersiveWeathering } from './ImmersiveWeathering.js'
import { initVillagerConfig } from './VillagerConfig.js'

export * from './ImmersiveWeathering.js'
export * from './VillagerConfig.js'

export function initPartners(schemas: SchemaRegistry, collections: CollectionRegistry) {
	initImmersiveWeathering(schemas, collections)
	initVillagerConfig(schemas, collections)
}
