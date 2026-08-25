/* ------------------------------------------------------------------
   Tasha's Cauldron of Everything (TCE) spells, levels 0-3 — the
   reachable range at level 5.  TCE has 21 spells; the 8 above 3rd
   level exist in the source data but are unreachable here.

   Text pulled from 5etools-src (data/spells/spells-tce.json) by
   scripts/extract-spells.mjs, class eligibility from the TCE block of
   data/spells/sources.json (the 2014 "PHB"-source class entries, not
   the XPHB ones).  Same shape as phbSpells.js so the pools concatenate.

   TCE is 2014 content — it predates the 2024 revision — so this is an
   ordinary content add, not an opt-in exception like Weapon Mastery.
   Four of the cantrips (Booming Blade, Green-Flame Blade, Lightning
   Lure, Sword Burst) first appeared in SCAG; TCE is the printing this
   app follows, which is why they carry a material component and the
   5th/11th/17th-level scaling the reprint added.

   None of these is on the babaylan spell list (book p.224, which lists
   only Handbook and island spells), so none carries the "y" code.

   Class codes: b bard · c cleric · d druid · p paladin
                r ranger · s sorcerer · k warlock · w wizard
------------------------------------------------------------------- */
export const TCE_SPELL_RAW = [
  ["Booming Blade",0,"skw",{
    school: "evocation", page: 106,
    time: "1 action", range: "Self (5-foot radius)",
    comp: "S, M (a melee weapon worth at least 1 sp)", dur: "1 round",
    text: "You brandish the weapon used in the spell's casting and make a melee attack with it against one creature within 5 feet of you. On a hit, the target suffers the weapon attack's normal effects and then becomes sheathed in booming energy until the start of your next turn. If the target willingly moves 5 feet or more before then, the target takes 1d8 thunder damage, and the spell ends. This spell's damage increases when you reach certain levels. At 5th level, the melee attack deals an extra 1d8 thunder damage to the target on a hit, and the damage the target takes for moving increases to 2d8. Both damage rolls increase by 1d8 at 11th level (2d8 and 3d8) and again at 17th level (3d8 and 4d8).",
  }],
  ["Green-Flame Blade",0,"skw",{
    school: "evocation", page: 107,
    time: "1 action", range: "Self (5-foot radius)",
    comp: "S, M (a melee weapon worth at least 1 sp)", dur: "Instantaneous",
    text: "You brandish the weapon used in the spell's casting and make a melee attack with it against one creature within 5 feet of you. On a hit, the target suffers the weapon attack's normal effects, and you can cause green fire to leap from the target to a different creature of your choice that you can see within 5 feet of it. The second creature takes fire damage equal to your spellcasting ability modifier. This spell's damage increases when you reach certain levels. At 5th level, the melee attack deals an extra 1d8 fire damage to the target on a hit, and the fire damage to the second creature increases to 1d8 + your spellcasting ability modifier. Both damage rolls increase by 1d8 at 11th level (2d8 and 2d8) and 17th level (3d8 and 3d8).",
  }],
  ["Lightning Lure",0,"skw",{
    school: "evocation", page: 107,
    time: "1 action", range: "Self (15-foot radius)",
    comp: "V", dur: "Instantaneous",
    text: "You create a lash of lightning energy that strikes at one creature of your choice that you can see within 15 feet of you. The target must succeed on a Strength saving throw or be pulled up to 10 feet in a straight line toward you and then take 1d8 lightning damage if it is within 5 feet of you. This spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).",
  }],
  ["Mind Sliver",0,"skw",{
    school: "enchantment", page: 108,
    time: "1 action", range: "60 ft",
    comp: "V", dur: "1 round",
    text: "You drive a disorienting spike of psychic energy into the mind of one creature you can see within range. The target must succeed on an Intelligence saving throw or take 1d6 psychic damage and subtract 1d4 from the next saving throw it makes before the end of your next turn. This spell's damage increases by 1d6 when you reach certain levels: 5th level (2d6), 11th level (3d6), and 17th level (4d6).",
  }],
  ["Sword Burst",0,"skw",{
    school: "conjuration", page: 115,
    time: "1 action", range: "Self (5-foot radius)",
    comp: "V", dur: "Instantaneous",
    text: "You create a momentary circle of spectral blades that sweep around you. All other creatures within 5 feet of you must succeed on a Dexterity saving throw or take 1d6 force damage. This spell's damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).",
  }],
  ["Tasha's Caustic Brew",1,"sw",{
    school: "evocation", page: 115,
    time: "1 action", range: "Self (30-foot line)",
    comp: "V, S, M (a bit of rotten food)", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "A stream of acid emanates from you in a line 30 feet long and 5 feet wide in a direction you choose. Each creature in the line must succeed on a Dexterity saving throw or be covered in acid for the spell's duration or until a creature uses its action to scrape or wash the acid off itself or another creature. A creature covered in the acid takes 2d4 acid damage at start of each of its turns.",
    higher: "When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 2d4 for each slot level above 1st.",
  }],
  ["Summon Beast",2,"dr",{
    school: "conjuration", page: 109,
    time: "1 action", range: "90 ft",
    comp: "V, S, M (a feather, tuft of fur, and fish tail inside a gilded acorn worth at least 200 gp)", dur: "Concentration, up to 1 hour",
    conc: true,
    text: "You call forth a bestial spirit. It manifests in an unoccupied space that you can see within range. This corporeal form uses the Bestial Spirit stat block. When you cast the spell, choose an environment: Air, Land, or Water. The creature resembles an animal of your choice that is native to the chosen environment, which determines certain traits in its stat block. The creature disappears when it drops to 0 hit points or when the spell ends. The creature is an ally to you and your companions. In combat, the creature shares your initiative count, but it takes its turn immediately after yours. It obeys your verbal commands (no action required by you). If you don't issue any, it takes the Dodge action and uses its move to avoid danger.",
    higher: "When you cast this spell using a spell slot of 3rd level or higher, use the higher level wherever the spell's level appears in the stat block.",
  }],
  ["Tasha's Mind Whip",2,"sw",{
    school: "enchantment", page: 115,
    time: "1 action", range: "90 ft",
    comp: "V", dur: "1 round",
    text: "You psychically lash out at one creature you can see within range. The target must make an Intelligence saving throw. On a failed save, the target takes 3d6 psychic damage, and it can't take a reaction until the end of its next turn. Moreover, on its next turn, it must choose whether it gets a move, an action, or a bonus action; it gets only one of the three. On a successful save, the target takes half as much damage and suffers none of the spell's other effects.",
    higher: "When you cast this spell using a spell slot of 3rd level or higher, you can target one additional creature for each slot level above 2nd. The creatures must be within 30 feet of each other when you target them.",
  }],
  ["Intellect Fortress",3,"bskw",{
    school: "abjuration", page: 107,
    time: "1 action", range: "30 ft",
    comp: "V", dur: "Concentration, up to 1 hour",
    conc: true,
    text: "For the duration, you or one willing creature you can see within range has resistance to psychic damage, as well as advantage on Intelligence, Wisdom, and Charisma saving throws.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, you can target one additional creature for each slot level above 3rd. The creatures must be within 30 feet of each other when you target them.",
  }],
  ["Spirit Shroud",3,"cpkw",{
    school: "necromancy", page: 108,
    time: "1 bonus action", range: "Self",
    comp: "V, S", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "You call forth spirits of the dead, which flit around you for the spell's duration. The spirits are intangible and invulnerable. Until the spell ends, any attack you make deals 1d8 extra damage when you hit a creature within 10 feet of you. This damage is radiant, necrotic, or cold (your choice when you cast the spell). Any creature that takes this damage can't regain hit points until the start of your next turn. In addition, any creature of your choice that you can see that starts its turn within 10 feet of you has its speed reduced by 10 feet until the start of your next turn.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d8 for every two slot levels above 3rd.",
  }],
  ["Summon Fey",3,"drkw",{
    school: "conjuration", page: 112,
    time: "1 action", range: "90 ft",
    comp: "V, S, M (a gilded flower worth at least 300 gp)", dur: "Concentration, up to 1 hour",
    conc: true,
    text: "You call forth a fey spirit. It manifests in an unoccupied space that you can see within range. This corporeal form uses the Fey Spirit stat block. When you cast the spell, choose a mood: Fuming, Mirthful, or Tricksy. The creature resembles a fey creature of your choice marked by the chosen mood, which determines one of the traits in its stat block. The creature disappears when it drops to 0 hit points or when the spell ends. The creature is an ally to you and your companions. In combat, the creature shares your initiative count, but it takes its turn immediately after yours. It obeys your verbal commands (no action required by you). If you don't issue any, it takes the Dodge action and uses its move to avoid danger.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, use the higher level wherever the spell's level appears in the stat block.",
  }],
  ["Summon Shadowspawn",3,"kw",{
    school: "conjuration", page: 113,
    time: "1 action", range: "90 ft",
    comp: "V, S, M (tears inside a gem worth at least 300 gp)", dur: "Concentration, up to 1 hour",
    conc: true,
    text: "You call forth a shadowy spirit. It manifests in an unoccupied space that you can see within range. This corporeal form uses the Shadow Spirit stat block. When you cast the spell, choose an emotion: Fury, Despair, or Fear. The creature resembles a misshapen biped marked by the chosen emotion, which determines certain traits in its stat block. The creature disappears when it drops to 0 hit points or when the spell ends. The creature is an ally to you and your companions. In combat, the creature shares your initiative count, but it takes its turn immediately after yours. It obeys your verbal commands (no action required by you). If you don't issue any, it takes the Dodge action and uses its move to avoid danger.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, use the higher level wherever the spell's level appears in the stat block.",
  }],
  ["Summon Undead",3,"kw",{
    school: "necromancy", page: 114,
    time: "1 action", range: "90 ft",
    comp: "V, S, M (a gilded skull worth at least 300 gp)", dur: "Concentration, up to 1 hour",
    conc: true,
    text: "You call forth an undead spirit. It manifests in an unoccupied space that you can see within range. This corporeal form uses the Undead Spirit stat block. When you cast the spell, choose the creature's form: Ghostly, Putrid, or Skeletal. The spirit resembles an undead creature with the chosen form, which determines certain traits in its stat block. The creature disappears when it drops to 0 hit points or when the spell ends. The creature is an ally to you and your companions. In combat, the creature shares your initiative count, but it takes its turn immediately after yours. It obeys your verbal commands (no action required by you). If you don't issue any, it takes the Dodge action and uses its move to avoid danger.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, use the higher level wherever the spell's level appears in the stat block.",
  }],
];

