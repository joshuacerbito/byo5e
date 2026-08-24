/* ------------------------------------------------------------------
   Strixhaven: A Curriculum of Chaos (SCC) spells, levels 0-3.
   All five of the book's spells fall inside the reachable range at
   level 5, so this is the complete set — nothing filtered out.
   Text pulled from 5etools-src (data/spells/spells-scc.json), class
   eligibility from data/spells/sources.json's SCC block (the 2014
   "PHB"-source class entries, not the XPHB ones). {@tag} markup
   stripped; the Kinetic Jaunt bullet list is folded into prose.

   Shape matches phbSpells.js exactly so the two pools concatenate.
   `src: "scc"` is what tells the sheet and appendix where a spell
   came from — island spells carry no `src` at all, PHB ones "phb".

   Artificer is on three of these lists in the source data; this app
   has no artificer, so those tags are dropped rather than invented.
   None of the five is on the babaylan list (book p.224), so no "y".

   Class codes: b bard · c cleric · d druid · s sorcerer · k warlock · w wizard
------------------------------------------------------------------- */
export const SCC_SPELL_RAW = [
  ["Silvery Barbs",1,"bsw",{
    school: "enchantment", page: 38,
    time: "1 reaction, when a creature you can see within 60 ft succeeds on an attack roll, ability check, or saving throw",
    range: "60 ft", comp: "V", dur: "Instantaneous",
    text: "You magically distract the triggering creature and turn its momentary uncertainty into encouragement for another creature. The triggering creature must reroll the d20 and use the lower roll. You can then choose a different creature you can see within range (you can choose yourself). The chosen creature has advantage on the next attack roll, ability check, or saving throw it makes within 1 minute. A creature can be empowered by only one use of this spell at a time.",
  }],
  ["Borrowed Knowledge",2,"bckw",{
    school: "divination", page: 37,
    time: "1 action", range: "Self",
    comp: "V, S, M (a book worth at least 25 gp)", dur: "1 hour",
    text: "You draw on knowledge from spirits of the past. Choose one skill in which you lack proficiency. For the spell's duration, you have proficiency in the chosen skill. The spell ends early if you cast it again.",
  }],
  ["Kinetic Jaunt",2,"bsw",{
    school: "transmutation", page: 37,
    time: "1 bonus action", range: "Self",
    comp: "S", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "You magically empower your movement with dance-like steps, giving yourself the following benefits for the duration. Your walking speed increases by 10 feet. You don't provoke opportunity attacks. You can move through the space of another creature, and it doesn't count as difficult terrain; if you end your turn in another creature's space, you are shunted to the last unoccupied space you occupied, and you take 1d8 force damage.",
  }],
  ["Vortex Warp",2,"sw",{
    school: "conjuration", page: 38,
    time: "1 action", range: "90 ft",
    comp: "V, S", dur: "Instantaneous",
    text: "You magically twist space around another creature you can see within range. The target must succeed on a Constitution saving throw (the target can choose to fail), or the target is teleported to an unoccupied space of your choice that you can see within range. The chosen space must be on a surface or in a liquid that can support the target without the target having to squeeze. At Higher Levels. When you cast this spell using a spell slot of 3rd level or higher, the range of the spell increases by 30 feet for each slot level above 2nd.",
  }],
  ["Wither and Bloom",2,"dsw",{
    school: "necromancy", page: 38,
    time: "1 action", range: "60 ft",
    comp: "V, S, M (a withered vine twisted into a loop)", dur: "Instantaneous",
    text: "You invoke both death and life upon a 10-foot-radius sphere centered on a point within range. Each creature of your choice in that area must make a Constitution saving throw, taking 2d6 necrotic damage on a failed save, or half as much damage on a successful one. Nonmagical vegetation in that area withers. In addition, one creature of your choice in that area can spend and roll one of its unspent Hit Dice and regain a number of hit points equal to the roll plus your spellcasting ability modifier. At Higher Levels. When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot above the 2nd, and the number of Hit Dice that can be spent and added to the healing roll increases by one for each slot above 2nd.",
  }],
];

/* Combat-table metadata, same fields and same provenance as phbSpells.js's
   PHB_COMBAT — savingThrow/damageInflict off the 5etools entries. Two of
   the five carry nothing: Silvery Barbs and Borrowed Knowledge force no
   save and deal no damage. Kinetic Jaunt's 1d8 force is self-inflicted
   (ending your turn in another creature's space), not an attack, so it
   isn't listed as an effect either. */
const SCC_COMBAT = {
  "Vortex Warp": { save: "con" },
  "Wither and Bloom": { save: "con", dmg: "2d6", dmgType: "necrotic" },
};

export const SCC_SPELLS = SCC_SPELL_RAW.map(([name, level, cls, meta]) => ({
  name, level, cls, src: "scc", ...meta, ...(SCC_COMBAT[name] || {}),
}));
