/* ------------------------------------------------------------------
   Sina Una spells — book pp. 226-233.
   Only levels 0-3 are listed: at character level 5 a full caster or
   warlock tops out at 3rd-level slots, a half caster at 2nd, and a
   third caster at 1st. The 4th-9th level spells exist in the source
   data but are unreachable in this campaign's range.
------------------------------------------------------------------- */
export const SPELLS = [
  { name: "Lava Plume", level: 0, school: "evocation", page: 229, time: "1 action", range: "120 ft",
    comp: "V, S", dur: "Instantaneous", save: "dex", dmg: "1d6", dmgType: "fire",
    text: "A 5-foot fountain of lava bursts up. Creatures within 5 feet make a Dexterity save or take 1d6 fire damage. Scales at 5th, 11th, 17th level." },
  { name: "Spirit Dart", level: 0, school: "evocation", page: 231, time: "1 action", range: "120 ft",
    comp: "V, S", dur: "Instantaneous", table: true, atk: "ranged", dmg: "1d8", dmgType: "varies",
    text: "Ranged spell attack for 1d8. Damage type set by the nature spirit that answers — roll or choose on the spirit table. Extra darts at 5th, 11th, 17th level." },

  { name: "Apolaki's Light", level: 1, school: "abjuration", page: 226,
    time: "1 reaction, when damaged by a creature within 30 ft you can see", range: "30 ft",
    comp: "V, S", dur: "Instantaneous", save: "con", dmg: "1d12", dmgType: "radiant", cond: "blinded",
    text: "Solar light lashes back. Constitution save or 1d12 radiant and blinded until the start of its next turn; half and no blinding on a success. +1d12 per slot above 1st." },
  { name: "Create or Harden Lava", level: 1, school: "transmutation", page: 228, time: "1 action",
    range: "30 ft", comp: "V, S, M (obsidian shard, or volcanic rock)", dur: "Instantaneous",
    save: "dex", dmg: "2d10", dmgType: "fire",
    text: "Melt a 10-foot cube of stone into lava (Dexterity save, 2d10 fire) or harden lava into rock (Constitution save or restrained). Cube grows 5 ft per slot above 1st." },
  { name: "False Self", level: 1, school: "transmutation", page: 229,
    time: "1 reaction, when grappled or restrained", range: "Self",
    comp: "V, S, M (a lizard's tail)", dur: "Instantaneous",
    text: "Swap places with an effigy of yourself. The grapple or restraint transfers to the effigy, which lasts until the start of your next turn." },
  { name: "Viper's Eyes", level: 1, school: "divination", page: 233, time: "1 action", range: "Touch",
    comp: "S, M (the eye of a snake)", dur: "8 hours",
    text: "60-foot blindsight via heat detection. On fire or radiant damage the target makes a Constitution save (DC 10 or half the damage, whichever is higher) or the spell ends early." },

  { name: "Bonded Spirits", level: 2, school: "enchantment", page: 226, time: "1 action", range: "Touch",
    comp: "V, S, M (a small offering of food)", dur: "1 hour", ritual: true, table: true,
    text: "A nature spirit bonds to a willing creature: +1 to all saves and +1d6 damage on weapon attacks, type set by the spirit table. +1d6 per slot above 2nd." },
  { name: "Colors of Hanan", level: 2, school: "transmutation", page: 226, time: "10 minutes",
    range: "Touch", comp: "V, S, M (gold dust and pigments)", dur: "1 hour", ritual: true,
    text: "A golden tattoo the target shifts as a bonus action — Gold (+1 AC), Orange (attacks count as magical), Pink (regain 1d4+1 hit points each turn), Purple (advantage on Dex and Con saves)." },
  { name: "Lizard Skin", level: 2, school: "abjuration", page: 229, time: "1 action", range: "Touch",
    comp: "V, M (a reptile scale)", dur: "1 hour",
    text: "5 temporary hit points and +1 AC. As a reaction the target can shed the skin to end a grapple or restraint and move 5 feet. +5 temporary hit points per slot above 2nd." },
  { name: "Molten Shell", level: 2, school: "abjuration", page: 231, time: "1 action", range: "Self",
    comp: "V, S, M (a shard of obsidian)", dur: "1 hour",
    text: "Fire resistance and 10 temporary hit points; melee attackers take 10 fire. Once spent, the rock hardens and halves the next weapon attack dealing bludgeoning, piercing or slashing." },

  { name: "Aqueous Affinity", level: 3, school: "transmutation", page: 226, time: "1 action",
    range: "Touch", comp: "V, S, M (fish bones)", dur: "8 hours", ritual: true,
    text: "Swimming speed equal to movement, no disadvantage on underwater weapon attacks, and advantage on Dexterity saves while submerged." },
  { name: "Coral Cage", level: 3, school: "transmutation", page: 228, time: "1 action", range: "30 ft",
    comp: "V, S, M (a piece of coral)", dur: "Concentration, up to 10 min", conc: true,
    save: "dex", dmg: "3d8", dmgType: "force", cond: "restrained",
    text: "Coral erupts around one creature. Dexterity save or 3d8 force and restrained. An aswang automatically fails, and repeats the save at disadvantage. +1d8 per slot above 3rd." },
  { name: "Eruption", level: 3, school: "evocation", page: 228, time: "1 action", range: "120 ft",
    comp: "V, S, M (a piece of igneous rock)", dur: "Instantaneous",
    save: "dex", dmg: "4d6+4d6", dmgType: "fire+thunder",
    text: "The ground explodes. Creatures within 30 feet make a Dexterity save for 4d6 fire plus 4d6 thunder, leaving difficult terrain until the end of your next turn. +1d6 thunder per slot above 3rd." },
  { name: "Shape Light", level: 3, school: "transmutation", page: 231, time: "1 action", range: "60 ft",
    comp: "V, S, M (a light source and clear crystal)", dur: "Concentration, 1 min", conc: true,
    save: "dex", dmg: "3d8", dmgType: "radiant", cond: "blinded",
    text: "Choose Moonlight (a weapon becomes magical, +1d8 radiant, three-quarters cover), Starlight (a five-panel wall, -1d4 to ranged attacks, 2d8 radiant), or Sunlight (a bright sphere, 3d8 radiant and blinded)." },
];