/* Combat-table metadata, same fields and same provenance as
   phbSpells.js's PHB_COMBAT — spellAttack / savingThrow /
   damageInflict / conditionInflict read off the 5etools entries, the
   dice expression read out of the spell's own text.  Spells that make
   no attack, force no save and deal no damage carry nothing. */
const TCE_COMBAT = {
  "Booming Blade": { atk: "melee", dmg: "1d8", dmgType: "thunder" },
  "Green-Flame Blade": { atk: "melee", dmg: "1d8", dmgType: "fire" },
  "Lightning Lure": { save: "str", dmg: "1d8", dmgType: "lightning" },
  "Mind Sliver": { save: "int", dmg: "1d6", dmgType: "psychic" },
  "Sword Burst": { save: "dex", dmg: "1d6", dmgType: "force" },
  "Tasha's Caustic Brew": { save: "dex", dmg: "2d4", dmgType: "acid" },
  "Tasha's Mind Whip": { save: "int", dmg: "3d6", dmgType: "psychic" },
  "Spirit Shroud": { dmg: "1d8", dmgType: "varies" },
};

export const TCE_SPELLS = TCE_SPELL_RAW.map(([name, level, cls, meta]) => ({
  name, level, cls, src: "tce", ...meta, ...(TCE_COMBAT[name] || {}),
}));
