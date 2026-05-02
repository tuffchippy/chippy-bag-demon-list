import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 * FIX: remove leading "/" for GitHub Pages
 */
const dir = '/chippy-bag-demon-list/data'; // ✅ FIXE D

/**
 * Fetch list of levels
 */
export async function fetchList() {
    try {
        const listResult = await fetch(`${dir}/_list.json`);
        const list = await listResult.json();

        if (!Array.isArray(list)) return null;

        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResult = await fetch(`${dir}/${path}.json`);
                    const level = await levelResult.json();

                    if (!level) return [null, path];

                    return [
                        {
                            ...level,
                            path,
                            records: Array.isArray(level.records)
                                ? level.records.sort(
                                      (a, b) => b.percent - a.percent
                                  )
                                : [],
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            })
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

/**
 * Fetch editors
 */
export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

/**
 * Build leaderboard
 */
export async function fetchLeaderboard() {
    const list = await fetchList();

    if (!list) return [[], []];

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err || !level) {
            errs.push(err || 'Unknown error');
            return;
        }

        const verifier =
            Object.keys(scoreMap).find(
                (u) =>
                    u.toLowerCase() === level.verifier?.toLowerCase()
            ) || level.verifier;

        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };

        scoreMap[verifier].verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        (level.records || []).forEach((record) => {
            const user =
                Object.keys(scoreMap).find(
                    (u) =>
                        u.toLowerCase() === record.user?.toLowerCase()
                ) || record.user;

            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };

            const entry = {
                rank: rank + 1,
                level: level.name,
                score: score(
                    rank + 1,
                    record.percent,
                    level.percentToQualify
                ),
                link: record.link,
            };

            if (record.percent === 100) {
                scoreMap[user].completed.push(entry);
            } else {
                scoreMap[user].progressed.push({
                    ...entry,
                    percent: record.percent,
                });
            }
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const total = [
            scores.verified,
            scores.completed,
            scores.progressed,
        ]
            .flat()
            .reduce((prev, cur) => prev + (cur?.score || 0), 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}
