#!/usr/bin/env node

import { extractCompetitiveSplits } from './wiki-parser.js';

const WIKI_BASE = 'https://wiki.guildwars2.com/index.php';

/**
 * Fetch the edit page for a skill/trait from the wiki
 * @param {string} name - The skill/trait name
 * @returns {Promise<string|null>} The wikitext content
 */
async function fetchWikiEditPage(name) {
  // Convert spaces to underscores for wiki URLs
  const pageName = name.replace(/ /g, '_');
  const url = `${WIKI_BASE}?title=${encodeURIComponent(pageName)}&action=edit`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GW2BuildSite/1.0 (https://github.com/your-repo; data collection for build editor)',
      },
    });
    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract wikitext from the textarea with id="wpTextbox1"
    const match = html.match(/<textarea[^>]*id="wpTextbox1"[^>]*>([\s\S]*?)<\/textarea>/);
    if (!match) {
      return null;
    }

    // Decode HTML entities
    let wikitext = match[1];
    wikitext = wikitext
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&');

    return wikitext;
  } catch (error) {
    console.error(`  ⚠️  Failed to fetch wiki page for "${name}":`, error.message);
    return null;
  }
}

/**
 * Scrape competitive split data for a skill
 * @param {object} skill - Skill object from GW2 API
 * @returns {Promise<object|null>} Competitive split data
 */
export async function scrapeSkillSplits(skill) {
  const wikitext = await fetchWikiEditPage(skill.name);
  if (!wikitext) return null;

  const splits = extractCompetitiveSplits(wikitext);
  if (!splits || Object.keys(splits.overrides).length === 0) {
    return null;
  }

  return splits;
}

/**
 * Scrape competitive split data for a trait
 * @param {object} trait - Trait object from GW2 API
 * @returns {Promise<object|null>} Competitive split data
 */
export async function scrapeTraitSplits(trait) {
  const wikitext = await fetchWikiEditPage(trait.name);
  if (!wikitext) return null;

  const splits = extractCompetitiveSplits(wikitext);
  if (!splits || Object.keys(splits.overrides).length === 0) {
    return null;
  }

  return splits;
}

/**
 * Enrich skills with competitive split data from wiki
 * @param {object[]} skills - Array of skills from GW2 API
 * @param {object} options - Options { delay, logProgress }
 * @returns {Promise<object[]>} Enriched skills
 */
