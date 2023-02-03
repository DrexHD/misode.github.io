import type { CollectionRegistry, SchemaRegistry } from '@mcschema/core'
import { initImmersiveWeathering } from './ImmersiveWeathering.js'
import { initVillagerConfig } from './villagerconfig/VillagerConfig.js'

export * from './ImmersiveWeathering.js'
export * from './villagerconfig/VillagerConfig.js'

export function initPartners(schemas: SchemaRegistry, collections: CollectionRegistry) {
	initImmersiveWeathering(schemas, collections)
	initVillagerConfig(schemas, collections)
}
