/* ------------------------------------------------------------------
   Xanathar's Guide to Everything (XGE) spells, levels 0-3 — the
   reachable range at level 5.  XGE has 95 spells in total; the 49
   above 3rd level exist in the source data but are unreachable here.

   Text pulled from 5etools-src (data/spells/spells-xge.json) by
   scripts/extract-spells.mjs, class eligibility from the XGE block of
   data/spells/sources.json (the 2014 "PHB"-source class entries, not
   the XPHB ones).  Same shape as phbSpells.js so the pools concatenate.

   XGE is 2014 content — it predates the 2024 revision — so this is an
   ordinary content add, not an opt-in exception like Weapon Mastery.

   None of these is on the babaylan spell list (book p.224, which lists
   only Handbook and island spells), so none carries the "y" code.

   Class codes: b bard · c cleric · d druid · p paladin
                r ranger · s sorcerer · k warlock · w wizard
------------------------------------------------------------------- */
export const XGE_SPELL_RAW = [
  ["Control Flames",0,"dsw",{
    school: "transmutation", page: 152,
    time: "1 action", range: "60 ft",
    comp: "S", dur: "Instantaneous",
    text: "You choose nonmagical flame that you can see within range and that fits within a 5-foot cube. You affect it in one of the following ways: You instantaneously expand the flame 5 feet in one direction, provided that wood or other fuel is present in the new location. You instantaneously extinguish the flames within the cube. You double or halve the area of bright light and dim light cast by the flame, change its color, or both. The change lasts for 1 hour. You cause simple shapes—such as the vague form of a creature, an inanimate object, or a location—to appear within the flames and animate as you like. The shapes last for 1 hour. If you cast this spell multiple times, you can have up to three non-instantaneous effects created by it active at a time, and you can dismiss such an effect as an action.",
  }],
  ["Create Bonfire",0,"dskw",{
    school: "conjuration", page: 152,
    time: "1 action", range: "60 ft",
    comp: "V, S", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "You create a bonfire on ground that you can see within range. Until the spell ends, the magic bonfire fills a 5-foot cube. Any creature in the bonfire's space when you cast the spell must succeed on a Dexterity saving throw or take 1d8 fire damage. A creature must also make the saving throw when it moves into the bonfire's space for the first time on a turn or ends its turn there. The bonfire ignites flammable objects in its area that aren't being worn or carried. The spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).",
  }],
  ["Frostbite",0,"dskw",{
    school: "evocation", page: 156,
    time: "1 action", range: "60 ft",
    comp: "V, S", dur: "Instantaneous",
    text: "You cause numbing frost to form on one creature that you can see within range. The target must make a Constitution saving throw. On a failed save, the target takes 1d6 cold damage, and it has disadvantage on the next weapon attack roll it makes before the end of its next turn. The spell's damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).",
  }],
  ["Gust",0,"dsw",{
    school: "transmutation", page: 157,
    time: "1 action", range: "30 ft",
    comp: "V, S", dur: "Instantaneous",
    text: "You seize the air and compel it to create one of the following effects at a point you can see within range: One Medium or smaller creature that you choose must succeed on a Strength saving throw or be pushed up to 5 feet away from you. You create a small blast of air capable of moving one object that is neither held nor carried and that weighs no more than 5 pounds. The object is pushed up to 10 feet away from you. It isn't pushed with enough force to cause damage. You create a harmless sensory effect using air, such as causing leaves to rustle, wind to slam shutters closed, or your clothing to ripple in a breeze.",
  }],
  ["Infestation",0,"dskw",{
    school: "conjuration", page: 158,
    time: "1 action", range: "30 ft",
    comp: "V, S, M (a living flea)", dur: "Instantaneous",
    text: "You cause a cloud of mites, fleas, and other parasites to appear momentarily on one creature you can see within range. The target must succeed on a Constitution saving throw, or it takes 1d6 poison damage and moves 5 feet in a random direction if it can move and its speed is at least 5 feet. Roll a d4 for the direction: 1, north; 2, south; 3, east; or 4, west. This movement doesn't provoke opportunity attacks, and if the direction rolled is blocked, the target doesn't move. The spell's damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).",
  }],
  ["Magic Stone",0,"dk",{
    school: "transmutation", page: 160,
    time: "1 bonus action", range: "Touch",
    comp: "V, S", dur: "1 minute",
    text: "You touch one to three pebbles and imbue them with magic. You or someone else can make a ranged spell attack with one of the pebbles by throwing it or hurling it with a sling. If thrown, a pebble has a range of 60 feet. If someone else attacks with a pebble, that attacker adds your spellcasting ability modifier, not the attacker's, to the attack roll. On a hit, the target takes bludgeoning damage equal to 1d6 + your spellcasting ability modifier. Whether the attack hits or misses, the spell then ends on the stone. If you cast this spell again, the spell ends on any pebbles still affected by your previous casting.",
  }],
  ["Mold Earth",0,"dsw",{
    school: "transmutation", page: 162,
    time: "1 action", range: "30 ft",
    comp: "S", dur: "Instantaneous",
    text: "You choose a portion of dirt or stone that you can see within range and that fits within a 5-foot cube. You manipulate it in one of the following ways: If you target an area of loose earth, you can instantaneously excavate it, move it along the ground, and deposit it up to 5 feet away. This movement doesn't involve enough force to cause damage. You cause shapes, colors, or both to appear on the dirt or stone, spelling out words, creating images, or shaping patterns. The changes last for 1 hour. If the dirt or stone you target is on the ground, you cause it to become difficult terrain. Alternatively, you can cause the ground to become normal terrain if it is already difficult terrain. This change lasts for 1 hour. If you cast this spell multiple times, you can have no more than two of its non-instantaneous effects active at a time, and you can dismiss such an effect as an action.",
  }],
  ["Primal Savagery",0,"d",{
    school: "transmutation", page: 163,
    time: "1 action", range: "Self",
    comp: "S", dur: "Instantaneous",
    text: "You channel primal magic to cause your teeth or fingernails to sharpen, ready to deliver a corrosive attack. Make a melee spell attack against one creature within 5 feet of you. On a hit, the target takes 1d10 acid damage. After you make the attack, your teeth or fingernails return to normal. The spell's damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10).",
  }],
  ["Shape Water",0,"dsw",{
    school: "transmutation", page: 164,
    time: "1 action", range: "30 ft",
    comp: "S", dur: "Instantaneous",
    text: "You choose an area of water that you can see within range and that fits within a 5-foot cube. You manipulate it in one of the following ways: You instantaneously move or otherwise change the flow of the water as you direct, up to 5 feet in any direction. This movement doesn't have enough force to cause damage. You cause the water to form into simple shapes and animate at your direction. This change lasts for 1 hour. You change the water's color or opacity. The water must be changed in the same way throughout. This change lasts for 1 hour. You freeze the water, provided that there are no creatures in it. The water unfreezes in 1 hour. If you cast this spell multiple times, you can have no more than two of its non-instantaneous effects active at a time, and you can dismiss such an effect as an action.",
  }],
  ["Thunderclap",0,"bdskw",{
    school: "evocation", page: 168,
    time: "1 action", range: "5 ft",
    comp: "S", dur: "Instantaneous",
    text: "You create a burst of thunderous sound that can be heard up to 100 feet away. Each creature within range, other than you, must make a Constitution saving throw or take 1d6 thunder damage. The spell's damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).",
  }],
  ["Toll the Dead",0,"ckw",{
    school: "necromancy", page: 169,
    time: "1 action", range: "60 ft",
    comp: "V, S", dur: "Instantaneous",
    text: "You point at one creature you can see within range, and the sound of a dolorous bell fills the air around it for a moment. The target must succeed on a Wisdom saving throw or take 1d8 necrotic damage. If the target is missing any of its hit points, it instead takes 1d12 necrotic damage. The spell's damage increases by one die when you reach 5th level (2d8 or 2d12), 11th level (3d8 or 3d12), and 17th level (4d8 or 4d12).",
  }],
  ["Word of Radiance",0,"c",{
    school: "evocation", page: 171,
    time: "1 action", range: "5 ft",
    comp: "V, M (a holy symbol)", dur: "Instantaneous",
    text: "You utter a divine word, and burning radiance erupts from you. Each creature of your choice that you can see within range must succeed on a Constitution saving throw or take 1d6 radiant damage. The spell's damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).",
  }],
  ["Absorb Elements",1,"drsw",{
    school: "abjuration", page: 150,
    time: "1 reaction, which you take when you take acid, cold, fire, lightning, or thunder damage", range: "Self",
    comp: "S", dur: "1 round",
    text: "The spell captures some of the incoming energy, lessening its effect on you and storing it for your next melee attack. You have resistance to the triggering damage type until the start of your next turn. Also, the first time you hit with a melee attack on your next turn, the target takes an extra 1d6 damage of the triggering type, and the spell ends.",
    higher: "When you cast this spell using a spell slot of 2nd level or higher, the extra damage increases by 1d6 for each slot level above 1st.",
  }],
  ["Beast Bond",1,"dr",{
    school: "divination", page: 150,
    time: "1 action", range: "Touch",
    comp: "V, S, M (a bit of fur wrapped in a cloth)", dur: "Concentration, up to 10 minutes",
    conc: true,
    text: "You establish a telepathic link with one beast you touch that is friendly to you or charmed by you. The spell fails if the beast's Intelligence score is 4 or higher. Until the spell ends, the link is active while you and the beast are within line of sight of each other. Through the link, the beast can understand your telepathic messages to it, and it can telepathically communicate simple emotions and concepts back to you. While the link is active, the beast gains advantage on attack rolls against any creature within 5 feet of you that you can see.",
  }],
  ["Catapult",1,"sw",{
    school: "transmutation", page: 150,
    time: "1 action", range: "60 ft",
    comp: "S", dur: "Instantaneous",
    text: "Choose one object weighing 1 to 5 pounds within range that isn't being worn or carried. The object flies in a straight line up to 90 feet in a direction you choose before falling to the ground, stopping early if it impacts against a solid surface. If the object would strike a creature, that creature must make a Dexterity saving throw. On a failed save, the object strikes the target and stops moving. When the object strikes something, the object and what it strikes each take 3d8 bludgeoning damage.",
    higher: "When you cast this spell using a spell slot of 2nd level or higher, the maximum weight of objects that you can target with this spell increases by 5 pounds, and the damage increases by 1d8, for each slot level above 1st.",
  }],
  ["Cause Fear",1,"kw",{
    school: "necromancy", page: 151,
    time: "1 action", range: "60 ft",
    comp: "V", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "You awaken the sense of mortality in one creature you can see within range. A construct or an undead is immune to this effect. The target must succeed on a Wisdom saving throw or become frightened of you until the spell ends. The frightened target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.",
    higher: "When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st. The creatures must be within 30 feet of each other when you target them.",
  }],
  ["Ceremony",1,"cp",{
    school: "abjuration", page: 151,
    time: "1 hour", range: "Touch",
    comp: "V, S, M (25 gp worth of powdered silver, which the spell consumes)", dur: "Instantaneous",
    ritual: true,
    text: "You perform a special religious ceremony that is infused with magic. When you cast the spell, choose one of the following rites, the target of which must be within 10 feet of you throughout the casting. Atonement. You touch one willing creature whose alignment has changed, and you make a DC 20 Wisdom (Insight) check. On a successful check, you restore the target to its original alignment. Bless Water. You touch one vial of water and cause it to become holy water. Coming of Age. You touch one humanoid who is a young adult. For the next 24 hours, whenever the target makes an ability check, it can roll a d4 and add the number rolled to the ability check. A creature can benefit from this rite only once. Dedication. You touch one humanoid who wishes to be dedicated to your god's service. For the next 24 hours, whenever the target makes a saving throw, it can roll a d4 and add the number rolled to the save. A creature can benefit from this rite only once. Funeral Rite. You touch one corpse, and for the next 7 days, the target can't become undead by any means short of a wish spell. Wedding. You touch adult humanoids willing to be bonded together in marriage. For the next 7 days, each target gains a +2 bonus to AC while they are within 30 feet of each other. A creature can benefit from this rite again only if widowed.",
  }],
  ["Chaos Bolt",1,"s",{
    school: "evocation", page: 151,
    time: "1 action", range: "120 ft",
    comp: "V, S", dur: "Instantaneous",
    text: "You hurl an undulating, warbling mass of chaotic energy at one creature in range. Make a ranged spell attack against the target. On a hit, the target takes 2d8 + 1d6 damage. Choose one of the d8s. The number rolled on that die determines the attack's damage type, as shown below. Chaos Bolt — d8 1 / Damage Type Acid; d8 2 / Damage Type Cold; d8 3 / Damage Type Fire; d8 4 / Damage Type Force; d8 5 / Damage Type Lightning; d8 6 / Damage Type Poison; d8 7 / Damage Type Psychic; d8 8 / Damage Type Thunder. If you roll the same number on both d8s, the chaotic energy leaps from the target to a different creature of your choice within 30 feet of it. Make a new attack roll against the new target, and make a new damage roll, which could cause the chaotic energy to leap again. A creature can be targeted only once by each casting of this spell.",
    higher: "When you cast this spell using a spell slot of 2nd level or higher, each target takes 1d6 extra damage of the type rolled for each slot level above 1st.",
  }],
  ["Earth Tremor",1,"bdsw",{
    school: "evocation", page: 155,
    time: "1 action", range: "10 ft",
    comp: "V, S", dur: "Instantaneous",
    text: "You cause a tremor in the ground within range. Each creature other than you in that area must make a Dexterity saving throw. On a failed save, a creature takes 1d6 bludgeoning damage and is knocked prone. If the ground in that area is loose earth or stone, it becomes difficult terrain until cleared, with each 5-foot-diameter portion requiring at least 1 minute to clear by hand.",
    higher: "When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.",
  }],
  ["Ice Knife",1,"dsw",{
    school: "conjuration", page: 157,
    time: "1 action", range: "60 ft",
    comp: "S, M (a drop of water or piece of ice)", dur: "Instantaneous",
    text: "You create a shard of ice and fling it at one creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 piercing damage. Hit or miss, the shard then explodes. The target and each creature within 5 feet of it must succeed on a Dexterity saving throw or take 2d6 cold damage.",
    higher: "When you cast this spell using a spell slot of 2nd level or higher, the cold damage increases by 1d6 for each slot level above 1st.",
  }],
  ["Snare",1,"drw",{
    school: "abjuration", page: 165,
    time: "1 minute", range: "Touch",
    comp: "S, M (25 feet of rope, which the spell consumes)", dur: "8 hours",
    text: "As you cast this spell, you use the rope to create a circle with a 5-foot radius on the ground or the floor. When you finish casting, the rope disappears and the circle becomes a magic trap. This trap is nearly invisible, requiring a successful Intelligence (Investigation) check against your spell save DC to be discerned. The trap triggers when a Small, Medium, or Large creature moves onto the ground or the floor in the spell's radius. That creature must succeed on a Dexterity saving throw or be magically hoisted into the air, leaving it hanging upside down 3 feet above the ground or the floor. The creature is restrained there until the spell ends. A restrained creature can make a Dexterity saving throw at the end of each of its turns, ending the effect on itself on a success. Alternatively, the creature or someone else who can reach it can use an action to make an Intelligence (Arcana) check against your spell save DC. On a success, the restrained effect ends. After the trap is triggered, the spell ends when no creature is restrained by it.",
  }],
  ["Zephyr Strike",1,"r",{
    school: "transmutation", page: 171,
    time: "1 bonus action", range: "Self",
    comp: "V", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "You move like the wind. Until the spell ends, your movement doesn't provoke opportunity attacks. Once before the spell ends, you can give yourself advantage on one weapon attack roll on your turn. That attack deals an extra 1d8 force damage on a hit. Whether you hit or miss, your walking speed increases by 30 feet until the end of that turn.",
  }],
  ["Aganazzar's Scorcher",2,"sw",{
    school: "evocation", page: 150,
    time: "1 action", range: "30 ft",
    comp: "V, S, M (a red dragon's scale)", dur: "Instantaneous",
    text: "A line of roaring flame 30 feet long and 5 feet wide emanates from you in a direction you choose. Each creature in the line must make a Dexterity saving throw. A creature takes 3d8 fire damage on a failed save, or half as much damage on a successful one.",
    higher: "When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d8 for each slot level above 2nd.",
  }],
  ["Dragon's Breath",2,"sw",{
    school: "transmutation", page: 154,
    time: "1 bonus action", range: "Touch",
    comp: "V, S, M (a hot pepper)", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "You touch one willing creature and imbue it with the power to spew magical energy from its mouth, provided it has one. Choose acid, cold, fire, lightning, or poison. Until the spell ends, the creature can use an action to exhale energy of the chosen type in a 15-foot cone. Each creature in that area must make a Dexterity saving throw, taking 3d6 damage of the chosen type on a failed save, or half as much damage on a successful one.",
    higher: "When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot level above 2nd.",
  }],
  ["Dust Devil",2,"dsw",{
    school: "conjuration", page: 154,
    time: "1 action", range: "60 ft",
    comp: "V, S, M (a pinch of dust)", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "Choose an unoccupied 5-foot cube of air that you can see within range. An elemental force that resembles a dust devil appears in the cube and lasts for the spell's duration. Any creature that ends its turn within 5 feet of the dust devil must make a Strength saving throw. On a failed save, the creature takes 1d8 bludgeoning damage and is pushed 10 feet away from the dust devil. On a successful save, the creature takes half as much damage and isn't pushed. As a bonus action, you can move the dust devil up to 30 feet in any direction. If the dust devil moves over sand, dust, loose dirt, or light gravel, it sucks up the material and forms a 10-foot-radius cloud of debris around itself that lasts until the start of your next turn. The cloud heavily obscures its area.",
    higher: "When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d8 for each slot level above 2nd.",
  }],
  ["Earthbind",2,"dskw",{
    school: "transmutation", page: 154,
    time: "1 action", range: "300 ft",
    comp: "V", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "Choose one creature you can see within range. Yellow strips of magical energy loop around the creature. The target must succeed on a Strength saving throw, or its flying speed (if any) is reduced to 0 feet for the spell's duration. An airborne creature affected by this spell safely descends at 60 feet per round until it reaches the ground or the spell ends.",
  }],
  ["Healing Spirit",2,"dr",{
    school: "conjuration", page: 157,
    time: "1 bonus action", range: "60 ft",
    comp: "V, S", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "You call forth a nature spirit to soothe the wounded. The intangible spirit appears in a space that is a 5-foot cube you can see within range. The spirit looks like a transparent beast or fey (your choice). Until the spell ends, whenever you or a creature you can see moves into the spirit's space for the first time on a turn or starts its turn there, you can cause the spirit to restore 1d6 hit points to that creature (no action required). The spirit can't heal constructs or undead. The spirit can heal a number of times equal to 1 + your spellcasting ability modifier (minimum of twice). After healing that number of times, the spirit disappears. As a bonus action on your turn, you can move the spirit up to 30 feet to a space you can see.",
    higher: "When you cast this spell using a spell slot of 3rd level or higher, the healing increases by 1d6 for each slot level above 2nd.",
  }],
  ["Maximilian's Earthen Grasp",2,"sw",{
    school: "transmutation", page: 161,
    time: "1 action", range: "30 ft",
    comp: "V, S, M (a miniature hand sculpted from clay)", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "You choose a 5-foot-square unoccupied space on the ground that you can see within range. A Medium hand made from compacted soil rises there and reaches for one creature you can see within 5 feet of it. The target must make a Strength saving throw. On a failed save, the target takes 2d6 bludgeoning damage and is restrained for the spell's duration. As an action, you can cause the hand to crush the restrained target, which must make a Strength saving throw. The target takes 2d6 bludgeoning damage on a failed save, or half as much damage on a successful one. To break out, the restrained target can use its action to make a Strength check against your spell save DC. On a success, the target escapes and is no longer restrained by the hand. As an action, you can cause the hand to reach for a different creature or to move to a different unoccupied space within range. The hand releases a restrained target if you do either.",
  }],
  ["Mind Spike",2,"skw",{
    school: "divination", page: 162,
    time: "1 action", range: "60 ft",
    comp: "S", dur: "Concentration, up to 1 hour",
    conc: true,
    text: "You reach into the mind of one creature you can see within range. The target must make a Wisdom saving throw, taking 3d8 psychic damage on a failed save, or half as much damage on a successful one. On a failed save, you also always know the target's location until the spell ends, but only while the two of you are on the same plane of existence. While you have this knowledge, the target can't become hidden from you, and if it's invisible, it gains no benefit from that condition against you.",
    higher: "When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d8 for each slot level above 2nd.",
  }],
  ["Pyrotechnics",2,"bsw",{
    school: "transmutation", page: 163,
    time: "1 action", range: "60 ft",
    comp: "V, S", dur: "Instantaneous",
    text: "Choose an area of nonmagical flame that you can see and that fits within a 5-foot cube within range. You can extinguish the fire in that area, and you create either fireworks or smoke when you do so. Fireworks. The target explodes with a dazzling display of colors. Each creature within 10 feet of the target must succeed on a Constitution saving throw or become blinded until the end of your next turn. Smoke. Thick black smoke spreads out from the target in a 20-foot radius, moving around corners. The area of the smoke is heavily obscured. The smoke persists for 1 minute or until a strong wind disperses it.",
  }],
  ["Shadow Blade",2,"skw",{
    school: "illusion", page: 164,
    time: "1 bonus action", range: "Self",
    comp: "V, S", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "You weave together threads of shadow to create a sword of solidified gloom in your hand. This magic sword lasts until the spell ends. It counts as a simple melee weapon with which you are proficient. It deals 2d8 psychic damage on a hit and has the finesse, light, and thrown properties (range 20/60). In addition, when you use the sword to attack a target that is in dim light or darkness, you make the attack roll with advantage. If you drop the weapon or throw it, it dissipates at the end of the turn. Thereafter, while the spell persists, you can use a bonus action to cause the sword to reappear in your hand.",
    higher: "When you cast this spell using a 3rd- or 4th-level spell slot, the damage increases to 3d8. When you cast it using a 5th- or 6th-level spell slot, the damage increases to 4d8. When you cast it using a spell slot of 7th level or higher, the damage increases to 5d8.",
  }],
  ["Skywrite",2,"bdw",{
    school: "transmutation", page: 165,
    time: "1 action", range: "Sight",
    comp: "V, S", dur: "Concentration, up to 1 hour",
    ritual: true,
    conc: true,
    text: "You cause up to ten words to form in a part of the sky you can see. The words appear to be made of cloud and remain in place for the spell's duration. The words dissipate when the spell ends. A strong wind can disperse the clouds and end the spell early.",
  }],
  ["Snilloc's Snowball Swarm",2,"sw",{
    school: "evocation", page: 165,
    time: "1 action", range: "90 ft",
    comp: "V, S, M (a piece of ice or a small white rock chip)", dur: "Instantaneous",
    text: "A flurry of magic snowballs erupts from a point you choose within range. Each creature in a 5-foot-radius sphere centered on that point must make a Dexterity saving throw. A creature takes 3d6 cold damage on a failed save, or half as much damage on a successful one.",
    higher: "When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot level above 2nd.",
  }],
  ["Warding Wind",2,"bdsw",{
    school: "evocation", page: 170,
    time: "1 action", range: "Self",
    comp: "V", dur: "Concentration, up to 10 minutes",
    conc: true,
    text: "A strong wind (20 miles per hour) blows around you in a 10-foot radius and moves with you, remaining centered on you. The wind lasts for the spell's duration. The wind has the following effects: It deafens you and other creatures in its area. It extinguishes unprotected flames in its area that are torch-sized or smaller. It hedges out vapor, gas, and fog that can be dispersed by strong wind. The area is difficult terrain for creatures other than you. The attack rolls of ranged weapon attacks have disadvantage if the attacks pass in or out of the wind.",
  }],
  ["Catnap",3,"bsw",{
    school: "enchantment", page: 151,
    time: "1 action", range: "30 ft",
    comp: "S, M (a pinch of sand)", dur: "10 minutes",
    text: "You make a calming gesture, and up to three willing creatures of your choice that you can see within range fall unconscious for the spell's duration. The spell ends on a target early if it takes damage or someone uses an action to shake or slap it awake. If a target remains unconscious for the full duration, that target gains the benefit of a short rest, and it can't be affected by this spell again until it finishes a long rest.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, you can target one additional willing creature for each slot level above 3rd.",
  }],
  ["Enemies Abound",3,"bskw",{
    school: "enchantment", page: 155,
    time: "1 action", range: "120 ft",
    comp: "V, S", dur: "Concentration, up to 1 minute",
    conc: true,
    text: "You reach into the mind of one creature you can see and force it to make an Intelligence saving throw. A creature automatically succeeds if it is immune to being frightened. On a failed save, the target loses the ability to distinguish friend from foe, regarding all creatures it can see as enemies until the spell ends. Each time the target takes damage, it can repeat the saving throw, ending the effect on itself on a success. Whenever the affected creature chooses another creature as a target, it must choose the target at random from among the creatures it can see within range of the attack, spell, or other ability it's using. If an enemy provokes an opportunity attack from the affected creature, the creature must make that attack if it is able to.",
  }],
  ["Erupting Earth",3,"dsw",{
    school: "transmutation", page: 155,
    time: "1 action", range: "120 ft",
    comp: "V, S, M (a piece of obsidian)", dur: "Instantaneous",
    text: "Choose a point you can see on the ground within range. A fountain of churned earth and stone erupts in a 20-foot cube centered on that point. Each creature in that area must make a Dexterity saving throw. A creature takes 3d12 bludgeoning damage on a failed save, or half as much damage on a successful one. Additionally, the ground in that area becomes difficult terrain until cleared. Each 5-foot-square portion of the area requires at least 1 minute to clear by hand.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d12 for each slot level above 3rd.",
  }],
  ["Flame Arrows",3,"drsw",{
    school: "transmutation", page: 156,
    time: "1 action", range: "Touch",
    comp: "V, S", dur: "Concentration, up to 1 hour",
    conc: true,
    text: "You touch a quiver containing arrows or bolts. When a target is hit by a ranged weapon attack using a piece of ammunition drawn from the quiver, the target takes an extra 1d6 fire damage. The spell's magic ends on a piece of ammunition when it hits or misses, and the spell ends when twelve pieces of ammunition have been drawn from the quiver.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, the number of pieces of ammunition you can affect with this spell increases by two for each slot level above 3rd.",
  }],
  ["Life Transference",3,"cw",{
    school: "necromancy", page: 160,
    time: "1 action", range: "30 ft",
    comp: "V, S", dur: "Instantaneous",
    text: "You sacrifice some of your health to mend another creature's injuries. You take 4d8 necrotic damage, which can't be reduced in any way, and one creature of your choice that you can see within range regains a number of hit points equal to twice the necrotic damage you take.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d8 for each slot level above 3rd.",
  }],
  ["Melf's Minute Meteors",3,"sw",{
    school: "evocation", page: 161,
    time: "1 action", range: "Self",
    comp: "V, S, M (niter, sulfur, and pine tar formed into a bead)", dur: "Concentration, up to 10 minutes",
    conc: true,
    text: "You create six tiny meteors in your space. They float in the air and orbit you for the spell's duration. When you cast the spell—and as a bonus action on each of your turns thereafter—you can expend one or two of the meteors, sending them streaking toward a point or points you choose within 120 feet of you. Once a meteor reaches its destination or impacts against a solid surface, the meteor explodes. Each creature within 5 feet of the point where the meteor explodes must make a Dexterity saving throw. A creature takes 2d6 fire damage on a failed save, or half as much damage on a successful one.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, the number of meteors created increases by two for each slot level above 3rd.",
  }],
  ["Summon Lesser Demons",3,"kw",{
    school: "conjuration", page: 167,
    time: "1 action", range: "60 ft",
    comp: "V, S, M (a vial of blood from a humanoid killed within the past 24 hours)", dur: "Concentration, up to 1 hour",
    conc: true,
    text: "You utter foul words, summoning demons from the chaos of the Abyss. Roll on the following table to determine what appears. d6 1-2 / Demons Summoned Two demons of challenge rating 1 or lower; d6 3-4 / Demons Summoned Four demons of challenge rating 1/2 or lower; d6 5-6 / Demons Summoned Eight demons of challenge rating 1/4 or lower. The DM chooses the demons, such as manes or dretches, and you choose the unoccupied spaces you can see within range where they appear. A summoned demon disappears when it drops to 0 hit points or when the spell ends. The demons are hostile to all creatures, including you. Roll initiative for the summoned demons as a group, which has its own turns. The demons pursue and attack the nearest non-demons to the best of their ability. As part of casting the spell, you can form a circle on the ground with the blood used as a material component. The circle is large enough to encompass your space. While the spell lasts, the summoned demons can't cross the circle or harm it, and they can't target anyone within it. Using the material component in this manner consumes it when the spell ends.",
    higher: "When you cast this spell using a spell slot of 6th or 7th level, you summon twice as many demons. If you cast it using a spell slot of 8th or 9th level, you summon three times as many demons.",
  }],
  ["Thunder Step",3,"skw",{
    school: "conjuration", page: 168,
    time: "1 action", range: "90 ft",
    comp: "V", dur: "Instantaneous",
    text: "You teleport yourself to an unoccupied space you can see within range. Immediately after you disappear, a thunderous boom sounds, and each creature within 10 feet of the space you left must make a Constitution saving throw, taking 3d10 thunder damage on a failed save, or half as much damage on a successful one. The thunder can be heard from up to 300 feet away. You can bring along objects as long as their weight doesn't exceed what you can carry. You can also teleport one willing creature of your size or smaller who is carrying gear up to its carrying capacity. The creature must be within 5 feet of you when you cast this spell, and there must be an unoccupied space within 5 feet of your destination space for the creature to appear in; otherwise, the creature is left behind.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d10 for each slot level above 3rd.",
  }],
  ["Tidal Wave",3,"dsw",{
    school: "conjuration", page: 168,
    time: "1 action", range: "120 ft",
    comp: "V, S, M (a drop of water)", dur: "Instantaneous",
    text: "You conjure up a wave of water that crashes down on an area within range. The area can be up to 30 feet long, up to 10 feet wide, and up to 10 feet tall. Each creature in that area must make a Dexterity saving throw. On a failed save, a creature takes 4d8 bludgeoning damage and is knocked prone. On a successful save, a creature takes half as much damage and isn't knocked prone. The water then spreads out across the ground in all directions, extinguishing unprotected flames in its area and within 30 feet of it, and then it vanishes.",
  }],
  ["Tiny Servant",3,"w",{
    school: "transmutation", page: 168,
    time: "1 minute", range: "Touch",
    comp: "V, S", dur: "8 hours",
    text: "You touch one Tiny, nonmagical object that isn't attached to another object or a surface and isn't being carried by another creature. The target animates and sprouts little arms and legs, becoming a creature under your control until the spell ends or the creature drops to 0 hit points. See the stat block for its statistics. As a bonus action, you can mentally command the creature if it is within 120 feet of you. (If you control multiple creatures with this spell, you can command any or all of them at the same time, issuing the same command to each one.) You decide what action the creature will take and where it will move during its next turn, or you can issue a simple, general command, such as to fetch a key, stand watch, or stack some books. If you issue no commands, the servant does nothing other than defend itself against hostile creatures. Once given an order, the servant continues to follow that order until its task is complete. When the creature drops to 0 hit points, it reverts to its original form, and any remaining damage carries over to that form.",
    higher: "When you cast this spell using a spell slot of 4th level or higher, you can animate two additional objects for each slot level above 3rd.",
  }],
  ["Wall of Sand",3,"w",{
    school: "evocation", page: 170,
    time: "1 action", range: "90 ft",
    comp: "V, S, M (a handful of sand)", dur: "Concentration, up to 10 minutes",
    conc: true,
    text: "You create a wall of swirling sand on the ground at a point you can see within range. You can make the wall up to 30 feet long, 10 feet high, and 10 feet thick, and it vanishes when the spell ends. It blocks line of sight but not movement. A creature is blinded while in the wall's space and must spend 3 feet of movement for every 1 foot it moves there.",
  }],
  ["Wall of Water",3,"dsw",{
    school: "evocation", page: 170,
    time: "1 action", range: "60 ft",
    comp: "V, S, M (a drop of water)", dur: "Concentration, up to 10 minutes",
    conc: true,
    text: "You create a wall of water on the ground at a point you can see within range. You can make the wall up to 30 feet long, 10 feet high, and 1 foot thick, or you can make a ringed wall up to 20 feet in diameter, 20 feet high, and 1 foot thick. The wall vanishes when the spell ends. The wall's space is difficult terrain. Any ranged weapon attack that enters the wall's space has disadvantage on the attack roll, and fire damage is halved if the fire effect passes through the wall to reach its target. Spells that deal cold damage that pass through the wall cause the area of the wall they pass through to freeze solid (at least a 5-foot-square section is frozen). Each 5-foot-square frozen section has AC 5 and 15 hit points. Reducing a frozen section to 0 hit points destroys it. When a section is destroyed, the wall's water doesn't fill it.",
  }],
];