export async function enrichSkillsWithSplits(skills, options = {}) {
  const { delay = 500, logProgress = true } = options;

  const enrichedSkills = [];
  const splitsMap = new Map(); // Map skill names to their splits

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];

    if (logProgress && i % 10 === 0) {
      console.log(`  Processing skill ${i + 1}/${skills.length}...`);
    }

    // Check if we already have splits for this skill name
    if (!splitsMap.has(skill.name)) {
      const splits = await scrapeSkillSplits(skill);
      splitsMap.set(skill.name, splits);

      // Be nice to the wiki server
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const splits = splitsMap.get(skill.name);

    // Merge splits into skill
    const enrichedSkill = { ...skill };

    if (splits && splits.overrides) {
      if (splits.overrides.pve) {
        enrichedSkill.pve = mergeOverride(skill, splits.overrides.pve);
      }
      if (splits.overrides.pvp) {
        enrichedSkill.pvp = mergeOverride(skill, splits.overrides.pvp);
      }
      if (splits.overrides.wvw) {
        enrichedSkill.wvw = mergeOverride(skill, splits.overrides.wvw);
      }

      // Handle mode-exclusive facts: filter out facts that are exclusive to other modes
      if (splits.split && splits.split.includes(',')) {
        const splitModes = splits.split.split(',').map(m => m.trim().toLowerCase());

        // Collect facts that are exclusive to each mode
        const pveFactStatuses = new Set(
          splits.overrides.pve?.facts?.map(f => f.status).filter(Boolean) || []
        );
        const pvpFactStatuses = new Set(
          splits.overrides.pvp?.facts?.map(f => f.status).filter(Boolean) || []
        );
        const wvwFactStatuses = new Set(
          splits.overrides.wvw?.facts?.map(f => f.status).filter(Boolean) || []
        );

        // Filter out mode-exclusive facts from other modes
        if (splitModes.includes('wvw') || splitModes.includes('wvw pvp')) {
          if (enrichedSkill.wvw && enrichedSkill.wvw.facts) {
            // Remove PvE-exclusive and PvP-exclusive facts from WvW
            enrichedSkill.wvw.facts = enrichedSkill.wvw.facts.filter(f => {
              const status = f.status?.toLowerCase();
              if (!status) return true; // Keep non-buff facts
              // Keep if it's in WvW overrides, or not exclusive to PvE/PvP
              return wvwFactStatuses.has(status) || (!pveFactStatuses.has(status) && !pvpFactStatuses.has(status));
            });
          } else if (skill.facts) {
            // No wiki override for WvW, create one by filtering base facts
            enrichedSkill.wvw = {
              facts: skill.facts.filter(f => !pveFactStatuses.has(f.status?.toLowerCase()))
            };
          }
        }

        if (splitModes.includes('pvp') || splitModes.includes('wvw pvp')) {
          if (enrichedSkill.pvp && enrichedSkill.pvp.facts) {
            // Remove PvE-exclusive and WvW-exclusive facts from PvP
            enrichedSkill.pvp.facts = enrichedSkill.pvp.facts.filter(f => {
              const status = f.status?.toLowerCase();
              if (!status) return true; // Keep non-buff facts
              // Keep if it's in PvP overrides, or not exclusive to PvE/WvW
              return pvpFactStatuses.has(status) || (!pveFactStatuses.has(status) && !wvwFactStatuses.has(status));
            });
          } else if (skill.facts) {
            // No wiki override for PvP, create one by filtering base facts
            enrichedSkill.pvp = {
              facts: skill.facts.filter(f => !pveFactStatuses.has(f.status?.toLowerCase()))
            };
          }
        }
      }
    }

    enrichedSkills.push(enrichedSkill);
  }

  return enrichedSkills;
}

/**
 * Enrich traits with competitive split data from wiki
 * @param {object[]} traits - Array of traits from GW2 API
 * @param {object} options - Options { delay, logProgress }
 * @returns {Promise<object[]>} Enriched traits
 */
