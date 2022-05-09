---
title: Adding custom structures
versions:
  - '1.18.2'
  - '1.19'
tags:
  - worldgen
  - structures
---

This guide will showcase how to create a data pack that adds a custom structure to the world. There is also a [data pack download]({#[1.18.2] https://gist.github.com/misode/45559d34627755ecaa52497daea83544/raw/8ece848257e6ce17769ca17eccdf89b5889afbe2/tall-towers-1.18.2.zip #}{#[1.19] https://gist.github.com/misode/45559d34627755ecaa52497daea83544/raw/b7d7c44a132641d308cbdc93ce4cf061759d15c5/tall-towers-1.19.zip #}) of this complete example.

> **Always leave the world and rejoin to apply the new changes!**

## Pack.mcmeta
Like every data pack, we need a `pack.mcmeta`. In this version, the pack format is {#pack_format#}.
```json
{
  "pack": {
    "pack_format": {#pack_format#},
    "description": "A tall tower"
  }
}
```

## The structure set
A structure set is where the placement starts. It defines where in the world the structure should be placed, and how rare it is. It takes a weighted list of different structures, allowing structure variants (for example the [vanilla nether](/worldgen/structure-set/?preset=nether_complexes&version={#version#}) has a structure set with both the bastion and fortress).

**`data/example/worldgen/structure_set/tall_towers.json`**
```json
{
  "structures": [
    {
      "structure": "example:tall_tower",
      "weight": 1
    }
  ],
  "placement": {
    "type": "minecraft:random_spread",
    "spacing": 5,
    "separation": 2,
    "salt": 1646207470
  }
}
```
Structure sets are made up of two parts:
* `structures`: A weighted list of configured structure features [(see next step)](#the{#[1.18.2] -configured #}-structure).
* `placement`: The structure placement
  * `placement.type`: Either `random_spread` or `concentric_rings`. The latter is only used by strongholds in vanilla, so we'll focus on `random_spread`
  * `placement.spacing`: Roughly the average distance in chunks between two structures in this set.
  * `placement.separation`: The minimum distance in chunks. Needs to be smaller than spacing.
  * `placement.salt`: A random number that is combined with the world seed. Always use a different random number for different structures, otherwise they will end up being placed in the same spot!

When using the `random_spread` placement type, it generates structures grid-based. Here's an illustration of the above example with `spacing = 5`, `separation = 2`. There will be one structure attempt in each 5x5 chunk grid, and only at `X` a structure can spawn. 
```
.............
..XXX..XXX..X
..XXX..XXX..X
..XXX..XXX..X
.............
.............
..XXX..XXX..X
..XXX..XXX..X
..XXX..XXX..X
```

## The {#[1.18.2] configured structure #}{#[1.19] structure #}
The {#[1.18.2] configured structure (feature) #}{#[1.19] structure #} is the ID you will be able to reference in `/locate`.

**`data/example/worldgen/{#[1.18.2] configured_structure_feature #}{#[1.19] structure #}/tall_tower.json`**
```json
{#[1.18.2]
{
  "type": "minecraft:village",
  "config": {
    "start_pool": "example:tall_tower",
    "size": 1
  },
  "biomes": "#minecraft:has_structure/mineshaft",
  "adapt_noise": true,
  "spawn_overrides": {}
}
#}{#[1.19]
{
  "type": "minecraft:jigsaw",
  "biomes": "#minecraft:has_structure/mineshaft",
  "step": "surface_structures",
  "spawn_overrides": {},
  "terrain_adaptation": "beard_thin",
  "start_pool": "example:tall_tower",
  "size": 1,
  "start_height": {
    "absolute": 0
  },
  "project_start_to_heightmap": "WORLD_SURFACE_WG",
  "max_distance_from_center": 80,
  "use_expansion_hack": false
}
#}
```
Let's go over all the fields.
{#[1.18.2]
* `type`: This is the structure feature type. When making custom structures, you almost always want to set this to `village` or `bastion_remnant`. There is one important difference between the two: using `village` will spawn the structure on the surface, while `bastion_remnant` will always spawn the structure at Y=33.
* `config.start_pool`: This is a reference to the **template pool** [(see next step)](#the-template-pool).
* `config.size`: This is a number between 1 and 7. This is important if your structure uses jigsaw. In this simple example, we'll leave it at 1.
* `biomes`: This controls in which biomes this structure is allowed to generate. You can give it any biome tag, a list of biomes, or a single biome. For easy testing we'll set it to every biome with mineshafts.
* `adapt_noise`: When true, it will add extra terrain below each structure piece.
* `spawn_overrides`: This field allows you to override mob spawning inside the structure bounding boxes. This is outside the scope of this guide, but you could look at the [vanilla monument](/worldgen/structure-feature/?preset=monument&version={#version#}) structure feature as a reference.
#}{#[1.19]
* `type`: This is the structure type. When making custom structures, you almost always want to set this to `jigsaw`.
* `biomes`: This controls in which biomes this structure is allowed to generate. You can give it any biome tag, a list of biomes, or a single biome. For easy testing we'll set it to every biome with mineshafts.
* `step`: The generation step to place the features in. This matches the steps in a biome's `feature` list. Possible values: `raw_generation`, `lakes`, `local_modifications`, `underground_structures`, `surface_structures`, `strongholds`, `underground_ores`, `underground_decoration`, `fluid_springs`, `vegetal_decoration`, and `top_layer_modification`.
* `spawn_overrides`: This field allows you to override mob spawning inside the structure bounding boxes. This is outside the scope of this guide, but you could look at the [vanilla monument](/worldgen/structure/?preset=monument&version={#version#}) structure feature as a reference.
* `start_pool`: This is a reference to the **template pool** [(see next step)](#the-template-pool).
* `size`: This is a number between 1 and 7. This is important if your structure uses jigsaw. In this simple example, we'll leave it at 1.
* `start_height`: A height provider specifying at which height the structure should spawn. The example uses the constant shorthand so it just specifies a vertical anchor.
* `project_start_to_heightmap`: An optional heightmap type. Possible values: `WORLD_SURFACE_WG`, `WORLD_SURFACE`, `OCEAN_FLOOR_WG`, `OCEAN_FLOOR`, `MOTION_BLOCKING`, and `MOTION_BLOCKING_NO_LEAVES`. If `start_height` is not 0, will move the start relative to the heightmap.
* `max_distance_from_center`: Value between 1 and 128. The maximum distance that a jigsaw can branch out.
* `use_expansion_hack`: You should always set this to false. Vanilla villages set this to true to fix an issue with their streets.
#}

## The template pool
The template pool defines how to build up your structure. Since we're not using jigsaw, this is quite straight forward: we want to place a single NBT structure.

**`data/example/worldgen/template_pool/tall_tower.json`**
```json
{
  "name": "example:tall_tower",
  "fallback": "minecraft:empty",
  "elements": [
    {
      "weight": 1,
      "element": {
        "element_type": "minecraft:single_pool_element",
        "location": "example:stone_tall_tower",
        "projection": "rigid",
        "processors": "minecraft:empty"
      }
    }
  ]
}
```
Again, let's go over the fields:
* `name`: For some reason, the game needs the name of this template pool. Just set this to the ID of the template pool.
* `fallback`: Used in jigsaw structures, but we can simply use `minecraft:empty`.
* `elements`: A weighted list of pool elements to choose from. You can add multiple elements here if your structure has different starting structure files. For example in vanilla a plains village has different town center variants.
  * `element_type`: The type of this element. One of `empty_pool_element` (placing nothing), `feature_pool_element` (placing a placed feature), `legacy_single_pool_element`, `list_pool_element`, and `single_pool_element` (placing a structure). 
  * `location`: The path to the structure NBT file. [(see next step)](#the-structure-nbt).
  * `projection`: Either `rigid` or `terrain_matching`. Use the latter if you want the structure to match the terrain, just like village paths do.
  * `processors`: If you want to run any processor lists, this is quite complicated so again we'll skip this for now and set it to `minecraft:empty`.

## The structure NBT
Creating the structure NBT file is entirely up to you. In this example I'm going to use a tower structure from [Gamemode 4](https://gm4.co/modules/tower-structures).

**`data/example/structures/stone_tall_tower.nbt`**

(binary NBT file) [Download the structure from this example](https://gist.github.com/misode/45559d34627755ecaa52497daea83544/raw/8b41b3e273210e0455e4bd4fa97b5504b65aff2c/stone_tall_tower.nbt)

## Result
![stone tower close-up](https://user-images.githubusercontent.com/17352009/154780743-c704d23b-9343-4167-8273-acc7a380d037.png)
![a bunch of towers in a forest](https://user-images.githubusercontent.com/17352009/154780794-1585c927-682c-4b26-b1cc-f9132fffc24a.png)