export const SPIRIT_TABLE = [["1", "Lava", "Fire"], ["2", "Water", "Cold"], ["3", "Wind", "Thunder"],
  ["4", "Rock", "Force"], ["5", "Vine", "Poison"], ["6", "Storm", "Lightning"]];

/* Which Sina Una spells each class may take (book pp. 224-225),
   trimmed to the levels reachable at 5th. */
export const SPELL_LISTS = {
  babaylan: ["Spirit Dart", "Apolaki's Light", "Create or Harden Lava", "Bonded Spirits", "Coral Cage"],
  bard: ["Lava Plume", "Apolaki's Light", "False Self", "Viper's Eyes", "Lizard Skin", "Eruption", "Shape Light"],
  cleric: ["Spirit Dart", "Apolaki's Light", "Bonded Spirits", "Colors of Hanan", "Shape Light"],
  druid: ["Lava Plume", "Spirit Dart", "Create or Harden Lava", "False Self", "Viper's Eyes", "Lizard Skin", "Molten Shell", "Aqueous Affinity", "Coral Cage", "Eruption"],
  paladin: ["Apolaki's Light", "Bonded Spirits", "Colors of Hanan", "Shape Light"],
  ranger: ["False Self", "Viper's Eyes", "Lizard Skin", "Aqueous Affinity"],
  sorcerer: ["Lava Plume", "Create or Harden Lava", "Viper's Eyes", "Colors of Hanan", "Lizard Skin", "Aqueous Affinity", "Eruption", "Shape Light"],
  warlock: ["Lava Plume", "False Self", "Viper's Eyes", "Lizard Skin", "Molten Shell", "Eruption"],
  wizard: ["Lava Plume", "Create or Harden Lava", "Viper's Eyes", "Colors of Hanan", "Lizard Skin", "Aqueous Affinity", "Coral Cage", "Eruption", "Shape Light"],
};