export async function enrichTraitsWithSplits(traits, options = {}) {
  const { delay = 500, logProgress = true } = options;

  const enrichedTraits = [];
  const splitsMap = new Map();

  for (let i = 0; i < traits.length; i++) {
    const trait = traits[i];

    if (logProgress && i % 10 === 0) {
      console.log(`  Processing trait ${i + 1}/${traits.length}...`);
    }

    if (!splitsMap.has(trait.name)) {
      const splits = await scrapeTraitSplits(trait);
      splitsMap.set(trait.name, splits);

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const splits = splitsMap.get(trait.name);

    const enrichedTrait = { ...trait };

    if (splits && splits.overrides) {
      if (splits.overrides.pve) {
        enrichedTrait.pve = mergeOverride(trait, splits.overrides.pve);
      }
      if (splits.overrides.pvp) {
        enrichedTrait.pvp = mergeOverride(trait, splits.overrides.pvp);
      }
      if (splits.overrides.wvw) {
        enrichedTrait.wvw = mergeOverride(trait, splits.overrides.wvw);
      }

      // Handle mode-exclusive facts: filter out facts that are exclusive to other modes
      if (splits.split && splits.split.includes(',')) {
        const splitModes = splits.split.split(',').map(m => m.trim().toLowerCase());

        // Collect facts that are exclusive to each mode
        const pveFactStatuses = new Set(
          splits.overrides.pve?.facts?.map(f => f.status).filter(Boolean) || []
        );
        const pvpFactStatuses = new Set(
          splits.overrides.pvp?.facts?.map(f => f.status).filter(Boolean) || []
        );
        const wvwFactStatuses = new Set(
          splits.overrides.wvw?.facts?.map(f => f.status).filter(Boolean) || []
        );

        // Filter out mode-exclusive facts from other modes
        if (splitModes.includes('wvw') || splitModes.includes('wvw pvp')) {
          if (enrichedTrait.wvw && enrichedTrait.wvw.facts) {
            // Remove PvE-exclusive and PvP-exclusive facts from WvW
            enrichedTrait.wvw.facts = enrichedTrait.wvw.facts.filter(f => {
              const status = f.status?.toLowerCase();
              if (!status) return true; // Keep non-buff facts
              // Keep if it's in WvW overrides, or not exclusive to PvE/PvP
              return wvwFactStatuses.has(status) || (!pveFactStatuses.has(status) && !pvpFactStatuses.has(status));
            });
          } else if (trait.facts) {
            // No wiki override for WvW, create one by filtering base facts
            enrichedTrait.wvw = {
              facts: trait.facts.filter(f => !pveFactStatuses.has(f.status?.toLowerCase()))
            };
          }
        }

        if (splitModes.includes('pvp') || splitModes.includes('wvw pvp')) {
          if (enrichedTrait.pvp && enrichedTrait.pvp.facts) {
            // Remove PvE-exclusive and WvW-exclusive facts from PvP
            enrichedTrait.pvp.facts = enrichedTrait.pvp.facts.filter(f => {
              const status = f.status?.toLowerCase();
              if (!status) return true; // Keep non-buff facts
              // Keep if it's in PvP overrides, or not exclusive to PvE/WvW
              return pvpFactStatuses.has(status) || (!pveFactStatuses.has(status) && !wvwFactStatuses.has(status));
            });
          } else if (trait.facts) {
            // No wiki override for PvP, create one by filtering base facts
            enrichedTrait.pvp = {
              facts: trait.facts.filter(f => !pveFactStatuses.has(f.status?.toLowerCase()))
            };
          }
        }
      }
    }

    enrichedTraits.push(enrichedTrait);
  }

  return enrichedTraits;
}

/**
 * Merge wiki override into skill/trait data
 * @param {object} base - Base skill/trait from API
 * @param {object} override - Override data from wiki
 * @returns {object} Merged override
 */
function mergeOverride(base, override) {
  const merged = { ...override };

  // If override has facts, we need to merge them with base facts
  if (override.facts && override.facts.length > 0) {
    const baseFacts = base.facts || [];
    const overrideFacts = override.facts;

    // Start with base facts
    const mergedFacts = [...baseFacts];

    // Apply overrides (replace facts of the same type)
    for (const overrideFact of overrideFacts) {
      // Match by type, and for Buff/PrefixedBuff types, also match by status
      const existingIndex = mergedFacts.findIndex(f => {
        if (f.type !== overrideFact.type) return false;

        // For Buff/PrefixedBuff facts, match by status (the buff name like "alacrity", "quickness")
        if ((f.type === 'Buff' || f.type === 'PrefixedBuff') && f.status && overrideFact.status) {
          return f.status.toLowerCase() === overrideFact.status.toLowerCase();
        }

        // For other facts, match by text if both have it
        if (!f.text || !overrideFact.text) return true;
        return f.text.toLowerCase() === overrideFact.text.toLowerCase();
      });

      if (existingIndex !== -1) {
        // Replace existing fact, preserving text if override doesn't have it
        mergedFacts[existingIndex] = {
          ...mergedFacts[existingIndex],
          ...overrideFact,
          text: overrideFact.text || mergedFacts[existingIndex].text,
        };
      } else {
        // Add new fact
        mergedFacts.push(overrideFact);
      }
    }

    merged.facts = mergedFacts;
  }

  return merged;
}

/**
 * Get statistics on competitive splits found
 * @param {object[]} items - Array of skills or traits
 * @returns {object} Statistics
 */
export function getSplitStats(items) {
  let totalItems = items.length;
  let itemsWithPve = 0;
  let itemsWithPvp = 0;
  let itemsWithWvw = 0;

  for (const item of items) {
    if (item.pve) itemsWithPve++;
    if (item.pvp) itemsWithPvp++;
    if (item.wvw) itemsWithWvw++;
  }

  return {
    total: totalItems,
    withPve: itemsWithPve,
    withPvp: itemsWithPvp,
    withWvw: itemsWithWvw,
    withAnySplit: new Set([...items.filter(i => i.pve || i.pvp || i.wvw)]).size,
  };
}
