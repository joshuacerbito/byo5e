/* ------------------------------------------------------------------
   The actions any character can take, whatever their class — Dash,
   Disengage, Dodge and the rest.

   Hand-authored rather than mapped out of a pack, for the same reason
   ITEM_EFFECTS_OVERLAY is: the SRD packs this app ships carry classes,
   species, spells, items and the small reference collections (skills,
   languages, conditions), but no action list at all. See
   src/content/rules.js for what the packs do have.

   Two lists, because the two editions genuinely differ: 2024 folded
   "Cast a Spell" and "Use an Object" into Magic and Utilize and added
   Influence and Study. Picking by edition is the difference between a
   correct sheet and one quietly quoting the wrong book — the app lets
   you build under either.

   The text is deliberately our own summary rather than the SRD's own
   wording: this is a reminder at the table for a rule the player
   already owns, and it has to fit in a drawer.
------------------------------------------------------------------- */

const para = (name, text) => ({ name, blocks: [{ type: "para", text }] });

const ACTIONS_2024 = [
  para("Attack", "Make one attack with a weapon or an Unarmed Strike. Some features, like Extra Attack, let this action make more than one attack."),
  para("Dash", "Gain extra movement equal to your Speed for the rest of the turn."),
  para("Disengage", "Your movement doesn't provoke Opportunity Attacks for the rest of the turn."),
  para("Dodge", "Until your next turn, attack rolls against you have Disadvantage and you make Dexterity saving throws with Advantage. You lose this benefit if you have the Incapacitated condition or your Speed is 0."),
  para("Help", "Either give a creature Advantage on an ability check it makes, or distract an enemy within 5 feet so the next attack roll against it has Advantage."),
  para("Hide", "Make a DC 15 Dexterity (Stealth) check while out of sight of any enemy. On a success you have the Invisible condition until you make noise, attack, cast a spell, or are found."),
  para("Influence", "Urge a monster to do something. Make a Charisma (Deception, Intimidation, Performance, or Persuasion) or Wisdom (Animal Handling) check against the monster's DC."),
  para("Magic", "Cast a spell, use a magic item, or use a feature that says it takes the Magic action."),
  para("Ready", "Name a trigger and the action or move you'll take in response. When the trigger happens before your next turn, you take that response as a Reaction."),
  para("Search", "Make a Wisdom (Insight, Medicine, Perception, or Survival) check to find something."),
  para("Study", "Make an Intelligence (Arcana, History, Investigation, Nature, or Religion) check to recall or work out a piece of lore."),
  para("Utilize", "Use a nonmagical object."),
];

const ACTIONS_2014 = [
  para("Attack", "Make one melee or ranged attack. Some features, like Extra Attack, let this action make more than one attack."),
  para("Cast a Spell", "Cast a spell with a casting time of 1 action."),
  para("Dash", "Gain extra movement equal to your speed for the rest of the turn."),
  para("Disengage", "Your movement doesn't provoke opportunity attacks for the rest of the turn."),
  para("Dodge", "Until your next turn, attack rolls against you have disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage. You lose this benefit if you are incapacitated or your speed drops to 0."),
  para("Help", "Give an ally advantage on an ability check it makes before your next turn, or on its next attack roll against a creature within 5 feet of you."),
  para("Hide", "Make a Dexterity (Stealth) check to hide, following the rules for hiding."),
  para("Ready", "Name a trigger and the action or move you'll take in response. When the trigger happens before your next turn, you take that response as a reaction."),
  para("Search", "Devote your attention to finding something — usually a Wisdom (Perception) or Intelligence (Investigation) check."),
  para("Use an Object", "Interact with a second object, or use an object that needs an action to use."),
];

/* Anything that isn't the 2014 pack is the current rules — the same
   default the rest of the app takes. */
export const basicActions = (edition) => (edition === "2014" ? ACTIONS_2014 : ACTIONS_2024);
export const basicActionNames = (edition) => basicActions(edition).map((a) => a.name);