/* Combat-table metadata, same fields and same provenance as
   phbSpells.js's PHB_COMBAT — spellAttack / savingThrow /
   damageInflict / conditionInflict read off the 5etools entries, the
   dice expression read out of the spell's own text.  Spells that make
   no attack, force no save and deal no damage carry nothing. */
const XGE_COMBAT = {
  "Create Bonfire": { save: "dex", dmg: "1d8", dmgType: "fire" },
  "Frostbite": { save: "con", dmg: "1d6", dmgType: "cold" },
  "Gust": { save: "str" },
  "Infestation": { save: "con", dmg: "1d6", dmgType: "poison" },
  "Magic Stone": { atk: "ranged", dmg: "1d6", dmgType: "bludgeoning" },
  "Primal Savagery": { atk: "melee", dmg: "1d10", dmgType: "acid" },
  "Thunderclap": { save: "con", dmg: "1d6", dmgType: "thunder" },
  "Toll the Dead": { save: "wis", dmg: "1d8", dmgType: "necrotic" },
  "Word of Radiance": { save: "con", dmg: "1d6", dmgType: "radiant" },
  "Beast Bond": { cond: "charmed" },
  "Catapult": { save: "dex", dmg: "3d8", dmgType: "bludgeoning" },
  "Cause Fear": { save: "wis", cond: "frightened" },
  "Chaos Bolt": { atk: "ranged", dmg: "2d8 + 1d6", dmgType: "varies" },
  "Earth Tremor": { save: "dex", dmg: "1d6", dmgType: "bludgeoning", cond: "prone" },
  "Ice Knife": { atk: "ranged", save: "dex", dmg: "1d10", dmgType: "varies" },
  "Snare": { save: "dex", cond: "restrained" },
  "Zephyr Strike": { dmg: "1d8", dmgType: "force" },
  "Aganazzar's Scorcher": { save: "dex", dmg: "3d8", dmgType: "fire" },
  "Dragon's Breath": { save: "dex", dmg: "3d6", dmgType: "varies" },
  "Dust Devil": { save: "str", dmg: "1d8", dmgType: "bludgeoning" },
  "Earthbind": { save: "str" },
  "Healing Spirit": { heal: "1d6" },
  "Maximilian's Earthen Grasp": { save: "str", dmg: "2d6", dmgType: "bludgeoning", cond: "restrained" },
  "Mind Spike": { save: "wis", dmg: "3d8", dmgType: "psychic" },
  "Pyrotechnics": { save: "con", cond: "blinded" },
  "Shadow Blade": { dmg: "2d8", dmgType: "psychic" },
  "Snilloc's Snowball Swarm": { save: "dex", dmg: "3d6", dmgType: "cold" },
  "Warding Wind": { cond: "deafened" },
  "Catnap": { cond: "unconscious" },
  "Enemies Abound": { save: "int" },
  "Erupting Earth": { save: "dex", dmg: "3d12", dmgType: "bludgeoning" },
  "Flame Arrows": { dmg: "1d6", dmgType: "fire" },
  "Life Transference": { dmg: "4d8", dmgType: "necrotic" },
  "Melf's Minute Meteors": { save: "dex", dmg: "2d6", dmgType: "fire" },
  "Thunder Step": { save: "con", dmg: "3d10", dmgType: "thunder" },
  "Tidal Wave": { save: "dex", dmg: "4d8", dmgType: "bludgeoning", cond: "prone" },
  "Wall of Sand": { cond: "blinded" },
};

export const XGE_SPELLS = XGE_SPELL_RAW.map(([name, level, cls, meta]) => ({
  name, level, cls, src: "xge", ...meta, ...(XGE_COMBAT[name] || {}),
}));
